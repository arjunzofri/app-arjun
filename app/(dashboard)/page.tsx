import { db } from "@/db";
import { sql } from "drizzle-orm";
import { Warehouse, ArrowUpRight, AlertTriangle, Database } from "lucide-react";
import Link from "next/link";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import { getVisaCorte } from "@/lib/utils/get-visa-corte";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const isMobile = /android|iphone|ipad|mobile/i.test(ua);
  if (isMobile) redirect("/salidas");

  let bodegaStocks: any[] = [];
  let modulosDespachos: any[] = [];
  let alertaBajo: any[] = [];
  const ahora = new Date().toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const corte = await getVisaCorte();

  try {
    const [bs, md, ab] = await Promise.all([
      db.execute(sql`
        SELECT b.nombre, COUNT(DISTINCT s.producto_id)::int as productos,
               SUM(s.cantidad_actual)::int as unidades
        FROM stock s
        JOIN bodegas b ON b.id = s.bodega_id
        JOIN productos p ON p.id = s.producto_id
        WHERE s.cantidad_actual > 0
          AND (p.knumezet IS NULL OR p.knumezet NOT LIKE '%-%-%' OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
        GROUP BY b.id, b.nombre
      `),
      db.execute(sql`
        SELECT m.nombre, COUNT(sa.id)::int as despachos,
               COALESCE(SUM(sa.cantidad), 0)::int as unidades
        FROM modulos_destino m
        LEFT JOIN salidas sa ON sa.modulo_destino_id = m.id
        GROUP BY m.id, m.nombre
        ORDER BY m.nombre
      `),
      db.execute(sql`
        SELECT p.id, p.codigo, p.descripcion, p.packing,
               COALESCE(SUM(s.cantidad_actual), 0)::int as total_stock
        FROM productos p
        LEFT JOIN stock s ON s.producto_id = p.id
        WHERE (p.knumezet IS NULL OR p.knumezet NOT LIKE '%-%-%' OR (split_part(p.knumezet, '-', 2)::bigint * 1000000 + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
        GROUP BY p.id, p.codigo, p.descripcion, p.packing
        HAVING COALESCE(SUM(s.cantidad_actual), 0) > 0
           AND COALESCE(SUM(s.cantidad_actual), 0) < COALESCE(p.packing, 1)
        ORDER BY total_stock ASC
        LIMIT 10
      `),
    ]);
    bodegaStocks = bs.rows;
    modulosDespachos = md.rows;
    alertaBajo = ab.rows;
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-4 bg-[#dbe1ff] rounded-full border border-[#0051d5]/20">
          <Database className="h-12 w-12 text-[#0051d5]" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-[#111c2d]">Base de datos no inicializada</h2>
          <p className="text-[#74777f] text-sm">
            Las tablas necesarias para el funcionamiento de Arjun no se encuentran en el servidor de Neon.
          </p>
        </div>
        <Link href="/setup">
          <button className="px-8 py-4 bg-[#16a34a] text-white font-bold uppercase tracking-widest rounded-sm hover:bg-[#15803d] transition-colors shadow-lg active:scale-95 cursor-pointer">
            INICIALIZAR SISTEMA
          </button>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-[#74777f] font-mono uppercase tracking-widest">
          <AlertTriangle className="h-3 w-3" />
          Requiere SETUP_KEY configurado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111c2d]">Panel de Control</h1>
          <p className="text-[#74777f] text-sm">{ahora}</p>
        </div>
      </div>

      {/* Sección 1 — Stock por bodega */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#74777f] mb-3">
          <Warehouse className="inline h-3 w-3 mr-1" />
          Stock por bodega
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {bodegaStocks.map((b: any) => (
            <div key={b.nombre} className="bg-white border border-[#e2e8f0] rounded-lg p-5">
              <p className="text-xs text-[#74777f] font-medium truncate">{b.nombre.replace("Bodega ", "")}</p>
              <p className="text-3xl font-bold text-[#111c2d] mt-2">
                {b.unidades.toLocaleString('es-CL')}
                <span className="text-lg font-normal text-[#74777f] ml-1">u</span>
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">{b.productos} productos distintos</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sección 2 — Despachos hacia módulos */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#74777f] mb-3">
          <ArrowUpRight className="inline h-3 w-3 mr-1" />
          Despachos a módulos
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {modulosDespachos.map((m: any) => (
            <div key={m.nombre} className="bg-white border border-[#e2e8f0] rounded-lg p-4 text-center">
              <p className="text-xs font-mono font-bold text-[#1e3a5f]">{m.nombre.replace("Módulo ", "M")}</p>
              <p className="text-2xl font-bold text-[#111c2d] mt-1">{m.unidades}</p>
              <p className="text-[10px] text-[#94a3b8]">{m.despachos} despachos</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sección 3 — Alerta stock bajo */}
      {alertaBajo.length > 0 && (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#74777f] mb-3">
          <AlertTriangle className="inline h-3 w-3 mr-1 text-amber-500" />
          Stock bajo (menos de 1 caja)
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {alertaBajo.map((p: any) => (
            <Link key={p.id} href={`/productos/${p.id}`}>
              <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 flex items-center gap-3 min-w-[280px] hover:shadow-sm transition-shadow">
                <img
                  src={getCloudinaryVidaDigitalUrl(p.descripcion) ?? ""}
                  alt={p.codigo}
                  className="w-10 h-10 rounded object-contain bg-[#f1f5f9] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono font-bold text-[#1e3a5f] truncate">{p.codigo}</p>
                  <p className="text-[10px] text-[#74777f] truncate">{p.descripcion}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-amber-600">{p.total_stock}</p>
                  <p className="text-[9px] text-[#94a3b8]">de {p.packing}u/caja</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
