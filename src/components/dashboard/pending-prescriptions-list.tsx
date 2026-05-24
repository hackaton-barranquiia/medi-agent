"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CallButton } from "@/components/dashboard/call-button";
import { supabaseBrowser } from "@/lib/supabase/client";

type PrescriptionRow = {
  id: string;
  status: string;
  patients: {
    id: string;
    full_name: string;
    phone_e164: string;
  };
};

export function PendingPrescriptionsList({ items }: { items: PrescriptionRow[] }) {
  const [activePatientIds, setActivePatientIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel("call-logs-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs" },
        (payload) => {
          const patientId = payload.new.patient_id as string | undefined;
          if (patientId) {
            setActivePatientIds((curr) => new Set([...curr, patientId]));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_logs" },
        (payload) => {
          const patientId = payload.new.patient_id as string | undefined;
          const endedAt = payload.new.ended_at as string | null | undefined;
          if (patientId && endedAt) {
            setActivePatientIds((curr) => {
              const next = new Set(curr);
              next.delete(patientId);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#525252]">
        No hay fórmulas pendientes por retirar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((rx) => {
        const inCall = activePatientIds.has(rx.patients.id);
        return (
          <div
            key={rx.id}
            className={`flex items-center justify-between border p-4 transition-colors ${
              inCall
                ? "border-[#0f62fe] bg-[#edf5ff]"
                : "border-[#e0e0e0] bg-white"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#161616]">
                {rx.patients.full_name}
              </p>
              <p className="text-xs text-[#525252]">{rx.patients.phone_e164}</p>
              {inCall && (
                <p className="mt-1 text-xs font-medium text-[#0f62fe]">
                  Llamada en curso...
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className="rounded-none border px-2 py-0.5 text-[11px]"
                variant={rx.status === "expiring_soon" ? "destructive" : "secondary"}
              >
                {rx.status === "expiring_soon" ? "Vence pronto" : "Lista"}
              </Badge>
              <CallButton
                patientId={rx.patients.id}
                patientName={rx.patients.full_name}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
