"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductoForm from "@/components/productos/ProductoForm";
import ImageUploader from "@/components/productos/ImageUploader";
import { History } from "lucide-react";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";

type Tab = "overview" | "edit" | "history";

export default function ProductoDetalle({ product }: { product: any }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-lg w-fit mb-6">
        {([
          { id: "overview" as const, label: "Resumen" },
          { id: "edit" as const, label: "Editar" },
          { id: "history" as const, label: "Historial Código" },
        ]).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTab(opt.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === opt.id
                ? "bg-white text-[#111c2d] shadow-sm"
                : "text-[#64748b] hover:text-[#111c2d]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#111c2d] font-mono">{product.codigo}</h2>
            {product.knumezet && (
              <span className="text-sm font-mono text-[#64748b] bg-[#f1f5f9] px-3 py-1 rounded">{product.knumezet}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-[#c4c6cf]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase text-[#74777f]">Stock Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.stock.map((s: any) => (
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

          {(() => {
            const vidaDigitalUrl = getCloudinaryVidaDigitalUrl(product.descripcion)
            return (
              <Card className="bg-white border-[#c4c6cf]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono uppercase text-[#74777f]">Imágenes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.imagenes.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {product.imagenes.map((img: any) => (
                        <div key={img.id} className="w-32 h-32 rounded border border-[#e2e8f0] overflow-hidden bg-[#f9f9ff]">
                          <img src={img.url} alt={product.descripcion} className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                  {product.imagenes.length === 0 && vidaDigitalUrl && (
                    <div className="w-32 h-32 rounded border border-[#e2e8f0] overflow-hidden bg-[#f9f9ff]">
                      <img src={vidaDigitalUrl} alt={product.descripcion} className="w-full h-full object-contain"
                           onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                  {product.imagenes.length === 0 && !vidaDigitalUrl && (
                    <p className="text-xs text-[#74777f]">Sin imágenes cargadas</p>
                  )}
                  <ImageUploader productoId={product.id} />
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {tab === "edit" && (
        <div className="bg-white border border-[#c4c6cf] rounded-xl p-8">
          <ProductoForm initialData={product} />
        </div>
      )}

      {tab === "history" && (
        <div className="bg-white border border-[#c4c6cf] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#c4c6cf] bg-[#f0f3ff]">
            <h3 className="font-bold">Historial de Cambios en Código Personal</h3>
          </div>
          <div className="divide-y divide-[#e2e8f0]">
            {product.auditoriaCodigo.map((log: any) => (
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
      )}
    </div>
  );
}
