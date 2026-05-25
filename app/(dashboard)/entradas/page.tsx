import { db } from "@/db";
import EntradasShell from "@/components/entradas/EntradasShell";

export default async function EntradasPage() {
  const allBodegas = await db.query.bodegas.findMany();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#111c2d]">Ingreso de Mercadería (Entradas)</h1>
        <p className="text-[#74777f]">Registra compras y recepciones de productos.</p>
      </div>

      <EntradasShell bodegas={allBodegas} />
    </div>
  );
}
