"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

type Movimiento = {
  tipo: "entrada" | "salida";
  id: string;
  fecha: string;
  cantidad: number;
  bodega: string;
  modulo: string | null;
  usuario: string;
};

export function HistorialModal({
  productoId,
  codigo,
  open,
  onClose,
}: {
  productoId: string;
  codigo: string;
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!open || !productoId) return;
    setLoading(true);
    setItems([]);
    setCursor(null);
    fetch(`/api/productos/${productoId}/historial`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setCursor(data.nextCursor || null);
        setHasMore(!!data.nextCursor);
      })
      .finally(() => setLoading(false));
  }, [open, productoId]);

  const cargarMas = async () => {
    if (!cursor) return;
    setLoading(true);
    const res = await fetch(
      `/api/productos/${productoId}/historial?cursor=${encodeURIComponent(cursor)}`
    );
    const data = await res.json();
    setItems((prev) => [...prev, ...(data.items || [])]);
    setCursor(data.nextCursor || null);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <div>
            <h2 className="text-lg font-bold text-[#111c2d]">Historial</h2>
            <p className="text-xs text-[#74777f] font-mono">{codigo}</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#74777f] hover:text-[#111c2d]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && !loading && (
            <p className="text-center text-[#74777f] py-8 text-sm">
              Sin movimientos registrados
            </p>
          )}

          {items.map((m) => (
            <div
              key={`${m.tipo}-${m.id}`}
              className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]"
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  m.tipo === "entrada" ? "bg-green-500" : "bg-blue-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-[#1e3a5f]">
                    {m.tipo}
                  </span>
                  <span className="text-xs text-[#94a3b8]">
                    {new Date(m.fecha).toLocaleString("es-CL")}
                  </span>
                </div>
                <p className="text-xs text-[#74777f] truncate">
                  {m.tipo === "entrada"
                    ? `→ ${m.bodega}`
                    : `${m.bodega} → ${m.modulo}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#111c2d]">{m.cantidad} u</p>
                <p className="text-[10px] text-[#94a3b8]">{m.usuario}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[#1e3a5f]" />
            </div>
          )}
        </div>

        {hasMore && !loading && (
          <div className="p-4 border-t border-[#e2e8f0] text-center">
            <button
              onClick={cargarMas}
              className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
