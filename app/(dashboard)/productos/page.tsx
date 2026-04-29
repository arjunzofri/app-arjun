import { db } from "@/db";
import { productos, stock } from "@/db/schema";
import { sql, ilike, or } from "drizzle-orm";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, Eye } from "lucide-react";

export default async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || "";

  const products = await db.select({
    id: productos.id,
    codigo: productos.codigo,
    codigoPersonal: productos.codigoPersonal,
    descripcion: productos.descripcion,
    packing: productos.packing,
    ubicacion: productos.ubicacion,
    totalStock: sql<number>`COALESCE(SUM(${stock.cantidadActual}), 0)`
  })
  .from(productos)
  .leftJoin(stock, sql`${productos.id} = ${stock.productoId}`)
  .where(
    query 
      ? or(
          ilike(productos.codigo, `%${query}%`),
          ilike(productos.descripcion, `%${query}%`),
          ilike(productos.codigoPersonal, `%${query}%`)
        )
      : undefined
  )
  .groupBy(productos.id)
  .orderBy(productos.codigo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Inventario</h1>
          <p className="text-slate-400">Listado general de productos y stock consolidado.</p>
        </div>
        <Link href="/productos/nuevo">
          <Button className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-600">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <form action="/productos" method="GET">
            <Input 
              name="q"
              placeholder="Buscar por código, descripción o código personal..." 
              defaultValue={query}
              className="border-slate-800 bg-slate-900 pl-10 focus:ring-amber-500"
            />
          </form>
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-900">
              <TableHead className="text-slate-400 font-mono uppercase text-xs">Cód. Proveedor</TableHead>
              <TableHead className="text-slate-400 font-mono uppercase text-xs">Cód. Personal</TableHead>
              <TableHead className="text-slate-400 font-mono uppercase text-xs">Descripción</TableHead>
              <TableHead className="text-slate-400 font-mono uppercase text-xs">Packing</TableHead>
              <TableHead className="text-slate-400 font-mono uppercase text-xs">Ubicación</TableHead>
              <TableHead className="text-slate-400 font-mono uppercase text-xs">Stock Total</TableHead>
              <TableHead className="text-right text-slate-400 font-mono uppercase text-xs">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell className="font-mono text-amber-500">{p.codigo}</TableCell>
                <TableCell className="font-mono text-slate-300">{p.codigoPersonal || "-"}</TableCell>
                <TableCell className="max-w-xs truncate text-slate-100">{p.descripcion}</TableCell>
                <TableCell className="text-slate-400">{p.packing}</TableCell>
                <TableCell>
                   <Badge variant="outline" className="border-slate-700 font-mono text-[10px] uppercase">
                     {p.ubicacion || "SIN ASIGNAR"}
                   </Badge>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-bold",
                    p.totalStock > 20 ? "text-green-500" : p.totalStock > 0 ? "text-amber-500" : "text-red-500"
                  )}>
                    {p.totalStock}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/productos/${p.id}`}>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
