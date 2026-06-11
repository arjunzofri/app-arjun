import { neon } from "@neondatabase/serverless";
import SalidasShell from "@/components/salidas/SalidasShell";

export default async function SalidasPage() {

  const s = neon(process.env.DATABASE_URL!);

  // Query productos con stock > 0 usando SQL 100% crudo (sin Drizzle)
  const productosRows = await s`
    SELECT
      p.id,
      p.codigo,
      p.descripcion,
      p.packing,
      p.codigo_personal,
      p.observaciones,
      p.ubicacion,
      p.knumezet,
      p.created_at,
      p.updated_at
    FROM public.productos p
    WHERE EXISTS (
      SELECT 1 FROM public.stock st WHERE st.producto_id = p.id AND st.cantidad_actual > 0
    )
    ORDER BY p.codigo
  `;

  const [bodegasData, modulosData] = await Promise.all([
    s`SELECT id, nombre FROM public.bodegas ORDER BY nombre`.then(rows =>
      rows.map((r: any) => ({ id: r.id, nombre: r.nombre }))
    ),
    s`SELECT id, nombre FROM public.modulos_destino ORDER BY nombre`.then(rows =>
      rows.map((r: any) => ({ id: r.id, nombre: r.nombre }))
    ),
  ]);

  // Fetch stock por bodega para cada producto
  const productoIds = productosRows.map((p: any) => p.id);
  let stockMap = new Map<string, { bodegaId: string; cantidadActual: number }[]>();

  if (productoIds.length > 0) {
    const stockRows = await s`
      SELECT st.producto_id, st.bodega_id, st.cantidad_actual
      FROM public.stock st
      WHERE st.producto_id = ANY(${productoIds}::uuid[])
        AND st.cantidad_actual > 0
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

  // Fetch imagenes (solo la primera por producto)
  let imagenMap = new Map<string, any[]>();
  if (productoIds.length > 0) {
    const imgRows = await s`
      SELECT pi.producto_id, pi.url, pi.cloudinary_public_id, pi.created_at
      FROM public.producto_imagenes pi
      WHERE pi.producto_id = ANY(${productoIds}::uuid[])
      ORDER BY pi.created_at ASC
    `;
    for (const row of imgRows) {
      const existing = imagenMap.get(row.producto_id as string);
      if (!existing) {
        imagenMap.set(row.producto_id as string, [{
          url: row.url,
          cloudinaryPublicId: row.cloudinary_public_id,
          createdAt: row.created_at,
        }]);
      }
    }
  }

  const productosData = productosRows.map((p: any) => ({
    id: p.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    packing: p.packing,
    codigoPersonal: p.codigo_personal,
    observaciones: p.observaciones,
    ubicacion: p.ubicacion,
    knumezet: p.knumezet,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    stock: stockMap.get(p.id) || [],
    imagenes: imagenMap.get(p.id) || [],
  }));

  return (
    <SalidasShell
      productosData={productosData}
      bodegasData={bodegasData}
      modulosData={modulosData}
    />
  );
}
