import { db } from "@/db";
import { neon } from "@neondatabase/serverless";
import SalidasShell from "@/components/salidas/SalidasShell";

export default async function SalidasPage() {

  const [productosRaw, bodegasData, modulosData] = await Promise.all([
    db.query.productos.findMany({
      with: {
        imagenes: { limit: 1 },
      },
    }),
    db.query.bodegas.findMany(),
    db.query.modulosDestino.findMany(),
  ]);

  // Fetch stock por separado para evitar LEFT JOIN ambiguo de Drizzle
  let stockMap = new Map<string, { bodegaId: string; cantidadActual: number }[]>();
  if (productosRaw.length > 0) {
    const s = neon(process.env.DATABASE_URL!);
    const productoIds = productosRaw.map((p: any) => p.id);
    const sqlQuery = `SELECT producto_id, bodega_id, cantidad_actual FROM public.stock WHERE producto_id = ANY($1::uuid[]) AND cantidad_actual > 0`;
    console.log("[salidas/page] stock query:", sqlQuery, "ids:", productoIds.length);
    const stockRows = await s`
      SELECT producto_id, bodega_id, cantidad_actual
      FROM public.stock
      WHERE producto_id = ANY(${productoIds}::uuid[])
        AND cantidad_actual > 0
    `;
    for (const row of stockRows) {
      const entry = { bodegaId: row.bodega_id as string, cantidadActual: row.cantidad_actual as number };
      const existing = stockMap.get(row.producto_id as string);
      if (existing) {
        existing.push(entry);
      } else {
        stockMap.set(row.producto_id as string, [entry]);
      }
    }
  }

  const productosData = productosRaw
    .filter((p: any) => stockMap.has(p.id))
    .map((p: any) => ({ ...p, stock: stockMap.get(p.id) || [] }));

  return (
    <SalidasShell
      productosData={productosData}
      bodegasData={bodegasData}
      modulosData={modulosData}
    />
  );
}
