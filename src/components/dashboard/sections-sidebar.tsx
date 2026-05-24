"use client";

import { useEffect, useState } from "react";
import { Activity, Boxes, CalendarClock, FileText, Package, Phone, ShieldPlus, TriangleAlert, X } from "lucide-react";

const SECTIONS = [
  {
    label: "Supervisión",
    items: [
      { href: "#supervision", label: "Vista general", icon: Activity },
      { href: "#calls", label: "Llamadas", icon: Phone },
      { href: "#critical", label: "Críticos", icon: TriangleAlert },
    ],
  },
  {
    label: "Alistamiento",
    items: [
      { href: "#scheduled-orders", label: "Pedidos por hora", icon: CalendarClock },
      { href: "#state-board", label: "Tablero por estado", icon: Boxes },
    ],
  },
  {
    label: "Contexto",
    items: [
      { href: "#pending", label: "Fórmulas", icon: FileText },
      { href: "#stock", label: "Stock", icon: Package },
    ],
  },
];

export function SectionsSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-60 flex-col border-r border-[#dedee5] bg-white transition-transform duration-200 lg:static lg:translate-x-0 lg:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-[#dedee5] px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7132f5]">
              <ShieldPlus className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-[#101114]">MediAgent</p>
              <p className="text-[10px] text-[#9497a9]">Dispensario</p>
            </div>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1 text-[#9497a9] hover:bg-[#f5f5f7] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#9497a9]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-[#686b82] transition-colors hover:bg-[rgba(133,91,251,0.08)] hover:text-[#7132f5]"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#dedee5] px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-[rgba(20,158,97,0.10)] px-3 py-2.5">
            <span className="h-2 w-2 rounded-full bg-[#149e61]" />
            <div>
              <p className="text-xs font-semibold text-[#101114]">Demo en vivo</p>
              <p className="text-[10px] text-[#9497a9]">Sistema operativo</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
