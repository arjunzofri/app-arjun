"use client"

import { useRef } from "react"

type Props = {
  value: number
  onChange: (n: number) => void
  packing: number
  max: number
}

export function InputCantidad({ value, onChange, packing, max }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const cajas = packing > 1 ? Math.floor(value / packing) : null
  const unidades = packing > 1 ? value % packing : null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(/[^0-9]/g, "")
    if (filtered === "") {
      onChange(1)
      return
    }
    const n = parseInt(filtered, 10)
    if (!isNaN(n) && n >= 1 && n <= max) onChange(n)
  }

  return (
    <div>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        min={1}
        max={max}
        value={value}
        onChange={handleChange}
        onFocus={() => ref.current?.select()}
        className="w-full h-14 text-center text-2xl font-bold border-2 border-[#c4c6cf] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
      />
      {packing > 1 && cajas !== null && unidades !== null && value > 0 && (
        <p className="text-center text-sm text-[#64748b] mt-1">
          = {cajas} caja{cajas !== 1 ? "s" : ""} + {unidades} unidad{unidades !== 1 ? "es" : ""}
        </p>
      )}
      <p className="text-center text-xs text-[#94a3b8] mt-0.5">
        Stock disponible: {max}
      </p>
    </div>
  )
}
