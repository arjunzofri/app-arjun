import { db } from "@/db";
import { productos, stock, entradas } from "@/db/schema";
import { sql, ilike, or, isNull } from "drizzle-orm";
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

  // Productos con entradas sin bodega asignada
  const sinBodegaResult = await db
    .selectDistinct({ productoId: entradas.productoId })
    .from(entradas)
    .where(isNull(entradas.bodegaId))

  const sinBodegaIds = new Set(sinBodegaResult.map(r => r.productoId))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111c2d]">Inventario</h1>
          <p className="text-[#74777f]">Listado general de productos y stock consolidado.</p>
        </div>
        <Link href="/productos/nuevo">
          <Button className="bg-[#16a34a] font-bold text-white hover:bg-[#15803d]">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#74777f]" />
          <form action="/productos" method="GET">
            <Input 
              name="q"
              placeholder="Buscar por código, descripción o código personal..." 
              defaultValue={query}
              className="border-[#c4c6cf] bg-white pl-10 focus:ring-[#0051d5]"
            />
          </form>
        </div>
      </div>

      <div className="rounded-md border border-[#c4c6cf] bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-[#c4c6cf] hover:bg-white">
              <TableHead className="text-[#74777f] font-mono uppercase text-xs">Cód. Proveedor</TableHead>
              <TableHead className="text-[#74777f] font-mono uppercase text-xs">Cód. Personal</TableHead>
              <TableHead className="text-[#74777f] font-mono uppercase text-xs">Descripción</TableHead>
              <TableHead className="text-[#74777f] font-mono uppercase text-xs">Packing</TableHead>
              <TableHead className="text-[#74777f] font-mono uppercase text-xs">Ubicación</TableHead>
              <TableHead className="text-[#74777f] font-mono uppercase text-xs">Stock Total</TableHead>
              <TableHead className="text-right text-[#74777f] font-mono uppercase text-xs">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} className="border-[#c4c6cf] hover:bg-[#f0f3ff]">
                <TableCell className="font-mono text-[#0051d5]">{p.codigo}</TableCell>
                <TableCell className="font-mono text-[#43474e]">{p.codigoPersonal || "-"}</TableCell>
                <TableCell className="max-w-xs text-[#111c2d]">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{p.descripcion}</span>
                    {sinBodegaIds.has(p.id) && (
                      <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-mono shrink-0">
                        SIN BODEGA
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[#74777f]">{p.packing}</TableCell>
                <TableCell>
                   <Badge variant="outline" className="border-[#c4c6cf] font-mono text-[10px] uppercase">
                     {p.ubicacion || "SIN ASIGNAR"}
                   </Badge>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-bold",
                    p.totalStock > 20 ? "text-green-500" : p.totalStock > 0 ? "text-[#0051d5]" : "text-red-500"
                  )}>
                    {p.totalStock}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/productos/${p.id}`}>
                    <Button variant="ghost" size="icon" className="text-[#74777f] hover:text-[#111c2d]">
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
