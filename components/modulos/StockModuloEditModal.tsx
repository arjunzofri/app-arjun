"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NumericInput } from "@/components/shared/NumericInput";
import { Pencil, X, Trash2 } from "lucide-react";
import { editarStockModulo, eliminarStockModulo } from "@/lib/actions";

export function StockModuloEditModal({
  productoId,
  moduloId,
  codigo,
  cantidadAcumulada,
  userRole,
  open,
  onClose,
}: {
  productoId: string;
  moduloId: string;
  codigo: string;
  cantidadAcumulada: number;
  userRole: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [cantidad, setCantidad] = useState(cantidadAcumulada);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    if (open) setCantidad(cantidadAcumulada);
  }, [open, cantidadAcumulada]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await editarStockModulo(productoId, moduloId, { cantidadAcumulada: cantidad });
      setSuccess("Stock actualizado");
      router.refresh();
      setTimeout(() => { setSuccess(null); onClose(); }, 1000);
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este registro del módulo?")) return;
    setDeleting(true);
    setError(null);
    try {
      await eliminarStockModulo(productoId, moduloId);
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-b-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#1e3a5f]" />
            <h2 className="text-lg font-bold text-[#111c2d]">Editar {codigo}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#74777f] hover:text-[#111c2d]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4"
          style={{ WebkitOverflowScrolling: "touch" }}>
          <div>
            <label className="text-xs font-medium text-[#111c2d] mb-1 block">Cantidad acumulada</label>
            <NumericInput
              value={cantidad}
              onChange={(v) => { const n = parseInt(v); if (n >= 0) setCantidad(n); }}
              className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
            <p className="text-[10px] text-[#94a3b8] mt-1">Unidades acumuladas en este módulo</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
          )}
        </div>

        <div className="p-4 border-t border-[#e2e8f0] space-y-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-[#1e3a5f] text-white font-bold rounded-lg hover:bg-[#162e50] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {userRole === "admin" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Eliminando..." : "Eliminar registro"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
