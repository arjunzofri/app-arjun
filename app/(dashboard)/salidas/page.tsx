import { db } from "@/db";
import SalidasShell from "@/components/salidas/SalidasShell";

export default async function SalidasPage() {

  const [productosData, bodegasData, modulosData] = await Promise.all([
    db.query.productos.findMany({
      with: {
        imagenes: { limit: 1 },
        stock: true,
      },
    }).then(rows => rows.filter((r: any) =>
      (r.stock || []).reduce((sum: number, s: any) => sum + s.cantidadActual, 0) > 0
    )),
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
