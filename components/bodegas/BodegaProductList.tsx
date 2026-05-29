"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRightLeft } from "lucide-react"
import TrasladoModal from "./TrasladoModal"
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo"

type Bodega = { id: string; nombre: string }

type ProductoRow = {
  id: string
  codigo: string
  descripcion: string
  packing: number
  cantidad_actual: number
}

type Props = {
  productos: ProductoRow[]
  bodegaOrigenId: string
  bodegas: Bodega[]
  imagenMap: Map<string, string>
  hasMore: boolean
  lastUpdated: string | null
  qParam: string
  cursorParam: string
}

export default function BodegaProductList({
  productos,
  bodegaOrigenId,
  bodegas,
  imagenMap,
  hasMore,
  lastUpdated,
  qParam,
  cursorParam,
}: Props) {
  const [modalProducto, setModalProducto] = useState<ProductoRow | null>(null)

  return (
    <>
      <div className="space-y-2">
        {productos.map((p) => {
          const imagenUrl =
            imagenMap.get(p.id) ??
            getCloudinaryVidaDigitalUrl(p.descripcion) ??
            null
          return (
            <div
              key={p.id}
              className="bg-white border border-[#e2e8f0] rounded-lg p-4 flex items-center gap-4 hover:shadow-sm hover:border-[#e2e8f0] transition-all"
            >
              <Link href={`/productos/${p.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                {imagenUrl ? (
                  <img
                    src={imagenUrl}
                    alt={p.codigo}
                    className="w-12 h-12 rounded object-cover bg-[#f1f5f9] shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-[#e2e8f0] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-bold text-[#1e3a5f] truncate">
                    {p.codigo}
                  </p>
                  <p className="text-xs text-[#74777f] truncate">{p.descripcion}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-[#111c2d]">
                    {p.cantidad_actual.toLocaleString("es-CL")}
                  </p>
                  <p className="text-[10px] text-[#94a3b8]">u · caja x{p.packing}</p>
                </div>
              </Link>
              <button
                onClick={() => setModalProducto(p)}
                className="shrink-0 px-3 py-2 bg-[#1e3a5f] text-white text-xs font-bold rounded-lg hover:bg-[#162e50] transition-colors flex items-center gap-1"
                title="Trasladar a otra bodega"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Trasladar
              </button>
            </div>
          )
        })}
      </div>

      {hasMore && lastUpdated && (
        <div className="text-center mt-4">
          <Link
            href={`/bodegas/${bodegaOrigenId}?cursor=${encodeURIComponent(String(lastUpdated))}${qParam}`}
            className="inline-block px-6 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162e50] transition-colors"
          >
            Cargar más
          </Link>
        </div>
      )}

      {modalProducto && (
        <TrasladoModal
          producto={modalProducto}
          bodegaOrigenId={bodegaOrigenId}
          bodegas={bodegas}
          onSuccess={() => {
            setModalProducto(null)
            window.location.reload()
          }}
          onClose={() => setModalProducto(null)}
        />
      )}
    </>
  )
}
