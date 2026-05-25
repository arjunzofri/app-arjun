"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Trash2 } from "lucide-react";
import { editarProducto, eliminarProducto } from "@/lib/actions";

export function ProductoEditModal({
  producto,
  userRole,
  open,
  onClose,
}: {
  producto: { id: string; codigo: string; codigoPersonal?: string | null; descripcion: string; packing: number; observaciones?: string | null };
  userRole: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [codigoPersonal, setCodigoPersonal] = useState(producto.codigoPersonal || "");
  const [descripcion, setDescripcion] = useState(producto.descripcion || "");
  const [packing, setPacking] = useState(producto.packing);
  const [observaciones, setObservaciones] = useState(producto.observaciones || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await editarProducto(producto.id, {
        codigoPersonal: codigoPersonal.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        packing: packing > 0 ? packing : undefined,
        observaciones: observaciones.trim() || undefined,
      });
      setSuccess("Producto actualizado");
      router.refresh();
      setTimeout(() => { setSuccess(null); onClose(); }, 1000);
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este producto permanentemente?")) return;
    setDeleting(true);
    setError(null);
    try {
      const result: any = await eliminarProducto(producto.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#1e3a5f]" />
            <h2 className="text-lg font-bold text-[#111c2d]">Editar {producto.codigo}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#74777f] hover:text-[#111c2d]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-[#111c2d] mb-1 block">Código personal (alias)</label>
            <input
              type="text"
              value={codigoPersonal}
              onChange={(e) => setCodigoPersonal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#111c2d] mb-1 block">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#111c2d] mb-1 block">Packing (u/caja)</label>
            <input
              type="number"
              min={1}
              value={packing}
              onChange={(e) => { const n = parseInt(e.target.value); if (n > 0) setPacking(n); }}
              className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#111c2d] mb-1 block">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
          )}
        </div>

        <div className="p-4 border-t border-[#e2e8f0] space-y-2">
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
              {deleting ? "Eliminando..." : "Eliminar producto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
