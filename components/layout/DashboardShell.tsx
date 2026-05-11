"use client";

import { useState, useEffect } from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    setCollapsed(stored !== "false");

    const handler = (e: Event) => {
      setCollapsed((e as CustomEvent).detail);
    };
    window.addEventListener("sidebar-toggle", handler);
    return () => window.removeEventListener("sidebar-toggle", handler);
  }, []);

  return (
    <div className={collapsed ? "pl-16" : "pl-64"}>
      {children}
    </div>
  );
}
