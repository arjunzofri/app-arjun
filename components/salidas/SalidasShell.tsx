"use client";

import SalidaForm from "./SalidaForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalidasShell({
  productosData,
  bodegasData,
  modulosData,
}: {
  productosData: any[];
  bodegasData: any[];
  modulosData: any[];
}) {
  return (
    <div className="space-y-8">
      <div className="md:hidden">
        <Card className="bg-white border-[#c4c6cf]">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Buscar producto</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <SalidaForm
              productosData={productosData}
              bodegasData={bodegasData}
              modulosData={modulosData}
            />
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-[#111c2d]">Despachos (Salidas)</h1>
        <p className="text-[#74777f]">Registra el movimiento de mercadería desde bodegas hacia módulos del Mall Zofri.</p>

        <div className="mt-6">
          <SalidaForm
            productosData={productosData}
            bodegasData={bodegasData}
            modulosData={modulosData}
          />
        </div>
      </div>
    </div>
  );
}
