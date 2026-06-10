import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { neon } from "@neondatabase/serverless";
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const s = neon(process.env.DATABASE_URL!);
  const [sinBodegaRow] = await s`SELECT COUNT(*)::int as c FROM productos WHERE id NOT IN (SELECT producto_id FROM stock)`;
  const sinBodegaCount = Number(sinBodegaRow?.c ?? 0);

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
