"use client";

import Link from "next/link";
import { Warehouse } from "lucide-react";

interface BodegaCardProps {
  id: string;
  nombre: string;
  productos: number;
  unidades: number;
}

export function BodegaCard({ id, nombre, productos, unidades }: BodegaCardProps) {
  return (
    <Link href={`/bodegas/${id}`}>
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all cursor-pointer group">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#dbe1ff] rounded-lg border border-[#0051d5]/10">
            <Warehouse className="h-6 w-6 text-[#1e3a5f]" />
          </div>
          <h2 className="text-lg font-bold text-[#111c2d] group-hover:text-[#1e3a5f] transition-colors">
            {nombre}
          </h2>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-[#111c2d]">
              {unidades.toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-[#74777f]">unidades</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#111c2d]">{productos}</p>
            <p className="text-xs text-[#74777f]">productos distintos</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
