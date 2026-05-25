"use client";

import EntradaForm from "./EntradaForm";

export default function EntradasShell({ bodegas }: { bodegas: any[] }) {
  return (
    <div className="space-y-8">
      <EntradaForm bodegasData={bodegas} />
    </div>
  );
}
