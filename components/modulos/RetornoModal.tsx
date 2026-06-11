"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Undo2, X } from "lucide-react";
import { NumericInput } from "@/components/shared/NumericInput";

type ProductoConStock = {
  id: string;
  codigo: string;
  descripcion: string;
  cantidadAcumulada: number;
  packing: number;
};

type Bodega = {
  id: string;
  nombre: string;
};

type Props = {
  moduloId: string;
  productos: ProductoConStock[];
  bodegas: Bodega[];
  open: boolean;
  onClose: () => void;
};

export default function RetornoModal({
  moduloId,
  productos,
  bodegas,
  open,
  onClose,
}: Props) {
  const router = useRouter();

  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [bodegaDestinoId, setBodegaDestinoId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockDisponible = productoSeleccionado?.cantidadAcumulada ?? 0;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!productoId) {
      setError("Seleccioná un producto");
      return;
    }
    if (!bodegaDestinoId) {
      setError("Seleccioná una bodega destino");
      return;
    }
    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    if (cantidad > stockDisponible) {
      setError(
        `Stock insuficiente en módulo. Disponible: ${stockDisponible} unidades.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/retornos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId,
          moduloOrigenId: moduloId,
          bodegaDestinoId,
          cantidad,
          observaciones: observaciones || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al retornar");

      setSuccess("Mercadería retornada correctamente");
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar el retorno"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-b-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] shrink-0">
          <div className="flex items-center gap-2">
            <Undo2 className="h-4 w-4 text-[#1e3a5f]" />
            <h2 className="text-lg font-bold text-[#111c2d]">
              Retornar mercadería
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#74777f] hover:text-[#111c2d]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Producto selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111c2d]">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => {
                setProductoId(e.target.value);
                setCantidad(0);
              }}
              className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
            >
              <option value="">Seleccionar producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.descripcion} ({p.cantidadAcumulada} u)
                </option>
              ))}
            </select>
          </div>

          {/* Producto info */}
          {productoSeleccionado && (
            <div className="bg-[#f1f5f9] rounded-lg p-3 space-y-1">
              <p className="text-sm font-mono font-bold text-[#1e3a5f]">
                {productoSeleccionado.codigo}
              </p>
              <p className="text-xs text-[#74777f]">
                {productoSeleccionado.descripcion}
              </p>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-[#74777f]">Stock en módulo:</span>
                <span className="font-bold text-[#111c2d]">
                  {stockDisponible.toLocaleString("es-CL")} u
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#74777f]">Packing:</span>
                <span className="font-medium text-[#111c2d]">
                  caja x{productoSeleccionado.packing}
                </span>
              </div>
            </div>
          )}

          {/* Bodega destino */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111c2d]">
              Bodega destino
            </label>
            <select
              value={bodegaDestinoId}
              onChange={(e) => setBodegaDestinoId(e.target.value)}
              className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
            >
              <option value="">Seleccionar bodega...</option>
              {bodegas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111c2d]">
              Cantidad a retornar
              {productoSeleccionado &&
                ` (máx: ${stockDisponible.toLocaleString("es-CL")})`}
            </label>
            <NumericInput
              value={cantidad}
              onChange={(v) => {
                const n = parseInt(v);
                if (!isNaN(n) && n >= 0) setCantidad(n);
              }}
              className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#111c2d]">
              Observaciones (opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full rounded-md border border-[#c4c6cf] bg-[#f9f9ff] px-3 py-2 text-sm text-[#111c2d]"
              placeholder="Ej: producto sobrante del proyecto"
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e8f0] shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading || !productoId}
            className="w-full py-3 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#162e50] transition-colors disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : cantidad > 0
                ? `Retornar ${cantidad.toLocaleString("es-CL")} u a bodega`
                : "Confirmar retorno"}
          </button>
        </div>
      </div>
    </div>
  );
}
