import ProductoForm from "@/components/productos/ProductoForm";

export default function NuevoProductoPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Nuevo Producto</h1>
        <p className="text-slate-400">Registra un nuevo SKU en el sistema. Si el código ya existe, heredará la ubicación.</p>
      </div>
      
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
        <ProductoForm />
      </div>
    </div>
  );
}
