"use client"

import { useState } from "react"
import { Package } from "lucide-react"

export default function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="w-full h-40 bg-[#f0f3ff] flex items-center justify-center">
        <Package className="h-12 w-12 text-[#c4c6cf]" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-40 object-contain p-4 bg-white"
      onError={() => setError(true)}
    />
  )
}
