"use client";

import Link from "next/link";
import { Store } from "lucide-react";

interface ModuloCardProps {
  id: string;
  nombre: string;
  productos: number;
  unidades: number;
}

export function ModuloCard({ id, nombre, productos, unidades }: ModuloCardProps) {
  return (
    <Link href={`/modulos/${id}`}>
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all cursor-pointer group text-center">
        <div className="flex justify-center mb-3">
          <div className="p-2 bg-[#dbe1ff] rounded-lg border border-[#0051d5]/10">
            <Store className="h-6 w-6 text-[#1e3a5f]" />
          </div>
        </div>
        <h2 className="text-sm font-mono font-bold text-[#1e3a5f] group-hover:text-[#111c2d] transition-colors">
          {nombre}
        </h2>
        <div className="mt-3 space-y-1">
          <p className="text-2xl font-bold text-[#111c2d]">
            {unidades.toLocaleString("es-CL")}
          </p>
          <p className="text-xs text-[#74777f]">unidades acumuladas</p>
        </div>
        <p className="text-xs text-[#94a3b8] mt-2">{productos} productos</p>
      </div>
    </Link>
  );
}
