import { db } from "@/db";
import { productos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDescripcionCorta } from "@/lib/utils/format-descripcion";
import BotonVolver from "@/components/productos/BotonVolver";
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
      <BotonVolver />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111c2d] font-mono">{product.codigo}</h1>
          <p className="text-[#74777f] text-sm mt-1">{formatDescripcionCorta(product.descripcion)}</p>
          <p className="text-[#94a3b8] font-mono text-xs mt-1">Ingreso: {product.knumezet ?? 'Sin número de ingreso'}</p>
        </div>
      </div>

      <ProductoDetalle product={product} />
    </div>
  );
}
