"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

const TITLES: Record<string, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "01 — Tablero", title: "Operación del día" },
  "/llamadas": { eyebrow: "02 — Llamadas", title: "Centro de llamadas" },
  "/agenda": { eyebrow: "03 — Agenda", title: "Cronograma de pedidos" },
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const ctx = TITLES[pathname ?? "/"] ?? TITLES["/"];
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = now
    ? new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(now)
    : "—";

  const timeLabel = now
    ? new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now)
    : "—";

  return (
    <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-hairline)] bg-white px-4 py-4 lg:px-10 lg:py-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="border border-[var(--color-hairline)] p-2 text-[#1f221c] hover:bg-[#f4f5f1] lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="eyebrow">{ctx.eyebrow}</p>
          <h1 className="font-display text-[26px] leading-[1.05] tracking-[-0.03em] text-[#1f221c] sm:text-[30px]">
            {ctx.title}
          </h1>
        </div>
      </div>
      <div className="hidden text-right md:block">
        <p className="eyebrow text-[10px]">{dateLabel}</p>
        <p className="mt-1 font-mono text-[18px] font-semibold leading-none text-[#1f221c]">
          {timeLabel}
        </p>
      </div>
    </header>
  );
}
