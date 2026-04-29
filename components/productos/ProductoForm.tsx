"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductoSchema } from "@/lib/validations";
import type { ProductoInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrUpdateProducto } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast"; // assuming use-toast is available or will be

export default function ProductoForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useForm<ProductoInput>({
    resolver: zodResolver(ProductoSchema),
    defaultValues: {
      codigo: "",
      descripcion: "",
      codigoPersonal: "",
      packing: 1,
      ubicacion: "",
      observaciones: "",
    }
  });
  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (data: ProductoInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await createOrUpdateProducto({ ...data, id: initialData?.id });
      setSuccess(true)
      setTimeout(() => router.push("/productos"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar producto")
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-900/10 p-3 text-sm text-red-400">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-900/50 bg-green-900/10 p-3 text-sm text-green-400">
          ✅ Producto guardado con éxito
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Código Proveedor</Label>
          <Input 
            {...register("codigo")} 
            className="bg-slate-900 border-slate-800" 
            placeholder="Ej: K-1234"
          />
          {errors.codigo && <p className="text-red-500 text-xs">{errors.codigo.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Código Personal (Opcional)</Label>
          <Input 
            {...register("codigoPersonal")} 
            className="bg-slate-900 border-slate-800" 
            placeholder="Ej: CARG-IPH-W"
          />
        </div>
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label>Descripción</Label>
          <Input 
            {...register("descripcion")} 
            className="bg-slate-900 border-slate-800" 
            placeholder="Descripción detallada del producto"
          />
          {errors.descripcion && <p className="text-red-500 text-xs">{errors.descripcion.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Packing (U/Caja)</Label>
          <Input 
            type="number" 
            {...register("packing", { valueAsNumber: true })} 
            className="bg-slate-900 border-slate-800" 
          />
        </div>
        <div className="space-y-2">
          <Label>Ubicación</Label>
          <Input 
            {...register("ubicacion")} 
            className="bg-slate-900 border-slate-800" 
            placeholder="Ej: Pasillo 2, Estante B"
          />
        </div>
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label>Observaciones (Interno)</Label>
          <Input 
            {...register("observaciones")} 
            className="bg-slate-900 border-slate-800" 
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button 
          type="submit" 
          className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
          disabled={loading}
        >
          {loading ? "Guardando..." : "GUARDAR CAMBIOS"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          className="border-slate-800 text-slate-300"
        >
          CANCELAR
        </Button>
      </div>
    </form>
  );
}
