"use client"

import { useState } from "react"
import { createOrUpdateUsuario } from "@/lib/user-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Usuario = {
  id?: string
  nombre?: string
  email?: string
  rol?: "admin" | "operador"
}

export default function UsuarioModal({
  usuario,
  trigger,
}: {
  usuario?: Usuario
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? "",
    email: usuario?.email ?? "",
    password: "",
    rol: usuario?.rol ?? "operador",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createOrUpdateUsuario({ ...form, id: usuario?.id })
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar usuario")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>{trigger}</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-4">
          {usuario?.id ? "Editar Usuario" : "Invitar Usuario"}
        </h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-900/50 bg-red-900/10 p-3 text-sm text-red-400">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-900/50 bg-green-900/10 p-3 text-sm text-green-400">
            ✅ Usuario guardado con éxito
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              required
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="bg-slate-950 border-slate-800"
              placeholder="Nombre completo"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="bg-slate-950 border-slate-800"
              placeholder="usuario@arjun.cl"
            />
          </div>
          <div className="space-y-2">
            <Label>{usuario?.id ? "Nueva Contraseña (opcional)" : "Contraseña"}</Label>
            <Input
              type="password"
              required={!usuario?.id}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="bg-slate-950 border-slate-800"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <select
              value={form.rol}
              onChange={e => setForm({ ...form, rol: e.target.value as "admin" | "operador" })}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="operador">Operador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
            >
              {loading ? "Guardando..." : "GUARDAR"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-800 text-slate-300"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
