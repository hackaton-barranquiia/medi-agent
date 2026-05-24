"use client";

import { useEffect, useState } from "react";

type Kpis = {
  calls_today: number;
  appointments_today: number;
  deliveries_today: number;
};

export function KpiStrip() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch("/api/dashboard/kpis", { cache: "no-store" });
        if (res.ok) {
          setKpis(await res.json());
        }
      } catch {
        // best effort only
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  const compliance =
    kpis && kpis.appointments_today > 0
      ? Math.round((kpis.deliveries_today / kpis.appointments_today) * 100)
      : 0;

  const cells = [
    {
      label: "Citas hoy",
      value: kpis?.appointments_today ?? "—",
      title: "Turnos agendados para hoy",
    },
    {
      label: "Entregas hoy",
      value: kpis?.deliveries_today ?? "—",
      title: "Turnos marcados como entregados hoy",
    },
    {
      label: "Cumplimiento",
      value: kpis ? `${compliance}%` : "—",
      title: "Entregas de hoy sobre citas de hoy",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          title={c.title}
        >
          <p className="text-[11px] uppercase tracking-wide text-[#454745]">
            {c.label}
          </p>
          <p className="text-2xl font-extrabold text-[#0e0f0c]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
