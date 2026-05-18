"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import EntradaManualForm from "./EntradaManualForm";
import WinFacPanel from "./WinFacPanel";
import { syncWinfac } from "@/app/actions/sync-winfac";
import { Button } from "@/components/ui/button";

export default function EntradasShell({
  bodegas,
  productos,
}: {
  bodegas: any[];
  productos: any[];
}) {
  const [modo, setModo] = useState<"winfac" | "manual">("winfac");
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; message: string; ok: boolean } | null>(null);
  const { data: session } = useSession();

  const handleSync = async () => {
    setSyncStatus({ loading: true, message: "Sincronizando...", ok: false });
    const result = await syncWinfac();
    if (result.error) {
      setSyncStatus({ loading: false, message: `❌ ${result.error}`, ok: false });
    } else {
      setSyncStatus({ loading: false, message: `✅ ${result.productos_creados} productos importados`, ok: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-lg w-fit mb-6">
        {[
          { id: "winfac" as const, label: "WinFac", icon: FileText },
          { id: "manual" as const, label: "Manual" },
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

      {modo === "winfac" && (
        <>
          {session?.user?.role === 'admin' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSync}
                disabled={syncStatus?.loading}
                className="bg-[#2563eb] text-white font-bold hover:bg-[#1d4ed8]"
              >
                {syncStatus?.loading ? "Sincronizando..." : "SYNC AUTOMÁTICO CON WINFAC"}
              </Button>
              {syncStatus && !syncStatus.loading && (
                <span className={`text-sm font-medium ${syncStatus.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {syncStatus.message}
                </span>
              )}
            </div>
          )}
          <WinFacPanel bodegasData={bodegas} />
        </>
      )}
      {modo === "manual" && (
        <EntradaManualForm productos={productos} bodegas={bodegas} />
      )}
    </div>
  );
}
