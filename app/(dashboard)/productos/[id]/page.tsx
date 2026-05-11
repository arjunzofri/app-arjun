import { db } from "@/db";
import { productos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import ProductoDetalle from "@/components/productos/ProductoDetalle";

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
      },
      imagenes: true
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

      <ProductoDetalle product={product} />
    </div>
  );
}
