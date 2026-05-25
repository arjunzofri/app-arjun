import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const s = neon(process.env.DATABASE_URL!);

    const rows = await s`
      SELECT DISTINCT ON (codunico)
        codunico as codigo, descript as descripcion,
        COALESCE(cantcaja, 1)::int as packing, knumezet
      FROM arjun.inv_sdo
      WHERE codunico ILIKE ${`%${q.trim()}%`}
         OR descript ILIKE ${`%${q.trim()}%`}
      ORDER BY codunico
      LIMIT 20
    `;

    // Buscar imágenes ya subidas para estos knumezet
    const knumezets = rows
      .map((r: any) => r.knumezet)
      .filter((k: string | null) => k != null) as string[];

    let imagenMap = new Map<string, string>();

    if (knumezets.length > 0) {
      const imagenRows = await s`
        SELECT p.knumezet, pi.url
        FROM public.productos p
        JOIN public.producto_imagenes pi ON pi.producto_id = p.id
        WHERE p.knumezet = ANY(${knumezets}::text[])
        ORDER BY pi.created_at ASC
      `;
      for (const ir of imagenRows) {
        if (!imagenMap.has(ir.knumezet)) {
          imagenMap.set(ir.knumezet, ir.url);
        }
      }
    }

    const enriched = rows.map((r: any) => ({
      codigo: r.codigo,
      descripcion: r.descripcion,
      packing: r.packing,
      knumezet: r.knumezet,
      imagenUrl: imagenMap.get(r.knumezet) ?? getCloudinaryVidaDigitalUrl(r.descripcion) ?? null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al buscar en WinFac" },
      { status: 500 }
    );
  }
}
