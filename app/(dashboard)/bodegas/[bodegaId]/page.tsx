import { db } from "@/db";
import { sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import { getVisaCorte } from "@/lib/utils/get-visa-corte";
import BodegaProductList from "@/components/bodegas/BodegaProductList";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

export default async function BodegaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bodegaId: string }>;
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { bodegaId } = await params;
  const { q, cursor } = await searchParams;

  const bodegaResult = await db.execute(sql`
    SELECT id, nombre FROM bodegas WHERE id = ${bodegaId}::uuid
  `);
  if (bodegaResult.rows.length === 0) notFound();
  const bodega = bodegaResult.rows[0] as { id: string; nombre: string };

  const allBodegas = await db.query.bodegas.findMany();

  const limit = 21;
  const searchTerm = q ? `%${q}%` : null;
  const corte = await getVisaCorte();

  let query;
  if (searchTerm && cursor) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND s.cantidad_actual > 0
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
        AND (p.knumezet IS NULL OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
        AND s.updated_at < ${cursor}::timestamptz
      ORDER BY s.updated_at DESC
      LIMIT ${limit}
    `;
  } else if (searchTerm) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND s.cantidad_actual > 0
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
        AND (p.knumezet IS NULL OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
      ORDER BY s.updated_at DESC
      LIMIT ${limit}
    `;
  } else if (cursor) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND s.cantidad_actual > 0
        AND (p.knumezet IS NULL OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
        AND s.updated_at < ${cursor}::timestamptz
      ORDER BY s.updated_at DESC
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             s.cantidad_actual, s.updated_at
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.bodega_id = ${bodegaId}::uuid
        AND s.cantidad_actual > 0
        AND (p.knumezet IS NULL OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
      ORDER BY s.updated_at DESC
      LIMIT ${limit}
    `;
  }

  const result = await db.execute(query);
  const rows = result.rows as {
    id: string; codigo: string; descripcion: string;
    packing: number; cantidad_actual: number; updated_at: string;
  }[];

  const hasMore = rows.length > 20;
  const productos = rows.slice(0, 20);
  const lastUpdated = productos.length > 0
    ? productos[productos.length - 1].updated_at
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

  const cursorParam = lastUpdated
    ? `&cursor=${encodeURIComponent(String(lastUpdated))}`
    : "";
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

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
            {productos.length} producto{productos.length !== 1 ? "s" : ""} con stock
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
          lastUpdated={lastUpdated}
          qParam={qParam}
          cursorParam={cursorParam}
        />
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-[#74777f]">
            {q
              ? "Sin resultados para esta búsqueda."
              : "No hay productos con stock en esta bodega."}
          </p>
          {q && (
            <Link href={`/bodegas/${bodegaId}`} className="text-sm text-[#1e3a5f] hover:underline">
              Mostrar todos los productos
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
