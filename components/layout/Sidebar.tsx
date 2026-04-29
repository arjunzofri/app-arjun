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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#162e50] bg-[#1e3a5f] flex flex-col font-sans">
      <div className="p-6 border-b border-[#162e50]">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-[#adc8f5]">ARJUN</span>
          <span className="text-[#5e7397] font-normal">v1.0</span>
        </h1>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group, idx) => {
          if (group.adminOnly && userRole !== "admin") return null;

          return (
            <div key={idx} className="mb-6">
              <div className="px-6 mb-2 text-[10px] uppercase tracking-widest text-[#5e7397] font-semibold">
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
                          ? "bg-white/10 text-white border-r-2 border-[#adc8f5]"
                          : "text-[#8aa4cf] hover:bg-[#172a45] hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-[#adc8f5]" : "text-[#8aa4cf] group-hover:text-white")} />
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

      <div className="p-4 border-t border-[#162e50]">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 mb-3 border border-white/10">
          <div className="w-8 h-8 rounded bg-[#2563eb] flex items-center justify-center text-white font-bold text-xs">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate text-white">{userName}</p>
            <p className="text-[10px] text-[#8aa4cf] uppercase tracking-tighter">{userRole}</p>
          </div>
        </div>

        <form action={logout}>
          <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#8aa4cf] hover:text-white hover:bg-white/10 rounded-md transition-colors">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
