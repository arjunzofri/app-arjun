import { db } from "@/db";
import { sql } from "drizzle-orm";
import SalidasShell from "@/components/salidas/SalidasShell";
import { getVisaCorte } from "@/lib/utils/get-visa-corte";

export default async function SalidasPage() {
  const corte = await getVisaCorte();

  const [productosData, bodegasData, modulosData] = await Promise.all([
    db.query.productos.findMany({
      with: {
        imagenes: { limit: 1 },
        stock: true,
      },
      extras: {
        totalStock: sql<number>`COALESCE((SELECT SUM(cantidad_actual) FROM stock WHERE producto_id = productos.id), 0)`.as('total_stock')
      },
      where: (productos, { or, isNull }) => or(
        isNull(productos.knumezet),
        sql`(split_part(${productos.knumezet}, '-', 2)::bigint * 1000000 + split_part(${productos.knumezet}, '-', 3)::bigint) >= ${corte}`
      ),
    }).then(rows => rows.filter((r: any) => r.totalStock > 0)),
    db.query.bodegas.findMany(),
    db.query.modulosDestino.findMany(),
  ]);

  return (
    <SalidasShell
      productosData={productosData}
      bodegasData={bodegasData}
      modulosData={modulosData}
    />
  );
}
