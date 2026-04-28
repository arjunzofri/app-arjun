"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { registrarEntrada } from "@/lib/actions";
import { analyzeInvoice } from "@/lib/gemini";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KingnexOCRPanel({ 
  bodegasData, 
  productosData 
}: { 
  bodegasData: any[], 
  productosData: any[] 
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedBodegaId, setSelectedBodegaId] = useState("");
  const router = useRouter();

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await analyzeInvoice(buffer, file.type);
      setResults(data);
    } catch (error) {
      alert("Error processing image: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!results || !selectedBodegaId) {
      alert("Seleccione una bodega antes de confirmar");
      return;
    }
    
    setLoading(true);
    try {
      for (const item of results.items) {
        // Find matching product by SKU/Code
        const product = productosData.find(p => p.codigo === item.sku);
        if (!product) continue;

        await registrarEntrada({
          productoId: product.id,
          bodegaId: selectedBodegaId,
          cantidad: item.cantidad,
          precioUnitario: item.precio_unitario,
          notaVentaNumero: results.numero_nv,
          proveedor: "kingnex",
          origen: "kingnex"
        });
      }
      alert("Ingreso por OCR completado!");
      setResults(null);
      setFile(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al guardar registros");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-dashed border-slate-800 p-10 text-center hover:border-amber-500/50 transition-colors">
        <Input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden" 
          id="ocr-upload"
        />
        <label htmlFor="ocr-upload" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-slate-500" />
          <p className="text-slate-400">Arrastra o haz click para subir Nota de Venta Kingnex</p>
          {file && <p className="text-amber-500 font-bold mt-2">Archivo: {file.name}</p>}
        </label>
      </div>

      {file && !results && (
        <Button 
          onClick={handleUpload} 
          disabled={loading}
          className="w-full bg-slate-100 text-slate-900 font-bold"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "PROCESAR CON IA"}
        </Button>
      )}

      {results && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white">NV Extrayendo: {results.numero_nv}</h3>
              <p className="text-xs text-slate-500 font-mono">Fecha: {results.fecha}</p>
            </div>
            
            <select 
              className="bg-slate-900 border-slate-800 text-sm rounded-md p-2"
              value={selectedBodegaId}
              onChange={(e) => setSelectedBodegaId(e.target.value)}
            >
              <option value="">Seleccionar Bodega de Ingreso</option>
              {bodegasData.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900">
                  <TableHead>SKU</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Precio U.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.items.map((item: any, i: number) => (
                  <TableRow key={i} className="border-slate-800">
                    <TableCell className="font-mono text-amber-500">{item.sku}</TableCell>
                    <TableCell className="text-xs text-slate-400">{item.descripcion}</TableCell>
                    <TableCell className="font-bold">{item.cantidad}</TableCell>
                    <TableCell className="font-mono text-xs">${item.precio_unitario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700 font-bold" 
            onClick={handleConfirm}
            disabled={loading || !selectedBodegaId}
          >
             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> CONFIRMAR INGRESO AL STOCK</>}
          </Button>
        </div>
      )}
    </div>
  );
}
