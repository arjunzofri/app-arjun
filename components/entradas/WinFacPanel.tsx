"use client"

import { useState } from "react"
import { registrarEntrada } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type WinFacProducto = {
  codigo: string
  detalle: string
  nroingreso: string
  cantcaja: number
  costo: number
  saldo: number
  empresa_id: number
}

type Bodega = { id: string; nombre: string }

export default function WinFacPanel({ bodegasData }: { bodegasData: Bodega[] }) {
  const [nroingreso, setNroingreso] = useState("")
  const [productos, setProductos] = useState<WinFacProducto[]>([])
  const [bodegaId, setBodegaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const buscar = async () => {
    if (!nroingreso.trim()) return
    setLoading(true)
    setError(null)
    setProductos([])
    setSuccess(false)

    try {
      const res = await fetch(`/api/entradas/winfac?nroingreso=${encodeURIComponent(nroingreso.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al buscar")
      if (data.productos.length === 0) {
        setError("No se encontraron productos para esa Nota de Venta")
      } else {
        setProductos(data.productos)
      }
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
        await registrarEntrada({
          productoId: undefined,
          bodegaId,
          cantidad: p.saldo > 0 ? p.saldo : p.cantcaja,
          precioUnitario: p.costo,
          notaVentaNumero: p.nroingreso,
          origen: "winfac",
          codigoExterno: p.codigo,
          descripcionExterna: p.detalle,
          packingExterno: p.cantcaja,
        })
      }
      setSuccess(true)
      setProductos([])
      setNroingreso("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-900/10 p-3 text-sm text-red-400">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-900/50 bg-green-900/10 p-3 text-sm text-green-400">
          ✅ Productos importados con éxito desde WinFac
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={nroingreso}
          onChange={e => setNroingreso(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
          placeholder="Ej: 101-25-037038-009-GLP"
          className="bg-slate-950 border-slate-800 font-mono text-sm"
        />
        <Button
          onClick={buscar}
          disabled={loading}
          className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 shrink-0"
        >
          {loading ? "Buscando..." : "BUSCAR NV"}
        </Button>
      </div>

      {productos.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-400 font-mono text-xs">CÓDIGO</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-mono text-xs">DESCRIPCIÓN</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-mono text-xs">PACKING</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-mono text-xs">SALDO</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-mono text-xs">COSTO USD</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="px-3 py-2 font-mono text-amber-400">{p.codigo}</td>
                    <td className="px-3 py-2 text-slate-300">{p.detalle}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{p.cantcaja}</td>
                    <td className="px-3 py-2 text-right text-slate-300 font-bold">{p.saldo}</td>
                    <td className="px-3 py-2 text-right text-slate-400">${p.costo}</td>
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
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
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
              className="bg-green-600 text-white font-bold hover:bg-green-700 shrink-0"
            >
              {importing ? "Importando..." : `CONFIRMAR INGRESO (${productos.length} productos)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
