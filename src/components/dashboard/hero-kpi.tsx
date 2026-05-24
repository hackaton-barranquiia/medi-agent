"use client";

import { useEffect, useState } from "react";

type Kpis = {
  appointments_today: number;
  deliveries_today: number;
  calls_today: number;
  active_calls: number;
  ready_for_pickup: number;
  pending_pickup: number;
};

export function HeroKpi() {
  const [k, setK] = useState<Kpis | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
        if (alive && res.ok) setK(await res.json());
      } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const compliance =
    k && k.appointments_today > 0
      ? Math.round((k.deliveries_today / k.appointments_today) * 100)
      : 0;

  return (
    <section className="px-4 pt-8 pb-2 lg:px-10 lg:pt-10">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">Cumplimiento de entregas — hoy</p>
          <div className="mt-3 flex items-end gap-4">
            <span
              className="font-display text-[clamp(88px,14vw,150px)] leading-[0.85] tracking-[-0.045em] text-[#1f221c]"
              aria-label={`${compliance}% de cumplimiento`}
            >
              {k ? compliance : "··"}
              <span className="text-[#7fc452]">%</span>
            </span>
            <div className="mb-3 hidden flex-col gap-1 border-l border-[var(--color-hairline-strong)] pl-4 sm:flex">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-mute)]">
                entregas / citas
              </span>
              <span className="font-display text-[20px] leading-none text-[#1f221c]">
                {k?.deliveries_today ?? 0}
                <span className="mx-1 text-[var(--color-mute)]">/</span>
                {k?.appointments_today ?? 0}
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-[44ch] text-[14px] leading-snug text-[var(--color-body)]">
            Pacientes que ya retiraron su medicación contra el total agendado
            para hoy. Subir este número es el objetivo del centro de operación.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 self-stretch">
          <MiniStat label="En curso" value={k?.active_calls ?? 0} live />
          <MiniStat label="Por alistar" value={k?.pending_pickup ?? 0} />
          <MiniStat label="Alistados" value={k?.ready_for_pickup ?? 0} />
          <MiniStat label="Llamadas hoy" value={k?.calls_today ?? 0} />
        </div>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  live,
}: {
  label: string;
  value: number;
  live?: boolean;
}) {
  return (
    <div className="border border-[var(--color-hairline)] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-[10px]">{label}</p>
        {live && <span className="live-dot" aria-hidden />}
      </div>
      <p className="mt-2 font-display text-[38px] leading-none text-[#1f221c]">
        {value}
      </p>
    </div>
  );
}
