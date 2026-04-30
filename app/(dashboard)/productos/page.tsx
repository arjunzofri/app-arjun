import { db } from "@/db";
import { productos, stock, entradas } from "@/db/schema";
import { sql, ilike, or, isNull } from "drizzle-orm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductImage from "@/components/productos/ProductImage";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

const CLOUDINARY_BASE = "https://res.cloudinary.com/dxkidwxjl/image/upload/productos";

function getImageUrl(codigo: string) {
  return `${CLOUDINARY_BASE}/${codigo}.jpg`;
}

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/productos/${p.id}`}>
            <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="border-b border-[#e2e8f0]">
                <ProductImage
                  src={getImageUrl(p.codigo)}
                  alt={p.descripcion || p.codigo}
                />
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-sm font-bold text-[#0051d5]">{p.codigo}</span>
                  {sinBodegaIds.has(p.id) && (
                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 rounded px-1 py-0.5 font-bold shrink-0">
                      SIN BODEGA
                    </span>
                  )}
                </div>

                {p.codigoPersonal && (
                  <p className="text-xs text-[#74777f] font-mono">{p.codigoPersonal}</p>
                )}

                <p className="text-xs text-[#43474e] line-clamp-2 leading-tight">{p.descripcion}</p>

                <div className="flex items-center justify-between pt-1 border-t border-[#f0f3ff]">
                  <span className="text-[10px] text-[#74777f]">Pack: {p.packing}</span>
                  <span className={`text-sm font-bold ${
                    p.totalStock > 20 ? "text-green-600" : 
                    p.totalStock > 0 ? "text-[#0051d5]" : 
                    "text-red-500"
                  }`}>
                    {p.totalStock} u.
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#74777f] bg-[#f0f3ff] rounded px-2 py-1 text-center">
                  {p.ubicacion || "SIN ASIGNAR"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
