"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, PhoneOutgoing } from "lucide-react";
import Link from "next/link";

type Overview = {
  calls_today: number;
  active_calls: number;
  critical_queue: number;
};

export function CallCenterCard() {
  const [k, setK] = useState<Overview | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch("/api/dashboard/overview", { cache: "no-store" });
        if (r.ok) setK(await r.json());
      } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex flex-col border border-[var(--color-hairline)] bg-white">
      <div className="flex items-start justify-between gap-6 border-b border-[var(--color-hairline)] px-6 py-4">
        <div>
          <p className="eyebrow">Centro de llamadas</p>
          <p className="mt-2 max-w-[36ch] text-[13px] leading-snug text-[var(--color-body)]">
            Llamadas salientes que reemplazan la fila. Voz colombiana,
            disponible 24/7.
          </p>
        </div>
        <Link
          href="/llamadas"
          className="hidden items-center gap-1 border border-[var(--color-hairline-strong)] bg-[#f4f5f1] px-3 py-2 text-[11px] font-semibold text-[#1f221c] transition hover:border-[#1f221c] hover:bg-white sm:inline-flex"
        >
          <PhoneOutgoing className="h-3 w-3" strokeWidth={2.5} />
          Disparar llamadas
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-2">
        <div className="border-r border-[var(--color-hairline)] p-6">
          <p className="eyebrow text-[10px]">Hoy</p>
          <p className="mt-3 font-display text-[64px] leading-[0.9] tracking-[-0.03em] text-[#1f221c]">
            {k?.calls_today ?? "··"}
          </p>
          <p className="mt-2 text-[12px] text-[var(--color-mute)]">
            contactos iniciados
          </p>
        </div>
        <div className="grid grid-rows-2 divide-y divide-[var(--color-hairline)]">
          <div className="px-6 py-5">
            <div className="flex items-center gap-2">
              {(k?.active_calls ?? 0) > 0 ? (
                <span className="live-dot" aria-hidden />
              ) : (
                <span className="inline-block h-2 w-2 bg-[var(--color-hairline-strong)]" />
              )}
              <p className="eyebrow text-[10px]">En curso</p>
            </div>
            <p className="mt-2 font-display text-[30px] leading-none text-[#1f221c]">
              {k?.active_calls ?? 0}
            </p>
          </div>
          <div className="bg-[#f4f5f1] px-6 py-5">
            <p className="eyebrow text-[10px]">Urgentes</p>
            <p className="mt-2 font-display text-[30px] leading-none text-[#1f221c]">
              {k?.critical_queue ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-[var(--color-mute)]">
              fórmulas por vencer
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/llamadas"
        className="flex items-center justify-between gap-2 border-t border-[var(--color-hairline)] bg-[#9fe870] px-6 py-3 text-[#163300] transition hover:bg-[#cdffad] sm:hidden"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <PhoneOutgoing className="h-3.5 w-3.5" strokeWidth={2.5} />
          Ir al centro de llamadas
        </span>
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </section>
  );
}
