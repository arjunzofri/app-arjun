import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search, AlertTriangle } from "lucide-react";

export default async function ModuloDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduloId: string }>;
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { moduloId } = await params;
  const { q, cursor } = await searchParams;

  let modulo: { id: string; nombre: string } | null = null;
  let productos: any[] = [];
  let hasMore = false;
  let lastUpdated: string | null = null;
  let dbError: string | null = null;
  const imagenMap = new Map<string, string>();

  try {
    const moduloResult = await db.execute(sql`
      SELECT id, nombre FROM modulos_destino WHERE id = ${moduloId}::uuid
    `);
    if (moduloResult.rows.length === 0) notFound();
    modulo = moduloResult.rows[0] as { id: string; nombre: string };

    const limit = 21;
    const searchTerm = q ? `%${q}%` : null;

  let query;
  if (searchTerm && cursor) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             sm.cantidad_acumulada, sm.updated_at
      FROM stock_modulos sm
      JOIN productos p ON p.id = sm.producto_id
      WHERE sm.modulo_id = ${moduloId}::uuid
        AND sm.cantidad_acumulada > 0
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
        AND sm.updated_at < ${cursor}::timestamptz
      ORDER BY sm.updated_at DESC
      LIMIT ${limit}
    `;
  } else if (searchTerm) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             sm.cantidad_acumulada, sm.updated_at
      FROM stock_modulos sm
      JOIN productos p ON p.id = sm.producto_id
      WHERE sm.modulo_id = ${moduloId}::uuid
        AND sm.cantidad_acumulada > 0
        AND (p.codigo ILIKE ${searchTerm} OR p.descripcion ILIKE ${searchTerm})
      ORDER BY sm.updated_at DESC
      LIMIT ${limit}
    `;
  } else if (cursor) {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             sm.cantidad_acumulada, sm.updated_at
      FROM stock_modulos sm
      JOIN productos p ON p.id = sm.producto_id
      WHERE sm.modulo_id = ${moduloId}::uuid
        AND sm.cantidad_acumulada > 0
        AND sm.updated_at < ${cursor}::timestamptz
      ORDER BY sm.updated_at DESC
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT p.id, p.codigo, p.descripcion, p.packing,
             sm.cantidad_acumulada, sm.updated_at
      FROM stock_modulos sm
      JOIN productos p ON p.id = sm.producto_id
      WHERE sm.modulo_id = ${moduloId}::uuid
        AND sm.cantidad_acumulada > 0
      ORDER BY sm.updated_at DESC
      LIMIT ${limit}
    `;
  }

    const result = await db.execute(query!);
    const rows = result.rows as {
      id: string; codigo: string; descripcion: string;
      packing: number; cantidad_acumulada: number; updated_at: string;
    }[];

    hasMore = rows.length > 20;
    productos = rows.slice(0, 20);
    lastUpdated = productos.length > 0
      ? productos[productos.length - 1].updated_at
      : null;

    // Resolver imágenes: DB primero, Cloudinary fallback
    const productoIds = productos.map((p: any) => p.id);
    if (productoIds.length > 0) {
      const imgRows = await db.execute(sql`
        SELECT pi.producto_id, pi.url
        FROM producto_imagenes pi
        WHERE pi.producto_id = ANY(${productoIds}::uuid[])
        ORDER BY pi.created_at ASC
      `);
      for (const ir of imgRows.rows as any[]) {
        if (!imagenMap.has(ir.producto_id)) {
          imagenMap.set(ir.producto_id, ir.url);
        }
      }
    }
  } catch (e: any) {
    dbError = e.message || "Error al consultar stock_modulos";
  }

  if (dbError || !modulo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/modulos" className="p-1 text-[#74777f] hover:text-[#111c2d]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[#111c2d]">Módulo</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="text-sm text-amber-800 font-medium">Tabla stock_modulos no encontrada</p>
          <p className="text-xs text-amber-700">
            Ejecutá el setup: <code className="bg-amber-100 px-1 rounded">GET /api/setup</code> con <code className="bg-amber-100 px-1 rounded">x-setup-key</code>
          </p>
        </div>
      </div>
    );
  }

  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/modulos"
          className="p-1 text-[#74777f] hover:text-[#111c2d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111c2d]">{modulo!.nombre}</h1>
          <p className="text-sm text-[#74777f]">
            {productos.length} producto{productos.length !== 1 ? "s" : ""} con stock acumulado
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
            href={`/modulos/${moduloId}`}
            className="px-3 py-2 text-[#74777f] text-sm hover:text-[#111c2d] self-center"
          >
            Limpiar
          </Link>
        )}
      </form>

      {productos.length > 0 ? (
        <>
          <div className="space-y-2">
            {productos.map((p) => {
              const imagenUrl = imagenMap.get(p.id) ?? getCloudinaryVidaDigitalUrl(p.descripcion) ?? null;
              return (
              <Link key={p.id} href={`/productos/${p.id}`}>
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 flex items-center gap-4 hover:shadow-sm hover:border-[#e2e8f0] transition-all">
                  {imagenUrl ? (
                    <img
                      src={imagenUrl}
                      alt={p.codigo}
                      className="w-12 h-12 rounded object-cover bg-[#f1f5f9] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#e2e8f0] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-bold text-[#1e3a5f] truncate">
                      {p.codigo}
                    </p>
                    <p className="text-xs text-[#74777f] truncate">{p.descripcion}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-[#111c2d]">
                      {p.cantidad_acumulada.toLocaleString("es-CL")}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">u · caja x{p.packing}</p>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>

          {hasMore && lastUpdated && (
            <div className="text-center">
              <Link
                href={`/modulos/${moduloId}?cursor=${encodeURIComponent(String(lastUpdated))}${qParam}`}
                className="inline-block px-6 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162e50] transition-colors"
              >
                Cargar más
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-[#74777f]">
            {q
              ? "Sin resultados para esta búsqueda."
              : "No hay productos con stock acumulado en este módulo."}
          </p>
          {q && (
            <Link href={`/modulos/${moduloId}`} className="text-sm text-[#1e3a5f] hover:underline">
              Mostrar todos los productos
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
