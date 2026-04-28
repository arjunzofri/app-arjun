import { db } from "@/db";
import { bodegas, productos } from "@/db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KingnexOCRPanel from "@/components/entradas/KingnexOCRPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, FileText, Cpu } from "lucide-react";

export default async function EntradasPage() {
  const allBodegas = await db.query.bodegas.findMany();
  const allProductos = await db.query.productos.findMany();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Ingreso de Mercadería (Entradas)</h1>
        <p className="text-slate-400">Registra compras y recepciones mediante integración o IA.</p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="manual" className="data-[state=active]:bg-slate-800">Manual</TabsTrigger>
          <TabsTrigger value="winfac" className="data-[state=active]:bg-slate-800 flex gap-2">
            <FileText className="h-4 w-4" /> WinFac
          </TabsTrigger>
          <TabsTrigger value="kingnex" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500 flex gap-2">
            <Cpu className="h-4 w-4" /> Kingnex (OCR IA)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="py-6">
           <Card className="bg-slate-900 border-slate-800 max-w-2xl">
             <CardHeader>
               <CardTitle>Registro Manual de Entrada</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-slate-500 text-sm italic">Panel en desarrollo: Usa Kingnex OCR o WinFac por ahora.</p>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="winfac" className="py-6">
           <Card className="bg-slate-900 border-slate-800 max-w-2xl">
             <CardHeader>
               <CardTitle>Integración WinFac (Vida Digital)</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <p className="text-sm text-slate-400">Ingresa el número de Nota de Venta para importar productos desde la base de datos de Vida Digital.</p>
                 <div className="flex gap-2">
                   <input className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm" placeholder="Número de NV..." />
                   <Button variant="secondary">Buscar</Button>
                 </div>
               </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="kingnex" className="py-6">
          <KingnexOCRPanel bodegasData={allBodegas} productosData={allProductos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Button({ children, variant = "primary", ...props }: any) {
  return (
    <button 
      className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
        variant === "primary" ? "bg-amber-500 text-slate-950 hover:bg-amber-600" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
      }`} 
      {...props}
    >
      {children}
    </button>
  );
}
