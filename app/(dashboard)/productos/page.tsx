"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductImage from "@/components/productos/ProductImage";
import { getCloudinaryVidaDigitalUrl } from "@/lib/utils/extract-modelo";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";
import { buscarProductos } from "@/lib/actions";

export default function ProductListPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await buscarProductos(q.trim());
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111c2d]">Inventario</h1>
          <p className="text-[#74777f]">Buscar productos por código, descripción o stock.</p>
        </div>
        <Link href="/productos/nuevo">
          <Button className="bg-[#16a34a] font-bold text-white hover:bg-[#15803d]">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#74777f]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, descripción o código personal..."
            className="border-[#c4c6cf] bg-white pl-10 focus:ring-[#0051d5]"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
        </div>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-center text-[#74777f] py-12">No se encontraron productos</p>
      )}

      {!loading && results.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {results.map((p: any) => (
          <Link key={p.id} href={`/productos/${p.id}`}>
            <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="border-b border-[#e2e8f0]">
                <ProductImage
                  src={getCloudinaryVidaDigitalUrl(p.descripcion) ?? ""}
                  alt={p.descripcion || p.codigo}
                />
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-sm font-bold text-[#0051d5]">{p.codigo}</span>
                  {p.knumezet && (
                    <span className="font-mono text-[10px] text-[#94a3b8]">{p.knumezet}</span>
                  )}
                </div>

                {p.codigoPersonal && (
                  <p className="text-xs text-[#74777f] font-mono">{p.codigoPersonal}</p>
                )}

                <p className="text-xs text-[#43474e] line-clamp-2 leading-tight">{p.descripcion}</p>

                <div className="flex items-center justify-between pt-1 border-t border-[#f0f3ff]">
                  <span className="text-[10px] text-[#74777f]">Pack: {p.packing}</span>
                  <span className={`text-sm font-bold ${
                    p.totalStock > 20 ? "text-green-600" :
                    p.totalStock > 0 ? "text-[#0051d5]" :
                    "text-red-500"
                  }`}>
                    {p.totalStock} u.
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#74777f] bg-[#f0f3ff] rounded px-2 py-1 text-center">
                  {p.ubicacion || "SIN ASIGNAR"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
