"use client";

import { useEffect, useState } from "react";

type Overview = {
  appointments_today: number;
  ready_for_pickup: number;
  deliveries_today: number;
  pending_pickup: number;
};

export function Funnel() {
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

  const max = Math.max(k?.appointments_today ?? 0, 1);
  const rows = [
    {
      label: "Agendados",
      value: k?.appointments_today ?? 0,
      tone: "bg-[#4d5048]",
    },
    {
      label: "Por alistar",
      value: k?.pending_pickup ?? 0,
      tone: "bg-[#8a8d83]",
    },
    {
      label: "Alistados",
      value: k?.ready_for_pickup ?? 0,
      tone: "bg-[#c9cdc1]",
    },
    {
      label: "Entregados",
      value: k?.deliveries_today ?? 0,
      tone: "bg-[#9fe870]",
    },
  ];

  return (
    <section className="border border-[var(--color-hairline)] bg-white">
      <header className="flex items-baseline justify-between border-b border-[var(--color-hairline)] px-6 py-4">
        <p className="eyebrow">Embudo del día</p>
        <p className="font-mono text-[11px] text-[var(--color-mute)]">
          turnos → entregas
        </p>
      </header>
      <div className="divide-y divide-[var(--color-hairline)]">
        {rows.map((r) => {
          const pct = Math.round((r.value / max) * 100);
          return (
            <div key={r.label} className="px-6 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1f221c]">
                  {r.label}
                </span>
                <span className="font-display text-[22px] leading-none text-[#1f221c]">
                  {r.value}
                </span>
              </div>
              <div className="mt-2 h-2 w-full bg-[#f4f5f1]">
                <div
                  className={`h-full ${r.tone} transition-all duration-700`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
