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
import { registrarSalida } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

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

  const selectedBodegaId = watch("bodegaOrigenId");

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

  // Productos adaptados para BuscadorProducto
  const productosBusqueda = useMemo(() =>
    productosData.map((p: any) => ({
      id: p.id,
      codigo: p.codigo,
      descripcion: p.descripcion,
      imagen: p.imagenes?.[0]?.url ?? null,
      ubicacion: p.ubicacion,
    })),
    [productosData]
  );

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
      <div className="md:hidden space-y-5">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Producto</Label>
          <BuscadorProducto
            productos={productosBusqueda}
            selected={selectedProducto ? { id: selectedProducto.id, codigo: selectedProducto.codigo, descripcion: selectedProducto.descripcion, imagen: selectedProducto.imagenes?.[0]?.url ?? null } : null}
            onSelect={(p) => {
              if (!p) {
                setValue("productoId", "");
                setValue("bodegaOrigenId", "");
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
            <div className="flex justify-end mt-2">
              <BotonFoto productoId={selectedProductoId} />
            </div>
          )}
        </div>

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
                  onClick={() => setValue("bodegaOrigenId", b.id)}
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
          <Label className="text-sm font-semibold mb-2 block">Cantidad</Label>
          <InputCantidad
            value={cantidad}
            onChange={(n) => setValue("cantidad", n)}
            packing={packing}
            max={999}
          />
        </div>

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
