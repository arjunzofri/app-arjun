import { db } from "@/db";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { Store, AlertTriangle } from "lucide-react";

export default async function ModulosPage() {
  let modulos: { id: string; nombre: string; productos: number; unidades: number }[] = [];
  let error: string | null = null;

  try {
    const result = await db.execute(sql`
      SELECT m.id, m.nombre,
             COUNT(sm.id)::int as productos,
             COALESCE(SUM(sm.cantidad_acumulada), 0)::int as unidades
      FROM modulos_destino m
      LEFT JOIN stock_modulos sm ON sm.modulo_id = m.id AND sm.cantidad_acumulada > 0
      GROUP BY m.id, m.nombre
    `);
    modulos = result.rows as any[];
  } catch (e: any) {
    error = e.message || "Error al consultar módulos";
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#111c2d]">Módulos</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="text-sm text-amber-800 font-medium">Tabla stock_modulos no encontrada</p>
          <p className="text-xs text-amber-700">
            Ejecutá el setup para crear la tabla: <code className="bg-amber-100 px-1 rounded">GET /api/setup</code> con header <code className="bg-amber-100 px-1 rounded">x-setup-key</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#111c2d]">Módulos</h1>
        <p className="text-sm text-[#74777f] mt-1">Mercadería acumulada por módulo de venta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {modulos.map((m) => (
          <Link key={m.id} href={`/modulos/${m.id}`}>
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all cursor-pointer group text-center">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-[#dbe1ff] rounded-lg border border-[#0051d5]/10">
                  <Store className="h-6 w-6 text-[#1e3a5f]" />
                </div>
              </div>
              <h2 className="text-sm font-mono font-bold text-[#1e3a5f] group-hover:text-[#111c2d] transition-colors">
                {m.nombre}
              </h2>
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-bold text-[#111c2d]">
                  {m.unidades.toLocaleString("es-CL")}
                </p>
                <p className="text-xs text-[#74777f]">unidades acumuladas</p>
              </div>
              <p className="text-xs text-[#94a3b8] mt-2">{m.productos} productos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
