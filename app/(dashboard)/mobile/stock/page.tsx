import { Package } from "lucide-react"

export default function MobileStockPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Package className="h-12 w-12 text-[#5e7397]" />
      <h1 className="text-xl font-bold text-[#1e293b]">Actualizar Stock</h1>
      <p className="text-sm text-[#64748b] text-center max-w-xs">
        Próximamente — podrás actualizar el stock contado desde tu celular.
      </p>
    </div>
  )
}
