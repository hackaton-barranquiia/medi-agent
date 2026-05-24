"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  ClipboardPlus,
  LayoutGrid,
  PhoneOutgoing,
  X,
} from "lucide-react";

const NAV = [
  {
    href: "/dashboard",
    code: "01",
    label: "Tablero",
    sub: "Indicadores del día",
    icon: LayoutGrid,
  },
  {
    href: "/llamadas",
    code: "02",
    label: "Llamadas",
    sub: "Disparar y monitorear",
    icon: PhoneOutgoing,
  },
  {
    href: "/agenda",
    code: "03",
    label: "Agenda",
    sub: "Pedidos del día",
    icon: CalendarRange,
  },
  {
    href: "/orden-medica",
    code: "04",
    label: "Orden médica",
    sub: "Buscar y llamar cliente",
    icon: ClipboardPlus,
  },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1f221c]/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--color-hairline)] bg-white text-[#1f221c] transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:transition-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Wordmark */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <Link
            href="/dashboard"
            className="flex items-baseline gap-1 group"
            onClick={onClose}
          >
            <span className="font-display text-[24px] leading-none tracking-[-0.04em] text-[#1f221c]">
              medi
            </span>
            <span className="font-display text-[24px] leading-none tracking-[-0.04em] text-[#1f221c]">
              agent
            </span>
            <span className="ml-1 inline-block h-1.5 w-1.5 translate-y-[-2px] bg-[#9fe870]" />
          </Link>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-[var(--color-mute)] transition hover:text-[#1f221c] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-6 mb-6 border-t border-[var(--color-hairline)] pt-4">
          <p className="eyebrow text-[10px]">Centro de operación</p>
          <p className="mt-1 font-display text-[15px] leading-tight text-[#1f221c]">
            Dispensario Barranquilla
          </p>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group relative flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-[#f4f5f1] text-[#1f221c]"
                    : "text-[#4d5048] hover:bg-[#f4f5f1] hover:text-[#1f221c]"
                }`}
              >
                <span
                  className={`absolute inset-y-1 left-0 w-[3px] transition-all ${
                    active
                      ? "bg-[#9fe870]"
                      : "bg-transparent group-hover:bg-[#cdffad]"
                  }`}
                />
                <span
                  className={`flex h-8 w-8 items-center justify-center border transition-colors ${
                    active
                      ? "border-[#1f221c] bg-white"
                      : "border-[var(--color-hairline)] bg-white group-hover:border-[#1f221c]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold tracking-tight">
                    {item.label}
                  </p>
                  <p className="truncate text-[11px] text-[var(--color-mute)]">
                    {item.sub}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-mute)]">
                  {item.code}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pb-6">
          <div className="border border-[var(--color-hairline)] bg-[#f4f5f1] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="live-dot" aria-hidden />
              <p className="text-[12px] font-semibold text-[#1f221c]">
                Sistema operativo
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-[var(--color-mute)]">
              Webhook Vapi conectado · Supabase Realtime
            </p>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-mute)]">
            v0.1 · barranqui-ia
          </p>
        </div>
      </aside>
    </>
  );
}
