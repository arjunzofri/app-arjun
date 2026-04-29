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
      const data = await analyzeInvoice(buffer.toString('base64'), file.type);
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
      <div className="rounded-xl border-2 border-dashed border-[#c4c6cf] p-10 text-center hover:border-[#0051d5]/50 transition-colors">
        <Input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden" 
          id="ocr-upload"
        />
        <label htmlFor="ocr-upload" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-[#74777f]" />
          <p className="text-[#74777f]">Arrastra o haz click para subir Nota de Venta Kingnex</p>
          {file && <p className="text-[#0051d5] font-bold mt-2">Archivo: {file.name}</p>}
        </label>
      </div>

      {file && !results && (
        <Button 
          onClick={handleUpload} 
          disabled={loading}
          className="w-full bg-[#2563eb] text-white font-bold hover:bg-[#1d4ed8]"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "PROCESAR CON IA"}
        </Button>
      )}

      {results && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#c4c6cf] pb-4">
            <div>
              <h3 className="font-bold text-[#111c2d]">NV Extrayendo: {results.numero_nv}</h3>
              <p className="text-xs text-[#74777f] font-mono">Fecha: {results.fecha}</p>
            </div>
            
            <select 
              className="bg-white border-[#c4c6cf] text-sm rounded-md p-2"
              value={selectedBodegaId}
              onChange={(e) => setSelectedBodegaId(e.target.value)}
            >
              <option value="">Seleccionar Bodega de Ingreso</option>
              {bodegasData.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#c4c6cf]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#c4c6cf] bg-white">
                  <TableHead>SKU</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Precio U.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.items.map((item: any, i: number) => (
                  <TableRow key={i} className="border-[#c4c6cf]">
                    <TableCell className="font-mono text-[#0051d5]">{item.sku}</TableCell>
                    <TableCell className="text-xs text-[#74777f]">{item.descripcion}</TableCell>
                    <TableCell className="font-bold">{item.cantidad}</TableCell>
                    <TableCell className="font-mono text-xs">${item.precio_unitario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button 
            className="w-full bg-[#16a34a] text-white hover:bg-[#15803d] font-bold"
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

