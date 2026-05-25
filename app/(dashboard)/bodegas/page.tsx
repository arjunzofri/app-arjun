import { db } from "@/db";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { Warehouse } from "lucide-react";

export default async function BodegasPage() {
  const result = await db.execute(sql`
    SELECT b.id, b.nombre,
           COUNT(s.id)::int as productos,
           COALESCE(SUM(s.cantidad_actual), 0)::int as unidades
    FROM bodegas b
    LEFT JOIN stock s ON s.bodega_id = b.id AND s.cantidad_actual > 0
    GROUP BY b.id, b.nombre
  `);

  const bodegas = result.rows as {
    id: string; nombre: string; productos: number; unidades: number;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#111c2d]">Bodegas</h1>
        <p className="text-sm text-[#74777f] mt-1">Stock por bodega de origen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bodegas.map((b) => (
          <Link key={b.id} href={`/bodegas/${b.id}`}>
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#dbe1ff] rounded-lg border border-[#0051d5]/10">
                  <Warehouse className="h-6 w-6 text-[#1e3a5f]" />
                </div>
                <h2 className="text-lg font-bold text-[#111c2d] group-hover:text-[#1e3a5f] transition-colors">
                  {b.nombre}
                </h2>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-[#111c2d]">
                    {b.unidades.toLocaleString("es-CL")}
                  </p>
                  <p className="text-xs text-[#74777f]">unidades</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#111c2d]">{b.productos}</p>
                  <p className="text-xs text-[#74777f]">productos distintos</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
