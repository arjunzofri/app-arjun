import { db } from "@/db";
import { stock, bodegas, productos, salidas, entradas } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Warehouse,
  Database,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  let productCountData, bodegaStocksData, recentSalidasData, recentEntradasData;

  try {
    // Stats - Wrap data fetching in try-catch
    [productCountData] = await db.select({ count: sql<number>`count(*)` }).from(productos);
    
    bodegaStocksData = await db.select({
      bodegaNombre: bodegas.nombre,
      totalStock: sql<number>`sum(${stock.cantidadActual})`
    })
    .from(bodegas)
    .leftJoin(stock, sql`${bodegas.id} = ${stock.bodegaId}`)
    .groupBy(bodegas.nombre);

    recentSalidasData = await db.query.salidas.findMany({
      limit: 5,
      orderBy: [desc(salidas.timestampSalida)],
      with: {
        producto: true,
        usuario: true,
        modulo: true
      }
    });

    recentEntradasData = await db.query.entradas.findMany({
      limit: 5,
      orderBy: [desc(entradas.createdAt)],
      with: {
        producto: true,
        usuario: true,
        bodega: true
      }
    });
  } catch (error) {
    console.error("Dashboard database error (likely missing tables):", error);
    
    // Return early with the setup prompt if database query fails
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
          <Database className="h-12 w-12 text-amber-500" />
        </div>
        
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">Base de datos no inicializada</h2>
          <p className="text-slate-400 text-sm">
            Las tablas necesarias para el funcionamiento de Arjun no se encuentran en el servidor de Neon.
          </p>
        </div>

        <Link href="/setup">
          <button className="px-8 py-4 bg-amber-500 text-slate-950 font-bold uppercase tracking-widest rounded-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer">
            INICIALIZAR SISTEMA
          </button>
        </Link>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          <AlertTriangle className="h-3 w-3" />
          Requiere SETUP_KEY configurado
        </div>
      </div>
    );
  }

  // Normal dashboard rendering - outside the try block
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Panel de Control</h1>
        <p className="text-slate-400">Resumen operativo de inventario y movimientos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 p-1 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-white">{productCountData.count}</div>
            <div className="mt-4 flex items-center text-[10px] text-emerald-400 font-mono">
              <span className="bg-emerald-500/10 px-1 rounded mr-1">ACTUALIZADO</span>
              Recién sincronizado
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-1 rounded-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Stock Bodegas (Origen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-1">
              {bodegaStocksData.map((b) => (
                <div key={b.bodegaNombre} className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">{b.bodegaNombre.replace('Bodega ', '')}</span>
                  <span className={cn(
                    "font-bold",
                    b.totalStock && b.totalStock > 0 ? "text-amber-500" : "text-slate-600"
                  )}>
                    {b.totalStock || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-1 rounded-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Módulos Zofri (Destino)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {['M180', 'M182', 'M183', 'M184', 'M193'].map((m) => (
                <div key={m} className="bg-slate-800/40 p-2 rounded border border-slate-800/50 text-[10px] font-mono flex justify-between">
                  <span className="text-slate-500">{m}:</span>
                  <span className="text-slate-200 font-bold">--</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-12">
        {/* Entradas/Salidas Recent Activity */}
        <Card className="col-span-12 lg:col-span-8 bg-slate-900 border-slate-800 rounded-sm">
          <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-300">Últimas Operaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-normal">FECHA</th>
                    <th className="px-5 py-3 font-normal">TIPO</th>
                    <th className="px-5 py-3 font-normal">SKU / PRODUCTO</th>
                    <th className="px-5 py-3 font-normal">DESTINO/ORIGEN</th>
                    <th className="px-5 py-3 font-normal text-right">CANT.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[...recentEntradasData.map(e => ({ ...e, type: 'ENTRADA' })), ...recentSalidasData.map(s => ({ ...s, type: 'SALIDA' }))]
                    .sort((a, b) => {
                      const dateB = 'createdAt' in b ? new Date(b.createdAt) : new Date(b.timestampSalida)
                      const dateA = 'createdAt' in a ? new Date(a.createdAt) : new Date(a.timestampSalida)
                      return dateB.getTime() - dateA.getTime()
                    })
                    .slice(0, 8)
                    .map((op: any) => (
                      <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(op.createdAt || op.timestampSalida).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={cn(
                          "px-5 py-3 font-bold",
                          op.type === 'ENTRADA' ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {op.type}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="text-slate-300">{op.producto.codigo}</span>
                          <span className="text-slate-500 ml-2 hidden md:inline">({op.producto.descripcion.substring(0, 20)}...)</span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 capitalize">
                          {op.bodega?.nombre.replace('Bodega ', '') || op.modulo?.nombre}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-200">
                          {op.type === 'ENTRADA' ? '+' : '-'}{op.cantidad}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-slate-900 border-slate-800 rounded-sm">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-300">Alertas de Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-mono font-bold text-red-400">CRÍTICO: STOCK CERO</p>
                  <p className="text-[9px] text-slate-500 uppercase">Sin movimientos hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 bg-amber-500 p-6 rounded-sm text-slate-950 flex flex-col justify-between shadow-lg shadow-amber-500/10">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Atajo de Despacho</h3>
              <p className="text-[10px] mt-1 font-medium opacity-80 uppercase leading-tight">Registro inmediato de salida a módulos Zofri</p>
            </div>
            <div className="mt-8">
              <Link href="/dashboard/salidas">
                <button className="w-full py-4 bg-slate-950 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors rounded-sm shadow-xl cursor-pointer">
                  INICIAR NUEVA SALIDA
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
