"use client"

import { useState, useRef, useCallback, useEffect } from "react"

type Props = {
  value: number
  onChange: (n: number) => void
  packing: number
  max: number
}

export function InputCantidad({ value, onChange, packing, max }: Props) {
  const [display, setDisplay] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)
  const cajas = packing > 1 ? Math.floor(value / packing) : null
  const unidades = packing > 1 ? value % packing : null

  // Sync display cuando value cambia desde fuera
  useEffect(() => {
    const dispNum = display === "" ? null : Number(display)
    if (dispNum !== null && dispNum === value) return
    setDisplay(String(value))
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "")
    if (raw === "") {
      setDisplay("")
      onChange(0)
      return
    }
    const n = parseInt(raw, 10)
    if (isNaN(n)) return
    const capped = Math.min(n, max)
    setDisplay(String(capped))
    onChange(capped)
  }, [onChange, max])

  const handleFocus = useCallback(() => {
    ref.current?.select()
  }, [])

  return (
    <div>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        className="w-full h-14 text-center text-2xl font-bold border-2 border-[#c4c6cf] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
      />
      {packing > 1 && cajas !== null && unidades !== null && value > 0 && (
        <p className="text-center text-sm text-[#64748b] mt-1">
          = {cajas} caja{cajas !== 1 ? "s" : ""} + {unidades} unidad{unidades !== 1 ? "es" : ""}
        </p>
      )}
      <p className={`text-center text-xs mt-0.5 ${value >= max ? 'text-red-500 font-semibold' : 'text-[#94a3b8]'}`}>
        Stock disponible: {max}
      </p>
    </div>
  )
}
