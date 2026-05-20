"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera } from "lucide-react"

type Props = {
  productoId: string
  onSuccess?: (url: string) => void
}

export function BotonFoto({ productoId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/productos/${productoId}/imagenes`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Error al subir imagen")

      const data = await res.json()
      onSuccess?.(data.url)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al subir foto")
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ""
    }
  }

  return (
    <div className="inline-flex flex-col items-center">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#162e50] transition-colors disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        {uploading ? "Subiendo..." : "Foto"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
