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
          <h1 className="text-3xl font-bold text-[#111c2d] font-mono">{product.codigo}</h1>
          <Badge className="bg-[#dbe1ff] text-[#0051d5] border-[#0051d5]/20 font-mono mt-1 max-w-lg truncate">
            NOMBRE: {product.descripcion}
          </Badge>
          <p className="text-[#74777f] font-mono mt-1">Ingreso: {product.knumezet ?? 'Sin número de ingreso'}</p>
        </div>
      </div>

      <ProductoDetalle product={product} />
    </div>
  );
}
