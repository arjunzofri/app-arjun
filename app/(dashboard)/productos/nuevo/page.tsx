import ProductoForm from "@/components/productos/ProductoForm";

export default function NuevoProductoPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#111c2d]">Nuevo Producto</h1>
        <p className="text-[#74777f]">Registra un nuevo SKU en el sistema. Si el código ya existe, heredará la ubicación.</p>
      </div>
      
      <div className="rounded-xl border border-[#c4c6cf] bg-white p-8 shadow-sm">
        <ProductoForm />
      </div>
    </div>
  );
}
