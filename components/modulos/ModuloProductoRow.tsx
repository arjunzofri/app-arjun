"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { StockModuloEditModal } from "./StockModuloEditModal";

export function ModuloProductoRow({
  producto,
  moduloId,
  imagenUrl,
  userRole,
}: {
  producto: {
    id: string;
    codigo: string;
    descripcion: string;
    packing: number;
    cantidadAcumulada: number;
  };
  moduloId: string;
  imagenUrl: string | null;
  userRole: string;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 flex items-center gap-4 hover:shadow-sm hover:border-[#e2e8f0] transition-all">
        <Link
          href={`/productos/${producto.id}`}
          className="flex items-center gap-4 flex-1 min-w-0"
        >
          {imagenUrl ? (
            <img
              src={imagenUrl}
              alt={producto.codigo}
              className="w-12 h-12 rounded object-cover bg-[#f1f5f9] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-[#e2e8f0] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono font-bold text-[#1e3a5f] truncate">
              {producto.codigo}
            </p>
            <p className="text-xs text-[#74777f] truncate">{producto.descripcion}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#111c2d]">
              {producto.cantidadAcumulada.toLocaleString("es-CL")}
            </p>
            <p className="text-[10px] text-[#94a3b8]">u · caja x{producto.packing}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="p-1 text-[#94a3b8] hover:text-[#1e3a5f] shrink-0"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <StockModuloEditModal
        productoId={producto.id}
        moduloId={moduloId}
        codigo={producto.codigo}
        cantidadAcumulada={producto.cantidadAcumulada}
        userRole={userRole}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
