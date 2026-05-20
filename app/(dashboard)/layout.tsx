import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { db } from "@/db"
import { entradas } from "@/db/schema"
import { isNull } from "drizzle-orm"

export const revalidate = 30

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
      <div className="hidden md:block">
        <Sidebar
          userRole={session?.user?.role || "operador"}
          userName={session?.user?.name || "Usuario"}
          sinBodega={sinBodegaCount}
        />
      </div>
      <DashboardShell>
        <Header userName={session?.user?.name || "Usuario"} />
        <main className="p-4 md:p-8 pb-20 md:pb-8"><SessionProvider>{children}</SessionProvider></main>
      </DashboardShell>
      <MobileNav />
    </div>
  );
}
