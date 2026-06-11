import { NextRequest, NextResponse } from "next/server";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import { auth } from "@/lib/auth";

function createLoggedNeon(): NeonQueryFunction<false, false> {
  const raw = neon(process.env.DATABASE_URL!);
  return new Proxy(raw, {
    apply(target, thisArg, args: [TemplateStringsArray, ...any[]]) {
      const [strings, ...values] = args;
      let sql = strings[0];
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (Array.isArray(v)) sql += `[array:${v.length}]`;
        else sql += String(v);
        sql += strings[i + 1];
      }
      console.error(`[api/buscar:query:LEN=${sql.length}] ${sql.substring(0, 300)}`);
      const result = (target as Function).apply(thisArg, args);
      if (result && typeof result.then === "function") {
        return result.catch((err: any) => {
          console.error(`[api/buscar:error] ${err.message}`);
          if (err.position) {
            const pos = parseInt(err.position);
            console.error(`[api/buscar:error:pos=${pos}] ...${sql.substring(Math.max(0, pos - 60), Math.min(sql.length, pos + 80))}...`);
          }
          throw err;
        });
      }
      return result;
    }
  }) as unknown as NeonQueryFunction<false, false>;
}

const s = createLoggedNeon();

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const search = `%${q.trim()}%`;

  try {

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
