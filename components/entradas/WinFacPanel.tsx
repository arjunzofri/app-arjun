"use client"

import { useState } from "react"
import { registrarEntrada, createOrUpdateProducto } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type WinFacProducto = {
  codigo: string
  detalle: string
  cantcaja: number
  costo: number
  saldo: number
}

type Encabezado = {
  knumfoli: string
  visaadua: string
  fechanvt: string
  val_doc: number
  canbulto: number
  cliente: string
  empresa: string
}

type Bodega = { id: string; nombre: string }

export default function WinFacPanel({ bodegasData }: { bodegasData: Bodega[] }) {
  const [query, setQuery] = useState("")
  const [productos, setProductos] = useState<WinFacProducto[]>([])
  const [encabezado, setEncabezado] = useState<Encabezado | null>(null)
  const [bodegaId, setBodegaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const buscar = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setProductos([])
    setEncabezado(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/entradas/winfac?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al buscar")
      setEncabezado(data.encabezado)
      setProductos(data.productos)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar")
    } finally {
      setLoading(false)
    }
  }

  const confirmarIngreso = async () => {
    if (!bodegaId) {
      setError("Selecciona una bodega de destino")
      return
    }
    setImporting(true)
    setError(null)

    try {
      for (const p of productos) {
        // 1. Crear o actualizar el producto en App Arjun
        const resultado = await createOrUpdateProducto({
          codigo: p.codigo,
          descripcion: p.detalle,
          packing: Number(p.cantcaja),
          ubicacion: "",
          observaciones: "",
        })

        if (!resultado?.id) {
          throw new Error(`No se pudo crear el producto ${p.codigo}`)
        }

        // 2. Registrar la entrada con el productoId real
        await registrarEntrada({
          productoId: resultado.id,
          bodegaId,
          cantidad: p.saldo > 0 ? p.saldo : p.cantcaja,
          precioUnitario: Number(p.costo),
          notaVentaNumero: encabezado?.knumfoli,
          origen: "winfac",
        })
      }
      setSuccess(true)
      setProductos([])
      setEncabezado(null)
      setQuery("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✅ Productos importados con éxito desde WinFac
        </div>
      )}

      {encabezado && (
        <div className="rounded-lg border border-[#c4c6cf] bg-[#f0f3ff] p-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-[#74777f]">NV:</span>
            <span className="font-mono text-[#0051d5] font-bold">{parseInt(encabezado.knumfoli)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#74777f]">Visación:</span>
            <span className="font-mono text-[#111c2d]">{encabezado.visaadua}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#74777f]">Fecha:</span>
            <span className="text-[#111c2d]">{new Date(encabezado.fechanvt).toLocaleDateString('es-CL')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#74777f]">Total USD:</span>
            <span className="font-bold text-[#111c2d]">${encabezado.val_doc?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#74777f]">Bultos:</span>
            <span className="text-[#111c2d]">{encabezado.canbulto}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
          placeholder="NV (ej: 335) o visación (ej: 254348)"
          className="bg-[#f9f9ff] border-[#c4c6cf] font-mono text-sm"
        />
        <Button
          onClick={buscar}
          disabled={loading}
          className="bg-[#16a34a] text-white font-bold hover:bg-[#15803d] shrink-0"
        >
          {loading ? "Buscando..." : "BUSCAR NV"}
        </Button>
      </div>

      {productos.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#c4c6cf] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#e7eeff]">
                <tr>
                  <th className="text-left px-3 py-2 text-[#74777f] font-mono text-xs">CÓDIGO</th>
                  <th className="text-left px-3 py-2 text-[#74777f] font-mono text-xs">DESCRIPCIÓN</th>
                  <th className="text-right px-3 py-2 text-[#74777f] font-mono text-xs">PACKING</th>
                  <th className="text-right px-3 py-2 text-[#74777f] font-mono text-xs">SALDO</th>
                  <th className="text-right px-3 py-2 text-[#74777f] font-mono text-xs">COSTO USD</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i} className="border-t border-[#c4c6cf]">
                    <td className="px-3 py-2 font-mono text-[#0051d5]">{p.codigo}</td>
                    <td className="px-3 py-2 text-[#43474e]">{p.detalle}</td>
                    <td className="px-3 py-2 text-right text-[#74777f]">{p.cantcaja}</td>
                    <td className="px-3 py-2 text-right text-[#43474e] font-bold">{p.saldo}</td>
                    <td className="px-3 py-2 text-right text-[#74777f]">${p.costo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>Bodega de destino</Label>
              <select
                value={bodegaId}
                onChange={e => setBodegaId(e.target.value)}
                className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
              >
                <option value="">Seleccionar bodega...</option>
                {bodegasData.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={confirmarIngreso}
              disabled={importing}
              className="bg-[#16a34a] text-white font-bold hover:bg-[#15803d] shrink-0"
            >
              {importing ? "Importando..." : `CONFIRMAR INGRESO (${productos.length} productos)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

