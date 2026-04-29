import { db } from "@/db";
import { bodegas, modulosDestino, productos, salidas } from "@/db/schema";
import { desc } from "drizzle-orm";
import SalidaForm from "@/components/salidas/SalidaForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SalidasPage() {
  const allProductos = await db.query.productos.findMany();
  const allBodegas = await db.query.bodegas.findMany();
  const allModulos = await db.query.modulosDestino.findMany();
  
  const history = await db.query.salidas.findMany({
    orderBy: [desc(salidas.timestampSalida)],
    limit: 50,
    with: {
      producto: true,
      bodega: true,
      modulo: true,
      usuario: true
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#111c2d]">Despachos (Salidas)</h1>
        <p className="text-[#74777f]">Registra el movimiento de mercadería desde bodegas hacia módulos del Mall Zofri.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="bg-white border-[#c4c6cf]">
            <CardHeader>
              <CardTitle>Nuevo Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <SalidaForm 
                productosData={allProductos} 
                bodegasData={allBodegas} 
                modulosData={allModulos} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-white border-[#c4c6cf]">
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#c4c6cf]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#c4c6cf]">
                      <TableHead className="font-mono text-xs uppercase">Fecha/Hora</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Producto</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Origen</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Destino</TableHead>
                      <TableHead className="font-mono text-xs uppercase text-center">Cant.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id} className="border-[#c4c6cf]">
                        <TableCell className="text-[10px] font-mono text-[#74777f]">
                          {new Date(h.timestampSalida).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-[#111c2d]">
                          <p className="font-bold">{h.producto.codigo}</p>
                          <p className="text-[10px] text-[#74777f] truncate max-w-[120px]">{h.producto.descripcion}</p>
                        </TableCell>
                        <TableCell className="text-xs text-[#74777f]">{h.bodega.nombre.replace('Bodega ', '')}</TableCell>
                        <TableCell className="text-xs text-[#0051d5] font-bold">{h.modulo.nombre}</TableCell>
                        <TableCell className="text-center font-bold text-[#111c2d]">{h.cantidad}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
