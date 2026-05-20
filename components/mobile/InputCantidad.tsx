"use client"

type Props = {
  value: number
  onChange: (n: number) => void
  packing: number
  max: number
}

export function InputCantidad({ value, onChange, packing, max }: Props) {
  const cajas = packing > 1 ? Math.floor(value / packing) : null
  const unidades = packing > 1 ? value % packing : null

  return (
    <div>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={1}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n) && n >= 1 && n <= max) onChange(n)
          else if (e.target.value === "") onChange(1)
        }}
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
