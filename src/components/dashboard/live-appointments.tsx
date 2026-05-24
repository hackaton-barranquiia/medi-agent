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
      <p className="text-sm text-[#525252]">
        Sin citas agendadas. Aparecerán aquí en tiempo real cuando el agente
        confirme un turno.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => (
        <div key={appt.id} className="border border-[#e0e0e0] bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#161616]">
              {format(new Date(appt.slot_start), "HH:mm")}
            </p>
            <Badge className="rounded-none border px-2 py-0.5 text-[11px]">
              {appt.status === "scheduled" ? "Agendada" : appt.status}
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
        </div>
      ))}
    </div>
  );
}
