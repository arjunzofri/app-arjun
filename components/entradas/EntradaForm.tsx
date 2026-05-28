"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { registrarEntrada, createOrUpdateProducto } from "@/lib/actions";
import { InputCantidad } from "@/components/mobile/InputCantidad";
import { BotonFoto } from "@/components/mobile/BotonFoto";
import { ProductoEditModal } from "@/components/shared/ProductoEditModal";
import { NumericInput } from "@/components/shared/NumericInput";
import { Pencil, Search, X } from "lucide-react";
import { useSession } from "next-auth/react";

type WinFacResult = {
  id?: string;
  codigo: string;
  descripcion: string;
  packing: number;
  knumezet: string | null;
  imagenUrl: string | null;
  fuente?: "app" | "winfac";
};

export default function EntradaForm({ bodegasData }: { bodegasData: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WinFacResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<WinFacResult | null>(null);
  const [bodegaId, setBodegaId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [descripcionManual, setDescripcionManual] = useState("");
  const [observacionesManual, setObservacionesManual] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [showObs, setShowObs] = useState(false);
  const [productoDbId, setProductoDbId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { data: session } = useSession();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Obtener DB id para habilitar BotonFoto y edición
  useEffect(() => {
    if (!selectedProducto) {
      setProductoDbId(null);
      return;
    }
    if (selectedProducto.id) {
      // Producto de la app: ya tiene id
      setProductoDbId(selectedProducto.id);
      return;
    }
    if (esDeWinFac) {
      // Producto WinFac: pre-crear en DB
      createOrUpdateProducto({
        codigo: selectedProducto.codigo,
        descripcion: selectedProducto.descripcion,
        packing: selectedProducto.packing,
        knumezet: selectedProducto.knumezet,
      }).then((p: any) => {
        if (p?.id) setProductoDbId(p.id);
      }).catch(() => setProductoDbId(null));
    } else {
      setProductoDbId(null);
    }
  }, [selectedProducto?.codigo, selectedProducto?.id]);

  // Fetch from WinFac API on 2+ chars
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (Array.isArray(data)) setResults(data.slice(0, 8));
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const packing = selectedProducto?.packing ?? 1;
  const esDeWinFac = selectedProducto?.knumezet != null;
  const fuente = selectedProducto?.fuente;

  const handleConfirmar = async () => {
    if (!bodegaId) {
      setError("Selecciona una bodega de destino");
      return;
    }

    // Resolver producto: selección WinFac, manual explícito, o implícito desde query
    let prod = selectedProducto;
    if (!prod) {
      if (query.trim().length >= 2) {
        prod = {
          codigo: query.trim(),
          descripcion: query.trim(),
          packing: 1,
          knumezet: null,
          imagenUrl: null,
        };
      } else {
        setError("Escribe un código o selecciona un producto de la lista");
        return;
      }
    }
    const esWinFac = prod.knumezet != null;

    if (!esWinFac && !descripcionManual.trim()) {
      setError("Ingresa una descripción para el producto nuevo");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let productoId: string;

      if (prod.id) {
        // Producto ya existe en la app
        productoId = prod.id;
      } else {
        const producto = await createOrUpdateProducto({
          codigo: prod.codigo,
          descripcion: esWinFac ? prod.descripcion : descripcionManual.trim(),
          packing: prod.packing,
          knumezet: prod.knumezet,
          observaciones: esWinFac ? undefined : (observacionesManual.trim() || undefined),
        });
        if (!producto?.id) throw new Error("No se pudo crear/actualizar el producto");
        productoId = producto.id;
      }

      await registrarEntrada({
        productoId,
        bodegaId,
        cantidad,
        precioUnitario: precioUnitario ? Number(precioUnitario) : undefined,
        origen: prod.fuente === 'app' ? 'manual' : (esWinFac ? "winfac" : "manual"),
        observaciones: observaciones.trim() || undefined,
      });

      setDescripcionManual("");
      setObservacionesManual("");
      setObservaciones("");

      setSuccess(true);
      setSelectedProducto(null);
      setQuery("");
      setBodegaId("");
      setCantidad(1);
      setPrecioUnitario("");
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error al registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== MÓVIL ===== */}
      <div className="md:hidden space-y-4">
        <div ref={searchRef} className="relative">
          {selectedProducto ? (
            <div className="flex items-center gap-3 p-3 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[#1e293b] truncate">{selectedProducto.codigo}</p>
                  {fuente && (
                    <span className={`text-[9px] font-bold px-1 rounded ${fuente === 'app' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {fuente === 'app' ? 'App' : 'WinFac'}
                    </span>
                  )}
                  {productoDbId && (
                    <button type="button" onClick={() => setEditOpen(true)} className="p-0.5 text-[#94a3b8] hover:text-[#1e3a5f] shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#64748b] truncate">{selectedProducto.descripcion}</p>
                <p className="text-[10px] text-[#94a3b8]">Packing: {packing} u/caja</p>
              </div>
              <button onClick={() => { setSelectedProducto(null); setQuery(""); }} className="text-[#64748b] hover:text-[#1e293b]">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="Buscar producto por código o descripción..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className="w-full h-12 pl-10 pr-4 text-base border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
            </div>
          )}

          {open && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {results.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#f1f5f9] transition-colors text-left border-b border-[#f1f5f9] last:border-0"
                  onPointerDown={(e) => { e.preventDefault(); setSelectedProducto(p); setQuery(""); setOpen(false); }}
                >
                  {p.imagenUrl ? (
                    <img src={p.imagenUrl} alt={p.codigo} className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#e2e8f0] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-[#1e293b]">{p.codigo}</p>
                      {p.fuente && (
                        <span className={`text-[9px] font-bold px-1 rounded ${p.fuente === 'app' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.fuente === 'app' ? 'App' : 'WinFac'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748b] truncate">{p.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {open && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg p-4 text-center text-sm text-[#94a3b8]">
              Sin resultados — se registrará como producto nuevo
            </div>
          )}
        </div>

        {productoDbId && selectedProducto && (
          <div className="flex justify-end">
            <BotonFoto productoId={productoDbId} />
          </div>
        )}

        {/* Registro libre: si escribe y no selecciona de la lista */}
        {!selectedProducto && query.trim().length >= 2 && results.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Al confirmar se creará un producto nuevo con código &quot;{query.trim()}&quot;
          </div>
        )}

        {!selectedProducto && query.trim().length >= 2 && (
          <button
            type="button"
            onClick={() => {
              setSelectedProducto({
                codigo: query.trim(),
                descripcion: query.trim(),
                packing: 1,
                knumezet: null,
                imagenUrl: null,
              });
              setQuery("");
              setOpen(false);
            }}
            className="w-full py-2 text-sm text-[#1e3a5f] border border-dashed border-[#1e3a5f]/30 rounded-lg hover:bg-[#f1f5f9] transition-colors"
          >
            Usar &quot;{query.trim()}&quot; como producto manual
          </button>
        )}

        {!esDeWinFac && (selectedProducto || query.trim().length >= 2) && (
          <div className="space-y-3 bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
            <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider">Datos del producto nuevo</p>
            <div>
              <p className="text-xs font-medium text-[#111c2d] mb-1">Descripción <span className="text-red-500">*</span></p>
              <textarea
                value={descripcionManual}
                onChange={(e) => setDescripcionManual(e.target.value)}
                placeholder="Describí el producto..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#111c2d] mb-1">Observaciones</p>
              <input
                type="text"
                value={observacionesManual}
                onChange={(e) => setObservacionesManual(e.target.value)}
                placeholder="Opcional..."
                className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-2 text-[#111c2d]">Bodega Destino</p>
          <div className="grid grid-cols-3 gap-3">
            {bodegasData.map((b: any) => {
              const isActive = bodegaId === b.id;
              const nombre = b.nombre.replace("Bodega ", "");
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBodegaId(b.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 py-4 px-3 rounded-xl border-2 font-bold transition-all text-sm ${
                    isActive
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                      : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
                  }`}
                >
                  {nombre}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2 text-[#111c2d]">Cantidad</p>
          <InputCantidad value={cantidad} onChange={setCantidad} packing={packing} max={9999} />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2 text-[#111c2d]">Precio Unitario (opcional)</p>
          <NumericInput
            value={precioUnitario}
            onChange={setPrecioUnitario}
            placeholder="0.00"
            className="w-full h-10 px-3 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>

        <div>
          {!showObs ? (
            <button type="button" onClick={() => setShowObs(true)} className="text-sm text-[#1e3a5f] font-medium hover:underline">
              + Agregar observación
            </button>
          ) : (
            <div className="space-y-1">
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones de la entrada..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
              />
              <button type="button" onClick={() => { setObservaciones(""); setShowObs(false); }} className="text-xs text-[#94a3b8] hover:text-[#74777f]">
                Quitar
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium">
            Entrada registrada con éxito
          </div>
        )}
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={loading}
          className="w-full h-14 text-lg font-bold bg-[#16a34a] text-white hover:bg-[#15803d] rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "PROCESANDO..." : "CONFIRMAR ENTRADA"}
        </button>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-8">
        <div className="space-y-4">
          <div ref={searchRef} className="relative">
            {selectedProducto ? (
              <div className="flex items-center gap-3 p-3 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#1e293b] truncate">{selectedProducto.codigo}</p>
                    {fuente && (
                      <span className={`text-[9px] font-bold px-1 rounded ${fuente === 'app' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {fuente === 'app' ? 'App' : 'WinFac'}
                      </span>
                    )}
                    {productoDbId && (
                      <button type="button" onClick={() => setEditOpen(true)} className="p-0.5 text-[#94a3b8] hover:text-[#1e3a5f] shrink-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#64748b] truncate">{selectedProducto.descripcion}</p>
                  <p className="text-[10px] text-[#94a3b8]">Packing: {packing} u/caja{esDeWinFac ? " · WinFac" : " · Manual"}</p>
                </div>
                <button onClick={() => { setSelectedProducto(null); setQuery(""); }} className="text-[#64748b] hover:text-[#1e293b]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                <input
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="Buscar producto por código o descripción (WinFac)..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                  onFocus={() => setOpen(true)}
                  className="w-full h-12 pl-10 pr-4 text-base border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
              </div>
            )}

            {open && results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {results.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#f1f5f9] transition-colors text-left border-b border-[#f1f5f9] last:border-0"
                    onPointerDown={(e) => { e.preventDefault(); setSelectedProducto(p); setQuery(""); setOpen(false); }}
                  >
                    {p.imagenUrl ? (
                      <img src={p.imagenUrl} alt={p.codigo} className="w-10 h-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#e2e8f0] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#1e293b]">{p.codigo}</p>
                      <p className="text-xs text-[#64748b] truncate">{p.descripcion}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {productoDbId && (
            <div className="flex justify-end">
              <BotonFoto productoId={productoDbId} />
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-2 text-[#111c2d]">Bodega Destino</p>
            <div className="grid grid-cols-3 gap-3">
              {bodegasData.map((b: any) => {
                const isActive = bodegaId === b.id;
                const nombre = b.nombre.replace("Bodega ", "");
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBodegaId(b.id)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-4 px-3 rounded-xl border-2 font-bold transition-all text-sm ${
                      isActive
                        ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                        : "border-[#c4c6cf] bg-white text-[#1e293b] hover:border-[#2563eb]"
                    }`}
                  >
                    {nombre}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-[#111c2d]">Cantidad</p>
            <InputCantidad value={cantidad} onChange={setCantidad} packing={packing} max={9999} />
          </div>

          <div>
            {!showObs ? (
              <button type="button" onClick={() => setShowObs(true)} className="text-sm text-[#1e3a5f] font-medium hover:underline">
                + Agregar observación
              </button>
            ) : (
              <div className="space-y-1">
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones de la entrada..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
                />
                <button type="button" onClick={() => { setObservaciones(""); setShowObs(false); }} className="text-xs text-[#94a3b8] hover:text-[#74777f]">
                  Quitar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {!esDeWinFac && (selectedProducto || query.trim().length >= 2) && (
            <div className="space-y-3 bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
              <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider">Datos del producto nuevo</p>
              <div>
                <p className="text-xs font-medium text-[#111c2d] mb-1">Descripción <span className="text-red-500">*</span></p>
                <textarea
                  value={descripcionManual}
                  onChange={(e) => setDescripcionManual(e.target.value)}
                  placeholder="Describí el producto..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 resize-none"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-[#111c2d] mb-1">Observaciones</p>
                <input
                  type="text"
                  value={observacionesManual}
                  onChange={(e) => setObservacionesManual(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full px-3 py-2 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-2 text-[#111c2d]">Precio Unitario (opcional)</p>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 text-sm border border-[#c4c6cf] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>

          {!selectedProducto && query.trim().length >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Al confirmar se creará un producto nuevo con código &quot;{query.trim()}&quot;
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium">
              Entrada registrada con éxito
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-[#16a34a] text-white hover:bg-[#15803d] rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "PROCESANDO..." : "CONFIRMAR ENTRADA"}
          </button>
        </div>
      </div>

      {productoDbId && selectedProducto && (
        <ProductoEditModal
          producto={{
            id: productoDbId,
            codigo: selectedProducto.codigo,
            descripcion: selectedProducto.descripcion,
            packing: selectedProducto.packing,
          }}
          userRole={session?.user?.role || "operador"}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
