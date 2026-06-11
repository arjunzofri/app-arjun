import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = 21;

  try {
    const s = neon(process.env.DATABASE_URL!);

    const cursorTs = cursor ? cursor.split("|")[0] : null;
    const cursorId = cursor ? cursor.split("|")[1] : null;

    const rows = await s`
      SELECT * FROM (
        SELECT
          'entrada' as tipo,
          e.id,
          e.created_at as fecha,
          e.cantidad,
          b.nombre as bodega,
          NULL as modulo,
          u.nombre as usuario,
          NULL as destino
        FROM public.entradas e
        JOIN public.bodegas b ON b.id = e.bodega_id
        LEFT JOIN public.usuarios u ON u.id = e.usuario_id
        WHERE e.producto_id = ${id}::uuid

        UNION ALL

        SELECT
          'salida' as tipo,
          s.id,
          s.timestamp_salida as fecha,
          s.cantidad,
          bo.nombre as bodega,
          m.nombre as modulo,
          u.nombre as usuario,
          NULL as destino
        FROM public.salidas s
        JOIN public.bodegas bo ON bo.id = s.bodega_origen_id
        JOIN public.modulos_destino m ON m.id = s.modulo_destino_id
        LEFT JOIN public.usuarios u ON u.id = s.usuario_id
        WHERE s.producto_id = ${id}::uuid

        UNION ALL

        SELECT
          'traslado' as tipo,
          t.id,
          t.created_at as fecha,
          t.cantidad,
          bo.nombre as bodega,
          NULL as modulo,
          u.nombre as usuario,
          bd.nombre as destino
        FROM public.traslados t
        JOIN public.bodegas bo ON bo.id = t.bodega_origen_id
        JOIN public.bodegas bd ON bd.id = t.bodega_destino_id
        LEFT JOIN public.usuarios u ON u.id = t.usuario_id
        WHERE t.producto_id = ${id}::uuid

        UNION ALL

        SELECT
          'retorno' as tipo,
          r.id,
          r.created_at as fecha,
          r.cantidad,
          NULL as bodega,
          mo.nombre as modulo,
          u.nombre as usuario,
          bd.nombre as destino
        FROM public.retornos r
        JOIN public.modulos_destino mo ON mo.id = r.modulo_origen_id
        JOIN public.bodegas bd ON bd.id = r.bodega_destino_id
        LEFT JOIN public.usuarios u ON u.id = r.usuario_id
        WHERE r.producto_id = ${id}::uuid
      ) movimientos
      WHERE ${cursorTs && cursorId
        ? s`(fecha, id) < (${cursorTs}::timestamptz, ${cursorId}::uuid)`
        : s`TRUE`}
      ORDER BY fecha DESC
      LIMIT ${limit}
    `;

    const items = rows.slice(0, 20);
    const hasMore = rows.length > 20;
    const nextCursor = hasMore && items.length > 0
      ? `${(items[items.length - 1] as any).fecha}|${(items[items.length - 1] as any).id}`
      : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}
