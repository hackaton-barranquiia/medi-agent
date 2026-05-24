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

  const cells = [
    {
      label: "Llamadas hoy",
      value: kpis?.calls_today ?? "—",
      title: "Cantidad de llamadas iniciadas hoy",
    },
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
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden border border-[#e0e0e0] bg-[#e0e0e0] md:grid-cols-3">
      {cells.map((c) => (
        <div key={c.label} className="bg-white px-4 py-3" title={c.title}>
          <p className="text-[11px] uppercase tracking-wide text-[#525252]">
            {c.label}
          </p>
          <p className="text-2xl font-light text-[#161616]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
