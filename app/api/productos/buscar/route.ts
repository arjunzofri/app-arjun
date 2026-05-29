import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import { getVisaCorte } from "@/lib/utils/get-visa-corte";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const search = `%${q.trim()}%`;

  try {
    const s = neon(process.env.DATABASE_URL!);
    const corte = await getVisaCorte();

    // Buscar en ambas fuentes en paralelo
    const [appRows, wfRows] = await Promise.all([
      s`
        SELECT p.id, p.codigo, p.descripcion, p.packing, p.knumezet,
               pi.url as imagen_db
        FROM public.productos p
        LEFT JOIN LATERAL (
          SELECT url FROM public.producto_imagenes
          WHERE producto_id = p.id
          ORDER BY created_at ASC
          LIMIT 1
        ) pi ON true
        LEFT JOIN public.stock s ON s.producto_id = p.id
        WHERE (p.codigo ILIKE ${search}
           OR p.descripcion ILIKE ${search}
           OR p.codigo_personal ILIKE ${search})
          AND (p.knumezet IS NULL OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
        GROUP BY p.id, pi.url
        HAVING COALESCE(SUM(s.cantidad_actual), 0) > 0
        ORDER BY p.codigo
        LIMIT 20
      `,
      s`
        SELECT DISTINCT ON (codunico)
          codunico as codigo, descript as descripcion,
          GREATEST(COALESCE(cantcaja, 1), 1)::int as packing, knumezet
        FROM arjun.inv_sdo
        WHERE (codunico ILIKE ${search}
           OR descript ILIKE ${search})
          AND stocdisp > 0
          AND (split_part(knumezet, '-', 2)::bigint * 1000000 + split_part(knumezet, '-', 3)::bigint) >= ${corte}
        ORDER BY codunico
        LIMIT 20
      `,
    ]);

    // Construir resultados de la app
    const appResults = appRows.map((r: any) => ({
      id: r.id,
      codigo: r.codigo,
      descripcion: r.descripcion,
      packing: r.packing,
      knumezet: r.knumezet,
      imagenUrl: r.imagen_db ?? getCloudinaryVidaDigitalUrl(r.descripcion) ?? null,
      fuente: "app" as const,
    }));

    // Set de knumezets de la app para deduplicar
    const appKnumezets = new Set(
      appRows.map((r: any) => r.knumezet).filter((k: any) => k != null)
    );

    // WinFac: filtrar duplicados y enriquecer
    const wfResults = wfRows
      .filter((r: any) => !r.knumezet || !appKnumezets.has(r.knumezet))
      .map((r: any) => ({
        codigo: r.codigo,
        descripcion: r.descripcion,
        packing: r.packing,
        knumezet: r.knumezet,
        imagenUrl: getCloudinaryVidaDigitalUrl(r.descripcion) ?? null,
        fuente: "winfac" as const,
      }));

    // Combinar: app primero, luego WinFac no duplicados
    const combined = [...appResults, ...wfResults].slice(0, 20);

    return NextResponse.json(combined);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    );
  }
}
