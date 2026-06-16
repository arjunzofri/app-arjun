import { db } from "@/db";
import { sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import BodegaProductList from "@/components/bodegas/BodegaProductList";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function BodegaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bodegaId: string }>;
  searchParams: Promise<{ q?: string; cursorId?: string; soloConStock?: string }>;
}) {
  const { bodegaId } = await params;
  const { q, cursorId, soloConStock: soloConStockRaw } = await searchParams;
  const filtrarSinStock = soloConStockRaw !== "false"; // default: true
  const session = await auth();
  const userRole = session?.user?.role || "operador";

  const bodegaResult = await db.execute(sql`
    SELECT id, nombre FROM bodegas WHERE id = ${bodegaId}::uuid
  `);
  if (bodegaResult.rows.length === 0) notFound();
  const bodega = bodegaResult.rows[0] as { id: string; nombre: string };

  const allBodegas = await db.query.bodegas.findMany();

  const limit = 21;
  const searchTerm = q ? `%${q}%` : null;

  // Fragmento SQL condicional: filtro de stock > 0 (default true)
  const stockFilter = filtrarSinStock ? sql`AND s.cantidad_actual > 0` : sql``;

  // COUNT query: mismo filtro que la principal pero sin cursor ni LIMIT,
  // para mostrar el total real en el subtítulo (no solo la página actual)
  const countQuery = searchTerm
    ? sql`
      SELECT COUNT(*)::int AS total
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
        ${stockFilter}
    `
    : sql`
      SELECT COUNT(*)::int AS total
      FROM stock s
      WHERE s.bodega_id = ${bodegaId}::uuid
      ${stockFilter}
    `;

  let query;
  if (searchTerm && cursorId) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             p.codigo_personal, p.observaciones,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
        AND p.id < ${cursorId}::uuid
        ${stockFilter}
      ORDER BY (CASE WHEN s.cantidad_actual > 0 THEN 0 ELSE 1 END), p.id DESC
      LIMIT ${limit}
    `;
  } else if (searchTerm) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             p.codigo_personal, p.observaciones,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
        ${stockFilter}
      ORDER BY (CASE WHEN s.cantidad_actual > 0 THEN 0 ELSE 1 END), p.id DESC
      LIMIT ${limit}
    `;
  } else if (cursorId) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             p.codigo_personal, p.observaciones,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND p.id < ${cursorId}::uuid
        ${stockFilter}
      ORDER BY (CASE WHEN s.cantidad_actual > 0 THEN 0 ELSE 1 END), p.id DESC
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             p.codigo_personal, p.observaciones,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        ${stockFilter}
      ORDER BY (CASE WHEN s.cantidad_actual > 0 THEN 0 ELSE 1 END), p.id DESC
      LIMIT ${limit}
    `;
  }

  const [result, countResult] = await Promise.all([
    db.execute(query),
    db.execute(countQuery),
  ]);
  const totalProductos = (countResult.rows[0] as { total: number } | undefined)?.total ?? 0;
  const rows = result.rows as {
    id: string; codigo: string; descripcion: string;
    packing: number; codigo_personal: string | null; observaciones: string | null;
    cantidad_actual: number; updated_at: string;
  }[];

  const hasMore = rows.length > 20;
  const productos = rows.slice(0, 20);
  const lastId = productos.length > 0
    ? productos[productos.length - 1].id
    : null;

  // Resolver imágenes: DB primero, Cloudinary fallback
  const productoIds = productos.map((p) => p.id);
  let imagenMap = new Map<string, string>();
  if (productoIds.length > 0) {
    const s = neon(process.env.DATABASE_URL!);
    const imgRows = await s`
      SELECT pi.producto_id, pi.url
      FROM public.producto_imagenes pi
      WHERE pi.producto_id = ANY(${productoIds}::uuid[])
      ORDER BY pi.created_at ASC
    `;
    for (const ir of imgRows) {
      if (!imagenMap.has(ir.producto_id)) {
        imagenMap.set(ir.producto_id, ir.url);
      }
    }
  }

  const cursorParam = lastId
    ? `&cursorId=${encodeURIComponent(lastId)}`
    : "";
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
  const scsParam = filtrarSinStock ? "" : "&soloConStock=false";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/bodegas"
          className="p-1 text-[#74777f] hover:text-[#111c2d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111c2d]">{bodega.nombre}</h1>
          <p className="text-sm text-[#74777f]">
            {totalProductos} producto{totalProductos !== 1 ? "s" : ""} con stock
          </p>
        </div>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Buscar por código o descripción..."
            className="w-full pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162e50] transition-colors"
        >
          Buscar
        </button>
        {q && (
          <Link
            href={`/bodegas/${bodegaId}`}
            className="px-3 py-2 text-[#74777f] text-sm hover:text-[#111c2d] self-center"
          >
            Limpiar
          </Link>
        )}
      </form>

      {productos.length > 0 ? (
        <BodegaProductList
          productos={productos}
          bodegaOrigenId={bodegaId}
          bodegas={allBodegas}
          imagenMap={imagenMap}
          hasMore={hasMore}
          cursorId={lastId}
          qParam={qParam}
          scsParam={scsParam}
          userRole={userRole}
        />
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-[#74777f]">
            {q
              ? "Sin resultados para esta búsqueda."
              : filtrarSinStock
                ? "No hay productos con stock en esta bodega."
                : "No hay productos en esta bodega."}
          </p>
          {(q || filtrarSinStock) && (
            <Link href={`/bodegas/${bodegaId}${filtrarSinStock ? "?soloConStock=false" : ""}`} className="text-sm text-[#1e3a5f] hover:underline">
              {filtrarSinStock ? "Mostrar todos los productos" : "Limpiar búsqueda"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
