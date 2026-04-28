"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SalidaSchema, SalidaInput } from "@/lib/validations";
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
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SalidaInput>({
    resolver: zodResolver(SalidaSchema),
  });

  const selectedProductoId = watch("productoId");
  const selectedBodegaId = watch("bodegaOrigenId");

  async function onSubmit(data: SalidaInput) {
    setLoading(true);
    try {
      await registrarSalida(data);
      router.refresh();
      alert("Despacho registrado correctamente");
    } catch (error: any) {
      alert(error.message || "Error al registrar salida");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Producto</Label>
          <Select onValueChange={(val) => setValue("productoId", val)}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
              <SelectValue placeholder="Seleccionar producto" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800">
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
          <Select onValueChange={(val) => setValue("bodegaOrigenId", val)}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
              <SelectValue placeholder="Seleccionar origen" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800">
              {bodegasData.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Módulo Destino</Label>
          <Select onValueChange={(val) => setValue("moduloDestinoId", val)}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
              <SelectValue placeholder="Seleccionar destino" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800">
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
            {...register("cantidad")}
            className="bg-slate-900 border-slate-800" 
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label>Observaciones</Label>
          <Input 
            {...register("observaciones")}
            className="bg-slate-900 border-slate-800" 
            placeholder="Ej: Entrega urgente módulo 180"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
        disabled={loading}
      >
        {loading ? "PROCESANDO DESPACHO..." : "REGISTRAR SALIDA"}
      </Button>
    </form>
  );
}
