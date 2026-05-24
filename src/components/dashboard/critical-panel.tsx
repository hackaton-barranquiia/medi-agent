"use client";

import { AlertTriangle, ClockAlert } from "lucide-react";
import { useEffect, useState } from "react";

type Overview = {
  critical_queue: number;
  overdue_slots: number;
};

export function CriticalPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
        if (res.ok) {
          setOverview(await res.json());
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
    <div className="rounded-3xl border border-[#d03238] bg-[#fff5f5] px-4 py-3">
      <div className="flex items-center gap-2 text-[#da1e28]">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-wide">
          Critico operativo
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#525252]">
            Formulas urgentes
          </p>
          <p className="text-2xl font-extrabold text-[#0e0f0c]">
            {overview?.critical_queue ?? "—"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#525252]">
            <ClockAlert className="h-3.5 w-3.5 text-[#da1e28]" />
            Horarios vencidos
          </div>
          <p className="text-2xl font-extrabold text-[#0e0f0c]">
            {overview?.overdue_slots ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
