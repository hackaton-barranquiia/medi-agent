"use client";

import { Menu } from "lucide-react";

export function Header() {
  const toggleSidebar = () =>
    window.dispatchEvent(new Event("toggle-sidebar"));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dedee5] bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-[#686b82] hover:bg-[#f5f5f7] lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#101114]">Panel del dispensario</p>
          <p className="hidden text-xs text-[#9497a9] sm:block">Operación en tiempo real</p>
        </div>
      </div>
      <span className="rounded-xl border border-[#dedee5] bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-[#686b82]">
        Centro de operación
      </span>
    </header>
  );
}
