import { db } from "@/db";
import { productos, bodegas, stock, codigoPersonalAuditoria, usuarios } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductoForm from "@/components/productos/ProductoForm";
import { Warehouse, History, Settings } from "lucide-react";

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.query.productos.findFirst({
    where: eq(productos.id, id),
    with: {
      stock: {
        with: {
          bodega: true
        }
      },
      auditoriaCodigo: {
        with: {
          usuario: true
        },
        orderBy: (auditoria, { desc }) => [desc(auditoria.changedAt)]
      }
    }
  });

  if (!product) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono">
              {product.codigo}
            </Badge>
            <h1 className="text-3xl font-bold text-white">{product.descripcion}</h1>
          </div>
          <p className="text-slate-400 font-mono mt-1">ID interno: {product.id}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 mb-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="history">Historial Código</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="bg-slate-900 border-slate-800">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-mono uppercase text-slate-400">Stock Actual</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {product.stock.map(s => (
                     <div key={s.id} className="flex justify-between items-center text-sm">
                       <span className="text-slate-300">{s.bodega.nombre}</span>
                       <span className="font-bold text-white">{s.cantidadActual}</span>
                     </div>
                   ))}
                   {product.stock.length === 0 && <p className="text-slate-500 text-sm">Sin unidades en bodega</p>}
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-slate-900 border-slate-800">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-mono uppercase text-slate-400">Info Logística</CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Packing:</span>
                   <span className="text-slate-200">{product.packing} u/caja</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Ubicación:</span>
                   <span className="text-amber-500 font-mono uppercase">{product.ubicacion || "N/A"}</span>
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-slate-900 border-slate-800">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-mono uppercase text-slate-400">Código Personal</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-white">
                   {product.codigoPersonal || <span className="text-slate-700 italic">No asignado</span>}
                 </div>
               </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            <ProductoForm initialData={product} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-bold">Historial de Cambios en Código Personal</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {product.auditoriaCodigo.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-400">De <span className="text-slate-500 line-through">{log.valorAnterior || "NULL"}</span> a <span className="text-white font-bold">{log.valorNuevo || "NULL"}</span></p>
                    <p className="text-xs text-slate-600 mt-1">Cambiado por {(log.usuario as { nombre: string } | null)?.nombre ?? 'Usuario desconocido'} • {new Date(log.changedAt).toLocaleString()}</p>
                  </div>
                  <History className="h-4 w-4 text-slate-700" />
                </div>
              ))}
              {product.auditoriaCodigo.length === 0 && <p className="p-8 text-center text-slate-600">No hay cambios registrados</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
