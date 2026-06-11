import { db } from "@/db";
import { sql } from "drizzle-orm";
import SalidasShell from "@/components/salidas/SalidasShell";

export default async function SalidasPage() {

  const [productosData, bodegasData, modulosData] = await Promise.all([
    db.query.productos.findMany({
      with: {
        imagenes: { limit: 1 },
        stock: true,
      },
      extras: {
        totalStock: sql<number>`COALESCE((SELECT SUM(st2.cantidad_actual) FROM stock st2 WHERE st2.producto_id = productos.id), 0)`.as('total_stock')
      },
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
