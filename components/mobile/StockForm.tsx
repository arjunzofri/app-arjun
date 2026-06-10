"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BuscadorProducto } from "@/components/mobile/BuscadorProducto"
import { InputCantidad } from "@/components/mobile/InputCantidad"
import { BotonFoto } from "@/components/mobile/BotonFoto"
import { actualizarStock } from "@/lib/actions"

type Producto = { id: string; codigo: string; descripcion: string; packing: number; imagenes?: any[] }
type Bodega = { id: string; nombre: string }
type StockInfo = { productoId: string; bodegaId: string; bodegaNombre: string; cantidadActual: number }

type Props = { productos: Producto[]; bodegas: Bodega[]; stocks: StockInfo[] }

export default function StockForm({ productos, bodegas, stocks }: Props) {
  const router = useRouter()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [bodegaId, setBodegaId] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const productosBusqueda = useMemo(() =>
    productos.map(p => ({ id: p.id, codigo: p.codigo, descripcion: p.descripcion, imagen: p.imagenes?.[0]?.url ?? null })),
    [productos]
  )

  const stockProducto = useMemo(() =>
    producto ? stocks.filter(s => s.productoId === producto.id) : [],
    [producto, stocks]
  )

  const bodegaActual = useMemo(() => {
    if (!bodegaId) return null
    const s = stockProducto.find(s => s.bodegaId === bodegaId)
    return s || null
  }, [bodegaId, stockProducto])

  const packing = producto?.packing ?? 1

  const handleConfirmar = async () => {
    if (!producto || !bodegaId) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await actualizarStock(producto.id, bodegaId, cantidad)
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message || "Error al actualizar stock")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1e293b] mb-4">Actualizar Stock</h2>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 mb-4">{error}</div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">Stock actualizado con éxito</div>
        )}
      </div>

      <BuscadorProducto
        productos={productosBusqueda}
        selected={producto ? { id: producto.id, codigo: producto.codigo, descripcion: producto.descripcion, imagen: producto.imagenes?.[0]?.url ?? null } : null}
        onSelect={(p) => {
          if (!p) { setProducto(null); setBodegaId(null); setCantidad(1); return }
          const full = productos.find(pr => pr.id === p.id) || null
          setProducto(full)
          setBodegaId(null)
          setCantidad(1)
        }}
      />

      {producto && (
        <div className="flex justify-end mt-2">
          <BotonFoto productoId={producto.id} />
        </div>
      )}

      {producto && (
        <div className="bg-[#f1f5f9] rounded-lg p-3 text-sm text-[#475569]">
          <span className="font-semibold">Packing:</span> {packing} unid/caja
          {stockProducto.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="font-semibold">Stock actual:</span>
              {stockProducto.map(s => (
                <div key={s.productoId + s.bodegaId} className="flex justify-between text-xs">
                  <span>{s.bodegaNombre}</span>
                  <span className="font-bold">{s.cantidadActual} unid</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {producto && bodegas.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2 text-[#1e293b]">Bodega a actualizar</p>
          <div className="grid grid-cols-3 gap-3">
            {bodegas.map((b) => {
              const isActive = bodegaId === b.id
              const nombre = b.nombre.replace("Bodega ", "")
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBodegaId(b.id); setCantidad(bodegaActual?.cantidadActual || 1) }}
                  className={`flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl border-2 font-bold transition-all text-sm ${
                    isActive
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                      : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
                  }`}
                >
                  {nombre}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {producto && bodegaId && (
        <>
          <div>
            <p className="text-sm font-semibold mb-2 text-[#1e293b]">Cantidad contada</p>
            <InputCantidad value={cantidad} onChange={setCantidad} packing={packing} max={99999} />
          </div>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-[#16a34a] text-white hover:bg-[#15803d] rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "ACTUALIZANDO..." : "CONFIRMAR STOCK"}
          </button>
        </>
      )}
    </div>
  )
}
