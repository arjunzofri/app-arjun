"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function BotonVolver() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#111c2d] transition-colors mb-4"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  )
}
