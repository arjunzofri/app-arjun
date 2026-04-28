import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar 
        userRole={session?.user?.role || "operador"} 
        userName={session?.user?.name || "Usuario"} 
      />
      <div className="pl-64">
        <Header userName={session?.user?.name || "Usuario"} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
