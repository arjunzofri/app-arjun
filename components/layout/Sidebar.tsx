"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth-actions"
import {
  Warehouse,
  Store,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Inventario",
    items: [
      { label: "Bodegas", href: "/bodegas", icon: Warehouse },
    ]
  },
  {
    title: "Operaciones",
    items: [
      { label: "Entradas", href: "/entradas", icon: ArrowDownLeft },
      { label: "Salidas", href: "/salidas", icon: ArrowUpRight },
      { label: "Módulos", href: "/modulos", icon: Store },
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
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    setCollapsed(stored !== "false");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: next }));
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r border-[#162e50] bg-[#1e3a5f] flex flex-col font-sans transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn("border-b border-[#162e50] flex items-center", collapsed ? "p-4 justify-center" : "p-6 justify-between")}>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-[#adc8f5]">{collapsed ? "A" : "ARJUN"}</span>
          {!collapsed && <span className="text-[#5e7397] font-normal">v1.0</span>}
        </h1>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group, idx) => {
          if (group.adminOnly && userRole !== "admin") return null;

          return (
            <div key={idx} className="mb-6">
              {!collapsed && (
                <div className="px-6 mb-2 text-[10px] uppercase tracking-widest text-[#5e7397] font-semibold">
                  {group.title}
                </div>
              )}
              <div className={cn("space-y-1", collapsed && "px-2")}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 py-3 text-sm font-medium transition-all group relative",
                        collapsed ? "px-0 justify-center rounded-lg" : "px-6",
                        isActive
                          ? "bg-white/10 text-white border-r-2 border-[#adc8f5]"
                          : "text-[#8aa4cf] hover:bg-[#172a45] hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#adc8f5]" : "text-[#8aa4cf] group-hover:text-white")} />
                      {!collapsed && item.label}
                      {!collapsed && item.href === "/bodegas" && sinBodega > 0 && (
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

      <div className={cn("border-t border-[#162e50]", collapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center gap-3 rounded-lg bg-white/10 mb-3 border border-white/10", collapsed ? "p-2 justify-center" : "p-3")}>
          <div className="w-8 h-8 rounded bg-[#2563eb] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate text-white">{userName}</p>
              <p className="text-[10px] text-[#8aa4cf] uppercase tracking-tighter">{userRole}</p>
            </div>
          )}
        </div>

        <form action={logout}>
          <button type="submit" className={cn(
            "w-full flex items-center gap-2 py-2 text-sm text-[#8aa4cf] hover:text-white hover:bg-white/10 rounded-md transition-colors",
            collapsed ? "justify-center px-0" : "px-3"
          )}>
            <LogOut className="h-4 w-4" />
            {!collapsed && "Cerrar Sesión"}
          </button>
        </form>
      </div>

      <button
        onClick={toggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 rounded-r-md bg-[#1e3a5f] border border-l-0 border-[#162e50] flex items-center justify-center text-[#8aa4cf] hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
