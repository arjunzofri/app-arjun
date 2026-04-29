"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registrarEntrada } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Producto = { id: string; codigo: string; descripcion: string }
type Bodega = { id: string; nombre: string }

export default function EntradaManualForm({
  productos,
  bodegas,
}: {
  productos: Producto[]
  bodegas: Bodega[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    productoId: "",
    bodegaId: "",
    cantidad: 1,
    precioUnitario: "",
    notaVentaNumero: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await registrarEntrada({
        productoId: form.productoId,
        bodegaId: form.bodegaId,
        cantidad: Number(form.cantidad),
        precioUnitario: form.precioUnitario ? Number(form.precioUnitario) : undefined,
        notaVentaNumero: form.notaVentaNumero || undefined,
        origen: "manual",
      })
      setSuccess(true)
      setTimeout(() => router.push("/entradas"), 1500)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar entrada")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-900/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-900/50 bg-green-900/10 p-3 text-sm text-green-400">
          ✅ Entrada registrada con éxito
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Producto</Label>
          <select
            required
            value={form.productoId}
            onChange={e => setForm({ ...form, productoId: e.target.value })}
            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Seleccionar producto...</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>
                {p.codigo} — {p.descripcion}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Bodega Destino</Label>
          <select
            required
            value={form.bodegaId}
            onChange={e => setForm({ ...form, bodegaId: e.target.value })}
            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Seleccionar bodega...</option>
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Cantidad</Label>
          <Input
            type="number"
            min={1}
            required
            value={form.cantidad}
            onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })}
            className="bg-slate-950 border-slate-800"
          />
        </div>

        <div className="space-y-2">
          <Label>Precio Unitario (opcional)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.precioUnitario}
            onChange={e => setForm({ ...form, precioUnitario: e.target.value })}
            className="bg-slate-950 border-slate-800"
            placeholder="0.00"
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label>Número de Nota de Venta (opcional)</Label>
          <Input
            value={form.notaVentaNumero}
            onChange={e => setForm({ ...form, notaVentaNumero: e.target.value })}
            className="bg-slate-950 border-slate-800"
            placeholder="Ej: NV-2024-001"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
        >
          {loading ? "Registrando..." : "REGISTRAR ENTRADA"}
        </Button>
      </div>
    </form>
  )
}
