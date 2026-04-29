"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SalidaSchema } from "@/lib/validations";
import type { SalidaInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registrarSalida } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✅ Despacho registrado con éxito
        </div>
      )}
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
    </form>
  );
}
