"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

type Movimiento = {
  tipo: "entrada" | "salida" | "traslado" | "retorno";
  id: string;
  fecha: string;
  cantidad: number;
  bodega: string | null;
  modulo: string | null;
  destino: string | null;
  usuario: string;
};

export default function ProductoMovimientos({
  productoId,
}: {
  productoId: string;
}) {
  const [items, setItems] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!productoId) return;
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
  }, [productoId]);

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

  return (
    <div className="bg-white border border-[#c4c6cf] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#c4c6cf] bg-[#f0f3ff]">
        <h3 className="font-bold">Historial de Movimientos</h3>
        <p className="text-xs text-[#74777f] mt-0.5">
          Entradas y salidas registradas
        </p>
      </div>

      <div className="divide-y divide-[#e2e8f0]">
        {items.length === 0 && !loading && (
          <p className="p-8 text-center text-[#74777f] text-sm">
            Sin movimientos registrados
          </p>
        )}

        {items.map((m) => (
          <div
            key={`${m.tipo}-${m.id}`}
            className="flex items-center gap-3 p-4"
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                m.tipo === "entrada"
                  ? "bg-green-500"
                  : m.tipo === "salida"
                    ? "bg-blue-500"
                    : m.tipo === "traslado"
                      ? "bg-amber-500"
                      : "bg-purple-500"
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
                {m.tipo === "entrada" && `→ ${m.bodega}`}
                {m.tipo === "salida" && `${m.bodega} → ${m.modulo}`}
                {m.tipo === "traslado" && `${m.bodega} → ${m.destino}`}
                {m.tipo === "retorno" && `${m.modulo} → ${m.destino}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#111c2d]">
                {m.cantidad} u
              </p>
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
            className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162e50] transition-colors"
          >
            Cargar más
          </button>
        </div>
      )}
    </div>
  );
}
