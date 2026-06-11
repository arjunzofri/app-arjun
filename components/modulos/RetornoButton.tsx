"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import RetornoModal from "./RetornoModal";

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
  disabled?: boolean;
};

export default function RetornoButton({
  moduloId,
  productos,
  bodegas,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || productos.length === 0}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#162e50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Undo2 className="h-4 w-4" />
        Retornar mercadería
      </button>

      <RetornoModal
        key={open ? "retorno-open" : "retorno-closed"}
        moduloId={moduloId}
        productos={productos}
        bodegas={bodegas}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
