"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Clock } from "lucide-react";
import SalidaForm from "./SalidaForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";

export default function SalidasShell({
  productosData,
  bodegasData,
  modulosData,
  history,
}: {
  productosData: any[];
  bodegasData: any[];
  modulosData: any[];
  history: any[];
}) {
  const [tab, setTab] = useState<"nuevo" | "historial">("nuevo");

  return (
    <div className="space-y-8">
      {/* ===== MÓVIL ===== */}
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

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-[#111c2d]">Despachos (Salidas)</h1>
        <p className="text-[#74777f]">Registra el movimiento de mercadería desde bodegas hacia módulos del Mall Zofri.</p>

        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-lg w-fit mt-6 mb-6">
          <button
            onClick={() => setTab("nuevo")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === "nuevo"
                ? "bg-white text-[#111c2d] shadow-sm"
                : "text-[#64748b] hover:text-[#111c2d]"
            )}
          >
            <Plus className="h-4 w-4" />
            Nuevo Despacho
          </button>
          <button
            onClick={() => setTab("historial")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === "historial"
                ? "bg-white text-[#111c2d] shadow-sm"
                : "text-[#64748b] hover:text-[#111c2d]"
            )}
          >
            <Clock className="h-4 w-4" />
            Historial ({history.length})
          </button>
        </div>

        {tab === "nuevo" && (
          <SalidaForm
            productosData={productosData}
            bodegasData={bodegasData}
            modulosData={modulosData}
          />
        )}

        {tab === "historial" && (
          <Card className="bg-white border-[#c4c6cf]">
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#c4c6cf]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#c4c6cf]">
                      <TableHead className="font-mono text-xs uppercase">Fecha/Hora</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Producto</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Origen</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Destino</TableHead>
                      <TableHead className="font-mono text-xs uppercase text-center">Cant.</TableHead>
                      <TableHead className="font-mono text-xs uppercase">Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id} className="border-[#c4c6cf]">
                        <TableCell className="text-[10px] font-mono text-[#74777f]">
                          {new Date(h.timestampSalida).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              src={getCloudinaryVidaDigitalUrl(h.producto.descripcion) ?? ""}
                              alt={h.producto.codigo}
                              className="w-10 h-10 rounded object-contain bg-[#f1f5f9] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-sm">{h.producto.codigo}</p>
                              <p className="text-[10px] text-[#74777f] truncate max-w-[140px]">{h.producto.descripcion}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-[#74777f]">{h.bodega.nombre.replace("Bodega ", "")}</TableCell>
                        <TableCell className="text-xs text-[#0051d5] font-bold">{h.modulo.nombre}</TableCell>
                        <TableCell className="text-center font-bold text-[#111c2d]">{h.cantidad}</TableCell>
                        <TableCell className="text-xs text-[#74777f]">{h.usuario?.nombre ?? "Sin usuario"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
