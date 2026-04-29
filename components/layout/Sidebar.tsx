"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth-actions"
import { 
  Box, 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  LogOut
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Inventario",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Productos", href: "/productos", icon: Package },
    ]
  },
  {
    title: "Operaciones",
    items: [
      { label: "Entradas", href: "/entradas", icon: ArrowDownLeft },
      { label: "Salidas", href: "/salidas", icon: ArrowUpRight },
    ]
  },
  {
    title: "Administración",
    adminOnly: true,
    items: [
      { label: "Usuarios", href: "/usuarios", icon: Users },
    ]
  }
];

export function Sidebar({ userRole, userName, sinBodega = 0 }: { userRole: string, userName: string, sinBodega?: number }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-900 flex flex-col font-sans">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-amber-500">ARJUN</span>
          <span className="text-slate-400 font-normal">v1.0</span>
        </h1>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group, idx) => {
          if (group.adminOnly && userRole !== "admin") return null;
          
          return (
            <div key={idx} className="mb-6">
              <div className="px-6 mb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all group relative",
                        isActive
                          ? "bg-amber-500/10 text-amber-500 border-r-2 border-amber-500"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-amber-500" : "text-slate-400 group-hover:text-slate-200")} />
                      {item.label}
                      {item.href === "/productos" && sinBodega > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {sinBodega}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 mb-3 border border-slate-700/30">
          <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate text-slate-100">{userName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{userRole}</p>
          </div>
        </div>
        
        <form action={logout}>
          <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
