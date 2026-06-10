import { db } from "@/db"
import StockForm from "@/components/mobile/StockForm"

export default async function MobileStockPage() {
  const productos = await db.query.productos.findMany({
    with: { imagenes: { columns: { url: true } } }
  })
  const bodegas = await db.query.bodegas.findMany()
  const stocks = await db.query.stock.findMany({
    with: { bodega: { columns: { nombre: true } } }
  })

  const stocksPlanos = stocks
    .filter(s => s.bodega)
    .map(s => ({
      productoId: s.productoId,
      bodegaId: s.bodegaId,
      bodegaNombre: s.bodega!.nombre,
      cantidadActual: s.cantidadActual,
    }))

  return (
    <div className="max-w-md mx-auto">
      <StockForm productos={productos as any} bodegas={bodegas} stocks={stocksPlanos} />
    </div>
  )
}
