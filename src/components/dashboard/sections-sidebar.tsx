"use client";

import { Activity, Boxes, CalendarClock, Phone, TriangleAlert } from "lucide-react";

const LINKS = [
  { href: "#supervision", label: "Supervision", icon: Activity },
  { href: "#calls", label: "Llamadas", icon: Phone },
  { href: "#critical", label: "Criticos", icon: TriangleAlert },
  { href: "#scheduled-orders", label: "Pedidos por hora", icon: CalendarClock },
  { href: "#state-board", label: "Tablero por estado", icon: Boxes },
];

export function SectionsSidebar() {
  return (
    <aside className="sticky top-4 h-fit rounded-3xl border border-black/10 bg-white p-3">
      <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#454745]">
        Secciones
      </p>
      <nav className="space-y-1">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-[#0e0f0c] hover:bg-[#e8ebe6]"
            >
              <Icon className="h-4 w-4 text-[#454745]" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
