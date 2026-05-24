"use client";

import { PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";

type Kpis = {
  calls_today: number;
  active_calls: number;
};

export function CallsOverview() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch("/api/dashboard/overview", {
          cache: "no-store",
        });
        if (res.ok) {
          setKpis(await res.json());
        }
      } catch {
        // best effort
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-[#dedee5] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[#101114]">
        <PhoneCall className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-wide">
          Centro de llamadas
        </p>
      </div>
      <p className="mt-1 text-3xl font-extrabold text-[#101114]">
        {kpis?.calls_today ?? "—"}
      </p>
      <p className="text-xs text-[#9497a9]">
        Contactos iniciados hoy para confirmar retiro sin fila.
      </p>
      <div className="mt-2 border-t border-[#dedee5] pt-2">
        <p className="text-[11px] uppercase tracking-wide text-[#9497a9]">
          Llamadas en curso
        </p>
        <p className="text-lg font-semibold text-[#101114]">
          {kpis?.active_calls ?? "—"}
        </p>
      </div>
    </div>
  );
}
