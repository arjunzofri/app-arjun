import { db } from "@/db";
import { neon } from "@neondatabase/serverless";
import SalidasShell from "@/components/salidas/SalidasShell";

export default async function SalidasPage() {

  let productosRaw: any[];
  try {
    [productosRaw] = await Promise.all([
      db.query.productos.findMany({
        with: {
          imagenes: { limit: 1 },
        },
      }),
    ]);
    console.log("[salidas/page] Drizzle findMany OK, count:", productosRaw.length);
  } catch (e: any) {
    console.error("[salidas/page] Drizzle findMany ERROR:", e.message, e.stack);
    throw e;
  }

  const [bodegasData, modulosData] = await Promise.all([
    db.query.bodegas.findMany(),
    db.query.modulosDestino.findMany(),
  ]);

  // Fetch stock por separado para evitar LEFT JOIN ambiguo de Drizzle
  let stockMap = new Map<string, { bodegaId: string; cantidadActual: number }[]>();
  if (productosRaw.length > 0) {
    const s = neon(process.env.DATABASE_URL!);
    const productoIds = productosRaw.map((p: any) => p.id);
    console.log("[salidas/page] stock query about to run, ids:", productoIds.length);
    try {
      const stockRows = await s`
        SELECT producto_id, bodega_id, cantidad_actual
        FROM public.stock
        WHERE producto_id = ANY(${productoIds}::uuid[])
          AND cantidad_actual > 0
      `;
      console.log("[salidas/page] stock query OK, rows:", stockRows.length);
      for (const row of stockRows) {
        const entry = { bodegaId: row.bodega_id as string, cantidadActual: row.cantidad_actual as number };
        const existing = stockMap.get(row.producto_id as string);
        if (existing) {
          existing.push(entry);
        } else {
          stockMap.set(row.producto_id as string, [entry]);
        }
      }
    } catch (e: any) {
      console.error("[salidas/page] stock query ERROR:", e.message, e.stack);
      throw e;
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
