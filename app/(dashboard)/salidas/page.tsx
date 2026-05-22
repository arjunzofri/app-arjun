import { db } from "@/db";
import { salidas } from "@/db/schema";
import { desc } from "drizzle-orm";
import SalidasShell from "@/components/salidas/SalidasShell";

export default async function SalidasPage() {
  const [productosData, bodegasData, modulosData, history] = await Promise.all([
    db.query.productos.findMany({
      with: {
        imagenes: { limit: 1 },
        stock: true,
      }
    }),
    db.query.bodegas.findMany(),
    db.query.modulosDestino.findMany(),
    db.query.salidas.findMany({
      orderBy: [desc(salidas.timestampSalida)],
      limit: 50,
      with: {
        producto: true,
        bodega: true,
        modulo: true,
        usuario: true
      }
    }),
  ]);

  return <SalidasShell productosData={productosData} bodegasData={bodegasData} modulosData={modulosData} history={history} />;
}
