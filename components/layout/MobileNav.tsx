"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { logout } from "@/app/actions/auth-actions"

const ITEMS = [
  { label: "Salidas", href: "/salidas", icon: ArrowUpRight },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-[#1e3a5f] border-t border-[#162e50] flex items-center justify-around md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 h-full px-4 text-[10px] font-medium transition-colors",
              isActive ? "text-white" : "text-white/60 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
      <form action={logout}>
        <button className="flex flex-col items-center justify-center gap-0.5 h-full px-4 text-[10px] font-medium text-white/60 hover:text-white transition-colors">
          <LogOut className="h-5 w-5" />
          Salir
        </button>
      </form>
    </nav>
  )
}
