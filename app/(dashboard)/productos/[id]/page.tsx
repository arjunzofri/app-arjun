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
            <Badge className="bg-[#dbe1ff] text-[#0051d5] border-[#0051d5]/20 font-mono">
              {product.codigo}
            </Badge>
            <h1 className="text-3xl font-bold text-[#111c2d]">{product.descripcion}</h1>
          </div>
          <p className="text-[#74777f] font-mono mt-1">ID interno: {product.id}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border border-[#c4c6cf] mb-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="history">Historial Código</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="bg-white border-[#c4c6cf]">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-mono uppercase text-[#74777f]">Stock Actual</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {product.stock.map(s => (
                     <div key={s.id} className="flex justify-between items-center text-sm">
                       <span className="text-[#43474e]">{s.bodega.nombre}</span>
                       <span className="font-bold text-[#111c2d]">{s.cantidadActual}</span>
                     </div>
                   ))}
                   {product.stock.length === 0 && <p className="text-[#74777f] text-sm">Sin unidades en bodega</p>}
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-white border-[#c4c6cf]">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-mono uppercase text-[#74777f]">Info Logística</CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-[#74777f]">Packing:</span>
                   <span className="text-[#111c2d]">{product.packing} u/caja</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#74777f]">Ubicación:</span>
                   <span className="text-[#0051d5] font-mono uppercase">{product.ubicacion || "N/A"}</span>
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-white border-[#c4c6cf]">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-mono uppercase text-[#74777f]">Código Personal</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-[#111c2d]">
                   {product.codigoPersonal || <span className="text-[#94a3b8] italic">No asignado</span>}
                 </div>
               </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <div className="bg-white border border-[#c4c6cf] rounded-xl p-8">
            <ProductoForm initialData={product} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-white border border-[#c4c6cf] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#c4c6cf] bg-[#f0f3ff]">
              <h3 className="font-bold">Historial de Cambios en Código Personal</h3>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {product.auditoriaCodigo.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-[#74777f]">De <span className="text-[#74777f] line-through">{log.valorAnterior || "NULL"}</span> a <span className="text-[#111c2d] font-bold">{log.valorNuevo || "NULL"}</span></p>
                    <p className="text-xs text-[#64748b] mt-1">Cambiado por {(log.usuario as { nombre: string } | null)?.nombre ?? 'Usuario desconocido'} • {new Date(log.changedAt).toLocaleString()}</p>
                  </div>
                  <History className="h-4 w-4 text-[#64748b]" />
                </div>
              ))}
              {product.auditoriaCodigo.length === 0 && <p className="p-8 text-center text-[#64748b]">No hay cambios registrados</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
