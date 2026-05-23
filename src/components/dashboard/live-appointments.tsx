"use client";

import { useEffect, useState } from "react";
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
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          setAppointments((curr) => [...curr, payload.new as Appointment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Sin citas agendadas. Aparecerán aquí en tiempo real cuando el agente
        confirme un turno.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appt) => (
        <div
          key={appt.id}
          className="animate-in fade-in slide-in-from-top-2 rounded-lg border bg-white p-3"
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">
              {format(new Date(appt.slot_start), "HH:mm")}
            </p>
            <Badge>{appt.status === "scheduled" ? "Agendada" : appt.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Copago: ${(appt.copay_cents / 100).toLocaleString("es-CO")}
          </p>
          {appt.delivery_for_pending && (
            <p className="text-xs text-amber-600">
              Domicilio pendiente: {appt.delivery_date}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
