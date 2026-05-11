"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, Cpu } from "lucide-react";
import EntradaManualForm from "./EntradaManualForm";
import WinFacPanel from "./WinFacPanel";
import KingnexOCRPanel from "./KingnexOCRPanel";

export default function EntradasShell({
  bodegas,
  productos,
}: {
  bodegas: any[];
  productos: any[];
}) {
  const [modo, setModo] = useState<"manual" | "winfac" | "kingnex">("manual");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-lg w-fit mb-6">
        {[
          { id: "manual" as const, label: "Manual" },
          { id: "winfac" as const, label: "WinFac", icon: FileText },
          { id: "kingnex" as const, label: "Kingnex (OCR IA)", icon: Cpu },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setModo(opt.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              modo === opt.id
                ? "bg-white text-[#111c2d] shadow-sm"
                : "text-[#64748b] hover:text-[#111c2d]"
            )}
          >
            {opt.icon && <opt.icon className="h-4 w-4" />}
            {opt.label}
          </button>
        ))}
      </div>

      {modo === "manual" && (
        <EntradaManualForm productos={productos} bodegas={bodegas} />
      )}
      {modo === "winfac" && <WinFacPanel bodegasData={bodegas} />}
      {modo === "kingnex" && (
        <KingnexOCRPanel bodegasData={bodegas} productosData={productos} />
      )}
    </div>
  );
}
