"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SalidaSchema } from "@/lib/validations";
import type { SalidaInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BuscadorProducto } from "@/components/mobile/BuscadorProducto";
import { BotonesModulo } from "@/components/mobile/BotonesModulo";
import { InputCantidad } from "@/components/mobile/InputCantidad";
import { BotonFoto } from "@/components/mobile/BotonFoto";
import { registrarSalida, getStockWinfac, registrarConteoFisico, actualizarUbicacionProducto } from "@/lib/actions";
import { getImagenVidaDigital } from "@/lib/utils/extract-modelo";
import { HistorialModal } from "@/components/shared/HistorialModal";
import { ProductoEditModal } from "@/components/shared/ProductoEditModal";
import { NumericInput } from "@/components/shared/NumericInput";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";

export default function SalidaForm({
  productosData,
  bodegasData,
  modulosData
}: {
  productosData: any[],
  bodegasData: any[],
  modulosData: any[]
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [winfacSaldo, setWinfacSaldo] = useState<number | null>(null);
  const [conteoCantidad, setConteoCantidad] = useState(0);
  const [conteoLoading, setConteoLoading] = useState(false);
  const [conteoMsg, setConteoMsg] = useState<string | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [showObs, setShowObs] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { data: session } = useSession();

  const form = useForm<SalidaInput>({
    resolver: zodResolver(SalidaSchema),
    defaultValues: {
      productoId: "",
      bodegaOrigenId: "",
      moduloDestinoId: "",
      cantidad: 1,
      observaciones: "",
    }
  });
  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  const selectedProductoId = watch("productoId");
  const selectedModuloId = watch("moduloDestinoId");
  const cantidad = watch("cantidad");
  const selectedBodegaId = watch("bodegaOrigenId");

  const selectedProducto = useMemo(
    () => productosData.find(p => p.id === selectedProductoId) || null,
    [productosData, selectedProductoId]
  );

  const packing = selectedProducto?.packing ?? 1;

  // Bodega pre-seleccionada desde producto.ubicacion
  const bodegaSugerida = useMemo(() => {
    if (!selectedProducto?.ubicacion) return null;
    return bodegasData.find(b =>
      b.nombre.toLowerCase().includes(selectedProducto.ubicacion.toLowerCase())
    ) || null;
  }, [selectedProducto, bodegasData]);

  // Auto-aplicar bodega desde producto.ubicacion solo cuando cambia el producto
  useEffect(() => {
    if (selectedProducto?.ubicacion && bodegasData.length > 0) {
      const bodega = bodegasData.find((b: any) =>
        b.nombre === selectedProducto.ubicacion ||
        b.nombre.toLowerCase().includes(selectedProducto.ubicacion?.toLowerCase() || "")
      )
      if (bodega) setValue("bodegaOrigenId", bodega.id)
    }
  }, [selectedProducto?.id]);

  // Inicializar conteoCantidad con el stock actual
  useEffect(() => {
    if (selectedProductoId && selectedBodegaId && selectedProducto?.stock) {
      const s = selectedProducto.stock.find((s: any) => s.bodegaId === selectedBodegaId)
      setConteoCantidad(s?.cantidadActual ?? 0)
    }
  }, [selectedProductoId, selectedBodegaId, selectedProducto?.stock]);

  // Fetch WinFac saldo cuando cambia el producto seleccionado
  useEffect(() => {
    if (selectedProducto?.codigo) {
      getStockWinfac(selectedProducto.codigo).then(setWinfacSaldo).catch(() => setWinfacSaldo(null));
    } else {
      setWinfacSaldo(null);
    }
  }, [selectedProducto?.codigo]);

  const handleConteo = useCallback(async () => {
    if (!selectedProductoId || !selectedBodegaId) {
      setConteoMsg("Selecciona una bodega primero");
      return;
    }
    setConteoLoading(true);
    setConteoMsg(null);
    try {
      await registrarConteoFisico(selectedProductoId, selectedBodegaId, conteoCantidad);
      setConteoMsg(`✅ Stock actualizado: ${conteoCantidad} unidades`);
      router.refresh();
      setTimeout(() => setConteoMsg(null), 3000);
    } catch (e: any) {
      setConteoMsg(e.message || "Error al actualizar stock");
    } finally {
      setConteoLoading(false);
    }
  }, [selectedProductoId, selectedBodegaId, conteoCantidad, router]);

  const onSubmit = async (data: SalidaInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result: any = await registrarSalida(data);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message || "Error al registrar salida")
    } finally {
      setLoading(false);
    }
  };

  // Productos adaptados para BuscadorProducto
  const productosBusqueda = useMemo(() =>
    productosData.map((p: any) => ({
      id: p.id,
      codigo: p.codigo,
      descripcion: p.descripcion,
      imagen: p.imagenes?.[0]?.url ?? getImagenVidaDigital(p.descripcion),
      ubicacion: p.ubicacion,
    })),
    [productosData]
  );

  const imagenProducto = selectedProducto
    ? (selectedProducto.imagenes?.[0]?.url ?? getImagenVidaDigital(selectedProducto.descripcion))
    : null;

  // Stock en una bodega específica
  const stockEnBodega = useCallback((bodegaId: string) => {
    if (!selectedProducto?.stock) return 0;
    const s = selectedProducto.stock.find((st: any) => st.bodegaId === bodegaId);
    return s?.cantidadActual ?? 0;
  }, [selectedProducto]);

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ===== MÓVIL ===== */}
      <div className="md:hidden space-y-4">
        <BuscadorProducto
          productos={productosBusqueda}
          selected={selectedProducto ? {
            id: selectedProducto.id,
            codigo: selectedProducto.codigo,
            descripcion: selectedProducto.descripcion,
            imagen: imagenProducto,
          } : null}
          onSelect={(p) => {
            if (!p) {
              setValue("productoId", "");
              return;
            }
            setValue("productoId", p.id);
            if (!bodegaSugerida) {
              const bodega = bodegasData.find(b =>
                b.nombre.toLowerCase().includes(p.ubicacion?.toLowerCase() || "")
              );
              if (bodega) setValue("bodegaOrigenId", bodega.id);
            }
          }}
        />

        {selectedProductoId && (
          <div className="flex justify-end">
            <BotonFoto productoId={selectedProductoId} />
          </div>
        )}

        {/* Producto detalle + conteo físico */}
        {selectedProducto && (
          <div className="bg-[#f1f5f9] rounded-lg p-4 space-y-3">
            <div className="flex gap-3">
              {imagenProducto ? (
                <img src={imagenProducto} alt={selectedProducto.codigo}
                  onClick={() => setHistorialOpen(true)}
                  className="w-20 h-20 rounded object-contain bg-white border border-[#e2e8f0] cursor-pointer hover:border-[#1e3a5f]" />
              ) : (
                <div className="w-20 h-20 rounded bg-[#e2e8f0] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[#1e293b] cursor-pointer hover:text-[#1e3a5f]" onClick={() => setHistorialOpen(true)}>{selectedProducto.codigo}</p>
                  <button type="button" onClick={() => setEditOpen(true)} className="p-0.5 text-[#94a3b8] hover:text-[#1e3a5f]">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#64748b] line-clamp-2">{selectedProducto.descripcion}</p>
                <p className="text-xs text-[#64748b] mt-1">Packing: {packing} u/caja</p>
                {winfacSaldo !== null && (
                  <p className="text-xs font-semibold text-[#1e3a5f] mt-0.5">Saldo WinFac: {winfacSaldo} u</p>
                )}
              </div>
            </div>

            <hr className="border-[#c4c6cf]" />

            <div>
              <p className="text-xs font-semibold text-[#1e293b] mb-2">Saldo físico contado:</p>
              <NumericInput
                value={conteoCantidad}
                onChange={(v) => {
                  const n = parseInt(v, 10);
                  if (!isNaN(n) && n >= 0) setConteoCantidad(n);
                  else if (v === "") setConteoCantidad(0);
                }}
                className="w-full h-14 text-center text-2xl font-bold border-2 border-[#c4c6cf] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
              <p className="text-center text-xs text-[#64748b] mt-1">unidades</p>
              {packing > 1 && conteoCantidad > 0 && (
                <p className="text-center text-xs text-[#64748b]">
                  = {Math.floor(conteoCantidad / packing)} caja{Math.floor(conteoCantidad / packing) !== 1 ? "s" : ""} + {conteoCantidad % packing} unidad{conteoCantidad % packing !== 1 ? "es" : ""}
                </p>
              )}
              {conteoMsg && (
                <p className={`text-xs mt-1 text-center ${conteoMsg.includes("error") || conteoMsg.includes("Selecciona") ? "text-red-500" : "text-green-600"}`}>
                  {conteoMsg}
                </p>
              )}
              <button
                type="button"
                onClick={handleConteo}
                disabled={conteoLoading}
                className="w-full mt-2 h-10 text-sm font-bold bg-[#1e3a5f] text-white hover:bg-[#162e50] rounded-lg transition-colors disabled:opacity-50"
              >
                {conteoLoading ? "ACTUALIZANDO..." : "ACTUALIZAR STOCK FÍSICO"}
              </button>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-semibold mb-2 block">Bodega Origen</Label>
          {bodegaSugerida && selectedBodegaId === bodegaSugerida.id && (
            <p className="text-xs text-[#16a34a] mb-2">Pre-seleccionada desde ubicación del producto</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {bodegasData.map((b: any) => {
              const isActive = selectedBodegaId === b.id;
              const nombre = b.nombre.replace("Bodega ", "");
              const cantidadUnidades = stockEnBodega(b.id);
              let stockLabel = "";
              if (!selectedProductoId) {
                stockLabel = "";
              } else if (cantidadUnidades === 0) {
                stockLabel = "Sin stock";
              } else if (packing > 1) {
                const cajas = Math.floor(cantidadUnidades / packing);
                const sueltas = cantidadUnidades % packing;
                if (cajas > 0 && sueltas > 0) stockLabel = `${cajas}c + ${sueltas}u`;
                else if (cajas > 0) stockLabel = `${cajas} cajas`;
                else stockLabel = `${sueltas} u`;
              } else {
                stockLabel = `${cantidadUnidades} u`;
              }
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    actualizarUbicacionProducto(selectedProductoId, b.id);
                    setValue("bodegaOrigenId", b.id);
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 py-4 px-3 rounded-xl border-2 font-bold transition-all text-sm ${
                    isActive
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                      : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
                  }`}
                >
                  {nombre}
                  {stockLabel && (
                    <span className={`text-xs font-normal ${isActive ? "text-white/70" : "text-[#94a3b8]"}`}>
                      {stockLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Módulo Destino</Label>
          <BotonesModulo
            modulos={modulosData as any}
            selected={selectedModuloId || null}
            onSelect={(id) => setValue("moduloDestinoId", id)}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Cantidad a despachar</Label>
          <InputCantidad
            value={cantidad}
            onChange={(n) => setValue("cantidad", n)}
            packing={packing}
            max={stockEnBodega(selectedBodegaId) || 999}
          />
        </div>

        <div>
          {!showObs ? (
            <button type="button" onClick={() => setShowObs(true)} className="text-sm text-[#1e3a5f] font-medium hover:underline">
              + Agregar observación
            </button>
          ) : (
            <div className="space-y-1">
              <textarea
                value={watch("observaciones") || ""}
                onChange={(e) => setValue("observaciones", e.target.value)}
                placeholder="Observaciones del despacho..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
              />
              <button type="button" onClick={() => { setValue("observaciones", ""); setShowObs(false); }} className="text-xs text-[#94a3b8] hover:text-[#74777f]">
                Quitar
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium">
            ✅ Despacho registrado con éxito
          </div>
        )}
        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-[#16a34a] text-white hover:bg-[#15803d]"
          disabled={loading}
          onClick={() => {
            if (!watch("moduloDestinoId")) {
              setError("Selecciona un módulo de destino");
              return;
            }
            if (!watch("bodegaOrigenId")) {
              setError("Selecciona una bodega de origen");
              return;
            }
          }}
        >
          {loading ? "PROCESANDO..." : "CONFIRMAR DESPACHO"}
        </Button>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-8">
        {/* Columna izquierda — Producto + Bodega + Cantidad */}
        <div className="space-y-4">
          <BuscadorProducto
            productos={productosBusqueda}
            selected={selectedProducto ? {
              id: selectedProducto.id,
              codigo: selectedProducto.codigo,
              descripcion: selectedProducto.descripcion,
              imagen: imagenProducto,
            } : null}
            onSelect={(p) => {
              if (!p) {
                setValue("productoId", "");
                return;
              }
              setValue("productoId", p.id);
              if (!bodegaSugerida) {
                const bodega = bodegasData.find(b =>
                  b.nombre.toLowerCase().includes(p.ubicacion?.toLowerCase() || "")
                );
                if (bodega) setValue("bodegaOrigenId", bodega.id);
              }
            }}
          />

          {selectedProducto && (
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                {imagenProducto ? (
                  <img src={imagenProducto} alt={selectedProducto.codigo}
                    onClick={() => setHistorialOpen(true)}
                    className="w-[120px] h-[120px] rounded object-contain bg-white border border-[#e2e8f0] shrink-0 cursor-pointer hover:border-[#1e3a5f]" />
                ) : (
                  <div className="w-[120px] h-[120px] rounded bg-[#e2e8f0] shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-[#1e293b] cursor-pointer hover:text-[#1e3a5f]" onClick={() => setHistorialOpen(true)}>{selectedProducto.codigo}</p>
                    <button type="button" onClick={() => setEditOpen(true)} className="p-0.5 text-[#94a3b8] hover:text-[#1e3a5f]">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-[#64748b] line-clamp-2">{selectedProducto.descripcion}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <BotonFoto productoId={selectedProductoId} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-semibold mb-2 block">Bodega Origen</Label>
            {bodegaSugerida && selectedBodegaId === bodegaSugerida.id && (
              <p className="text-xs text-[#16a34a] mb-2">Pre-seleccionada desde ubicación del producto</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {bodegasData.map((b: any) => {
                const isActive = selectedBodegaId === b.id;
                const nombre = b.nombre.replace("Bodega ", "");
                const cantidadUnidades = stockEnBodega(b.id);
                let stockLabel = "";
                if (!selectedProductoId) {
                  stockLabel = "";
                } else if (cantidadUnidades === 0) {
                  stockLabel = "Sin stock";
                } else if (packing > 1) {
                  const cajas = Math.floor(cantidadUnidades / packing);
                  const sueltas = cantidadUnidades % packing;
                  if (cajas > 0 && sueltas > 0) stockLabel = `${cajas}c + ${sueltas}u`;
                  else if (cajas > 0) stockLabel = `${cajas} cajas`;
                  else stockLabel = `${sueltas} u`;
                } else {
                  stockLabel = `${cantidadUnidades} u`;
                }
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      actualizarUbicacionProducto(selectedProductoId, b.id);
                      setValue("bodegaOrigenId", b.id);
                    }}
                    className={`flex flex-col items-center justify-center gap-0.5 py-4 px-3 rounded-xl border-2 font-bold transition-all text-sm ${
                      isActive
                        ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                        : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
                    }`}
                  >
                    {nombre}
                    {stockLabel && (
                      <span className={`text-xs font-normal ${isActive ? "text-white/70" : "text-[#94a3b8]"}`}>
                        {stockLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Cantidad a despachar</Label>
            <InputCantidad
              value={cantidad}
              onChange={(n) => setValue("cantidad", n)}
              packing={packing}
              max={stockEnBodega(selectedBodegaId) || 999}
            />
          </div>

          <div>
            {!showObs ? (
              <button type="button" onClick={() => setShowObs(true)} className="text-sm text-[#1e3a5f] font-medium hover:underline">
                + Agregar observación
              </button>
            ) : (
              <div className="space-y-1">
                <textarea
                  value={watch("observaciones") || ""}
                  onChange={(e) => setValue("observaciones", e.target.value)}
                  placeholder="Observaciones del despacho..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
                />
                <button type="button" onClick={() => { setValue("observaciones", ""); setShowObs(false); }} className="text-xs text-[#94a3b8] hover:text-[#74777f]">
                  Quitar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha — Módulo + Conteo + Confirmar */}
        <div className="space-y-4">
          <div>
            <Label>Módulo Destino</Label>
            <BotonesModulo
              modulos={modulosData as any}
              selected={selectedModuloId || null}
              onSelect={(id) => setValue("moduloDestinoId", id)}
            />
          </div>

          {selectedProducto && (
            <div className="bg-[#f1f5f9] rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#1e293b] mb-2">Saldo físico contado:</p>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  value={conteoCantidad}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n >= 0) setConteoCantidad(n);
                    else if (e.target.value === "") setConteoCantidad(0);
                  }}
                  className="w-full h-14 text-center text-2xl font-bold border-2 border-[#c4c6cf] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
                <p className="text-center text-xs text-[#64748b] mt-1">unidades</p>
                {packing > 1 && conteoCantidad > 0 && (
                  <p className="text-center text-xs text-[#64748b]">
                    = {Math.floor(conteoCantidad / packing)} caja{Math.floor(conteoCantidad / packing) !== 1 ? "s" : ""} + {conteoCantidad % packing} unidad{conteoCantidad % packing !== 1 ? "es" : ""}
                  </p>
                )}
                {conteoMsg && (
                  <p className={`text-xs mt-1 text-center ${conteoMsg.includes("error") || conteoMsg.includes("Selecciona") ? "text-red-500" : "text-green-600"}`}>
                    {conteoMsg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleConteo}
                  disabled={conteoLoading}
                  className="w-full mt-2 h-10 text-sm font-bold bg-[#1e3a5f] text-white hover:bg-[#162e50] rounded-lg transition-colors disabled:opacity-50"
                >
                  {conteoLoading ? "ACTUALIZANDO..." : "ACTUALIZAR STOCK FÍSICO"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 font-medium">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium">
              ✅ Despacho registrado con éxito
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold bg-[#16a34a] text-white hover:bg-[#15803d]"
            disabled={loading}
            onClick={() => {
              if (!watch("moduloDestinoId")) {
                setError("Selecciona un módulo de destino");
                return;
              }
              if (!watch("bodegaOrigenId")) {
                setError("Selecciona una bodega de origen");
                return;
              }
            }}
          >
            {loading ? "PROCESANDO..." : "CONFIRMAR DESPACHO"}
          </Button>
        </div>
      </div>
    </form>
      {selectedProducto && (
        <HistorialModal
          productoId={selectedProducto.id}
          codigo={selectedProducto.codigo}
          open={historialOpen}
          onClose={() => setHistorialOpen(false)}
        />
      )}
      {selectedProducto && (
        <ProductoEditModal
          producto={{
            id: selectedProducto.id,
            codigo: selectedProducto.codigo,
            codigoPersonal: selectedProducto.codigoPersonal,
            descripcion: selectedProducto.descripcion,
            packing: selectedProducto.packing,
            observaciones: selectedProducto.observaciones,
          }}
          userRole={session?.user?.role || "operador"}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
