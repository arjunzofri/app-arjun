import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { db } from "@/db"
import { entradas } from "@/db/schema"
import { isNull } from "drizzle-orm"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const sinBodegaResult = await db
    .selectDistinct({ productoId: entradas.productoId })
    .from(entradas)
    .where(isNull(entradas.bodegaId))
  const sinBodegaCount = sinBodegaResult.length

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <Sidebar 
        userRole={session?.user?.role || "operador"} 
        userName={session?.user?.name || "Usuario"} 
        sinBodega={sinBodegaCount}
      />
      <div className="pl-64">
        <Header userName={session?.user?.name || "Usuario"} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
