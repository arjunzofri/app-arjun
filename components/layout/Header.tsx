"use client";

import { User } from "lucide-react";

export function Header({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#c4c6cf] bg-[#f9f9ff]/50 px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-medium text-[#74777f] uppercase tracking-widest">Panel de Control General</h2>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">SINC: OK</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-[10px] text-[#74777f] font-mono">IQUIQUE, CHILE</p>
          <p className="text-xs font-mono text-[#43474e]">
            {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </p>
        </div>
      </div>
    </header>
  );
}
