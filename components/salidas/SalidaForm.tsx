"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SalidaSchema } from "@/lib/validations";
import type { SalidaInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuscadorProducto } from "@/components/mobile/BuscadorProducto";
import { BotonesModulo } from "@/components/mobile/BotonesModulo";
import { InputCantidad } from "@/components/mobile/InputCantidad";
import { BotonFoto } from "@/components/mobile/BotonFoto";
import { registrarSalida, getStockWinfac, registrarConteoFisico, actualizarUbicacionProducto } from "@/lib/actions";
import { getImagenVidaDigital } from "@/lib/utils/extract-modelo";
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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const log = useCallback((msg: string) => setDebugLog(prev => [...prev.slice(-5), msg]), []);

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
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

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
    log(`useEffect bodega: prod=${selectedProducto?.id?.slice(-6)}, ubic=${selectedProducto?.ubicacion}, bodegaSel=${selectedBodegaId?.slice(-6)}`);
    if (selectedProducto?.ubicacion && bodegasData.length > 0) {
      const bodega = bodegasData.find((b: any) =>
        b.nombre === selectedProducto.ubicacion ||
        b.nombre.toLowerCase().includes(selectedProducto.ubicacion?.toLowerCase() || "")
      )
      log(`useEffect bodega encontrada: ${bodega?.nombre || "NINGUNA"}`);
      if (bodega) setValue("bodegaOrigenId", bodega.id)
    }
  }, [selectedProducto?.id]);

  // Stock disponible real del producto en la bodega seleccionada
  const stockDisponible = useMemo(() => {
    if (!selectedProducto?.stock || !selectedBodegaId) return 0;
    const s = selectedProducto.stock.find((st: any) => st.bodegaId === selectedBodegaId);
    return s?.cantidadActual ?? 0;
  }, [selectedProducto, selectedBodegaId]);

  // Inicializar conteoCantidad con el stock actual cuando cambia producto o bodega
  useEffect(() => {
    if (selectedProductoId && selectedBodegaId) {
      const stockEnBodega = selectedProducto?.stock?.find(
        (s: any) => s.bodegaId === selectedBodegaId
      )
      setConteoCantidad(stockEnBodega?.cantidadActual ?? 0)
    }
  }, [selectedProductoId, selectedBodegaId]);

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
      await registrarSalida(data);
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message || "Error al registrar salida")
    } finally {
      setLoading(false);
    }
  };

  // Productos adaptados para BuscadorProducto — usa getImagenVidaDigital como fallback
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Despacho registrado con éxito
        </div>
      )}

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
              log(`onSelect: limpiar, bodegaSel=${selectedBodegaId?.slice(-6)}`);
              setValue("productoId", "");
              return;
            }
            log(`onSelect: cod=${p.codigo}, ubic=${p.ubicacion}, bodegaSug=${bodegaSugerida?.nombre || "null"}`);
            setValue("productoId", p.id);
            if (!bodegaSugerida) {
              const bodega = bodegasData.find(b =>
                b.nombre.toLowerCase().includes(p.ubicacion?.toLowerCase() || "")
              );
              log(`onSelect buscar bodega x ubic: ${p.ubicacion} → ${bodega?.nombre || "NINGUNA"}`);
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
                  className="w-20 h-20 rounded object-contain bg-white border border-[#e2e8f0]" />
              ) : (
                <div className="w-20 h-20 rounded bg-[#e2e8f0] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1e293b]">{selectedProducto.codigo}</p>
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

        <div>
          <Label className="text-sm font-semibold mb-2 block">Bodega Origen</Label>
          {bodegaSugerida && selectedBodegaId === bodegaSugerida.id && (
            <p className="text-xs text-[#16a34a] mb-2">Pre-seleccionada desde ubicación del producto</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {bodegasData.map((b: any) => {
              const isActive = selectedBodegaId === b.id;
              const nombre = b.nombre.replace("Bodega ", "");
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    log(`bodega click: ${b.nombre} para prod ${selectedProductoId?.slice(-6)}`);
                    actualizarUbicacionProducto(selectedProductoId, b.id);
                    setValue("bodegaOrigenId", b.id);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl border-2 font-bold transition-all text-sm ${
                    isActive
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                      : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
                  }`}
                >
                  {nombre}
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
            max={stockDisponible || 999}
          />
        </div>

        {debugLog.length > 0 && (
          <div className="bg-black/80 text-green-400 text-xs font-mono p-3 rounded-lg space-y-1">
            {debugLog.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-[#16a34a] text-white hover:bg-[#15803d]"
          disabled={loading}
        >
          {loading ? "PROCESANDO..." : "CONFIRMAR DESPACHO"}
        </Button>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select onValueChange={(val) => setValue("productoId", val as string)}>
              <SelectTrigger className="bg-white border-[#c4c6cf]">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent className="bg-[#f9f9ff] border-[#c4c6cf]">
                {productosData.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo} - {p.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bodega Origen</Label>
            <Select onValueChange={(val) => setValue("bodegaOrigenId", val as string)}>
              <SelectTrigger className="bg-white border-[#c4c6cf]">
                <SelectValue placeholder="Seleccionar origen" />
              </SelectTrigger>
              <SelectContent className="bg-[#f9f9ff] border-[#c4c6cf]">
                {bodegasData.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Módulo Destino</Label>
            <Select onValueChange={(val) => setValue("moduloDestinoId", val as string)}>
              <SelectTrigger className="bg-white border-[#c4c6cf]">
                <SelectValue placeholder="Seleccionar destino" />
              </SelectTrigger>
              <SelectContent className="bg-[#f9f9ff] border-[#c4c6cf]">
                {modulosData.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cantidad</Label>
            <Input
              type="number"
              {...register("cantidad", { valueAsNumber: true })}
              className="bg-white border-[#c4c6cf]"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label>Observaciones</Label>
            <Input
              {...register("observaciones")}
              className="bg-white border-[#c4c6cf]"
              placeholder="Ej: Entrega urgente módulo 180"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#16a34a] text-white font-bold hover:bg-[#15803d]"
          disabled={loading}
        >
          {loading ? "PROCESANDO DESPACHO..." : "REGISTRAR SALIDA"}
        </Button>
      </div>
    </form>
  );
}
