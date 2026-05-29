"use client"

import { useState } from "react"
import { X, ArrowRightLeft } from "lucide-react"

type Bodega = { id: string; nombre: string }

type Producto = {
  id: string
  codigo: string
  descripcion: string
  cantidad_actual: number
  packing: number
}

type Props = {
  producto: Producto
  bodegaOrigenId: string
  bodegas: Bodega[]
  onSuccess: () => void
  onClose: () => void
}

export default function TrasladoModal({
  producto,
  bodegaOrigenId,
  bodegas,
  onSuccess,
  onClose,
}: Props) {
  const [bodegaDestinoId, setBodegaDestinoId] = useState("")
  const [cantidad, setCantidad] = useState(0)
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bodegasDisponibles = bodegas.filter((b) => b.id !== bodegaOrigenId)
  const bodegaOrigen = bodegas.find((b) => b.id === bodegaOrigenId)
  const stockActual = producto.cantidad_actual

  const handleSubmit = async () => {
    setError(null)

    if (!bodegaDestinoId) {
      setError("Selecciona una bodega de destino")
      return
    }
    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0")
      return
    }
    if (cantidad > stockActual) {
      setError(`Stock insuficiente. Disponible: ${stockActual}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/traslados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: producto.id,
          bodegaOrigenId,
          bodegaDestinoId,
          cantidad,
          observaciones: observaciones || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al trasladar")

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al trasladar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#1e3a5f]" />
            <h2 className="text-lg font-bold text-[#111c2d]">Trasladar producto</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#74777f] hover:text-[#111c2d] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Producto info */}
        <div className="bg-[#f1f5f9] rounded-lg p-3 space-y-1">
          <p className="text-sm font-mono font-bold text-[#1e3a5f]">{producto.codigo}</p>
          <p className="text-xs text-[#74777f]">{producto.descripcion}</p>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-[#74777f]">Origen:</span>
            <span className="font-medium text-[#111c2d]">{bodegaOrigen?.nombre ?? "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#74777f]">Stock disponible:</span>
            <span className="font-bold text-[#111c2d]">{stockActual.toLocaleString("es-CL")} u</span>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Bodega destino */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#74777f]">Bodega destino</label>
          <select
            value={bodegaDestinoId}
            onChange={(e) => setBodegaDestinoId(e.target.value)}
            className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
          >
            <option value="">Seleccionar bodega...</option>
            {bodegasDisponibles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#74777f]">
            Cantidad (máx: {stockActual.toLocaleString("es-CL")})
          </label>
          <input
            type="number"
            min={1}
            max={stockActual}
            value={cantidad || ""}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
            placeholder="0"
          />
        </div>

        {/* Observaciones */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#74777f]">Observaciones (opcional)</label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
            placeholder="Ej: reorganización de stock"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#162e50] transition-colors disabled:opacity-50"
        >
          {loading ? "Trasladando..." : `Trasladar ${cantidad > 0 ? cantidad.toLocaleString("es-CL") : ""} u`}
        </button>
      </div>
    </div>
  )
}
