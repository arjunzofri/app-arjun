"use client"

import { cn } from "@/lib/utils"

type Modulo = { id: string; nombre: string }

type Props = {
  modulos: Modulo[]
  selected: string | null
  onSelect: (id: string) => void
}

export function BotonesModulo({ modulos, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {modulos.map((m) => {
        const num = m.nombre.replace(/\D/g, "")
        const isActive = selected === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl border-2 font-bold transition-all text-lg",
              isActive
                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
            )}
          >
            <span className={cn("text-2xl", isActive ? "text-[#adc8f5]" : "text-[#1e3a5f]")}>{num}</span>
            <span className="text-[10px] font-normal opacity-70">Módulo</span>
          </button>
        )
      })}
    </div>
  )
}
