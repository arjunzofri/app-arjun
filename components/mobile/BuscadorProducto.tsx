"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Producto = {
  id: string
  codigo: string
  descripcion: string
  imagen?: string | null
  ubicacion?: string | null
}

type Props = {
  productos: Producto[]
  onSelect: (p: Producto) => void
  selected: Producto | null
}

export function BuscadorProducto({ productos, onSelect, selected }: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const results = query.length >= 1
    ? productos.filter(p =>
        p.codigo.toLowerCase().includes(query.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-3 p-3 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]">
          {selected.imagen && (
            <img src={selected.imagen} alt={selected.codigo} className="w-12 h-12 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#1e293b] truncate">{selected.codigo}</p>
            <p className="text-xs text-[#64748b] truncate">{selected.descripcion}</p>
          </div>
          <button onClick={() => { onSelect(null as any); setQuery("") }} className="text-[#64748b] hover:text-[#1e293b]">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="Buscar producto por código o descripción..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            className="w-full h-12 pl-10 pr-4 text-base border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full flex items-center gap-3 p-3 hover:bg-[#f1f5f9] transition-colors text-left border-b border-[#f1f5f9] last:border-0"
              onClick={() => { onSelect(p); setQuery(""); setOpen(false) }}
            >
              {p.imagen ? (
                <img src={p.imagen} alt={p.codigo} className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-[#e2e8f0] shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#1e293b]">{p.codigo}</p>
                <p className="text-xs text-[#64748b] truncate">{p.descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 1 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg p-4 text-center text-sm text-[#94a3b8]">
          Sin resultados
        </div>
      )}
    </div>
  )
}
