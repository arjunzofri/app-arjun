"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, ShieldCheck, AlertTriangle } from "lucide-react";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  async function runSetup() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/setup", {
        headers: {
          "x-setup-key": "arjun-setup-2025" // In production this would be handled differently, but for this setup it matches env
        }
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: "Error de red o del servidor" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#c4c6cf] text-[#111c2d]">
        <CardHeader className="text-center">
          <div className="mx-auto bg-[#dbe1ff] p-3 rounded-full w-fit mb-4">
            <Database className="h-8 w-8 text-[#0051d5]" />
          </div>
          <CardTitle className="text-2xl font-bold">Base de Datos Setup</CardTitle>
          <CardDescription className="text-[#74777f]">
            Crea automáticamente las tablas del sistema Inventario Arjun y precarga datos base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-[#f9f9ff]/50 border border-[#c4c6cf] rounded-lg p-4 text-xs space-y-2">
            <p className="flex items-center gap-2 text-[#43474e]">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Crea schema relacional (PostgreSQL)
            </p>
            <p className="flex items-center gap-2 text-[#43474e]">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Configura Enums (Rol, Proveedor, Origen)
            </p>
            <p className="flex items-center gap-2 text-[#43474e]">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Inserta Admin: admin@arjun.cl / arjun2025
            </p>
            <p className="flex items-center gap-2 text-[#43474e]">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Precarga Bodegas y Módulos Zofri
            </p>
          </div>

          {!result && (
            <Button 
                onClick={runSetup} 
                disabled={loading}
                className="w-full bg-[#16a34a] text-white hover:bg-[#15803d] font-bold h-12"
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "INICIAR CONFIGURACIÓN"}
            </Button>
          )}

          {result?.success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <p className="text-emerald-500 font-bold mb-2">¡Estructura Creada!</p>
              <p className="text-xs text-[#74777f]">{result.message}</p>
              <Button 
                className="mt-4 w-full bg-[#f1f5f9] text-[#1e293b] font-bold hover:bg-[#e2e8f0]"
                onClick={() => window.location.href = "/"}
              >
                IR AL LOGIN
              </Button>
            </div>
          )}

          {result?.success === false && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-500 font-bold mb-1">
                <AlertTriangle className="h-4 w-4" />
                Error en Setup
              </div>
              <p className="text-xs text-[#74777f]">{result.error}</p>
              <Button 
                className="mt-4 w-full variant-outline border-[#c4c6cf]"
                onClick={runSetup}
              >
                REINTENTAR
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
