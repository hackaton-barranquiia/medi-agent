"use client";

import { useEffect, useState } from "react";
import { AppointmentActions } from "@/components/dashboard/appointment-actions";
import { Badge } from "@/components/ui/badge";
import { supabaseBrowser } from "@/lib/supabase/client";
import { format } from "date-fns";

type Appointment = {
  id: string;
  slot_start: string;
  status: string;
  copay_cents: number;
  delivery_for_pending: boolean;
  delivery_date: string | null;
  prescription_id: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendada", className: "border-[#0f62fe] text-[#0f62fe]" },
  ready_for_pickup: {
    label: "Alistada",
    className: "border-[#8a3ffc] text-[#8a3ffc]",
  },
  delivered: { label: "Entregada", className: "border-[#198038] text-[#198038]" },
  no_show: { label: "No asistio", className: "border-[#525252] text-[#525252]" },
  cancelled: { label: "Cancelada", className: "border-[#da1e28] text-[#da1e28]" },
};

export function LiveAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase
      .from("appointments")
      .select("*")
      .order("slot_start")
      .then(({ data }) => setAppointments(data ?? []));

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAppointments((curr) => [...curr, payload.new as Appointment]);
          } else if (payload.eventType === "UPDATE") {
            setAppointments((curr) =>
              curr.map((a) =>
                a.id === (payload.new as Appointment).id
                  ? (payload.new as Appointment)
                  : a
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-[#525252]">
        Aun no hay turnos agendados - esperando llamadas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => {
        const meta = STATUS_LABELS[appt.status] ?? {
          label: appt.status,
          className: "",
        };

        return (
          <div key={appt.id} className="border border-[#e0e0e0] bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#161616]">
                {format(new Date(appt.slot_start), "HH:mm")}
              </p>
              <Badge
                className={`rounded-none border bg-transparent px-2 py-0.5 text-[11px] ${meta.className}`}
              >
                {meta.label}
              </Badge>
            </div>
            <p className="text-xs text-[#525252]">
              Copago: ${(appt.copay_cents / 100).toLocaleString("es-CO")}
            </p>
            {appt.delivery_for_pending && (
              <p className="text-xs text-[#8c6d1f]">
                Domicilio pendiente: {appt.delivery_date}
              </p>
            )}
            <div className="mt-2">
              <AppointmentActions appointmentId={appt.id} status={appt.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
