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
  patient_name?: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendada", className: "border-[#7132f5] text-[#7132f5]" },
  ready_for_pickup: { label: "Alistada", className: "border-[#5741d8] text-[#5741d8]" },
  delivered: { label: "Entregada", className: "border-[#149e61] text-[#149e61]" },
  no_show: { label: "No asistio", className: "border-[#dedee5] text-[#686b82]" },
  cancelled: { label: "Cancelada", className: "border-[#d03238] text-[#d03238]" },
};

export function LiveAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const load = async () => {
      const { data } = await supabase
        .from("appointments")
        .select(
          "id, slot_start, status, copay_cents, delivery_for_pending, delivery_date, prescription_id, prescriptions(patients(full_name))"
        )
        .order("slot_start");

      const parsed = (data ?? []).map((row) => {
        const record = row as unknown as {
          id: string;
          slot_start: string;
          status: string;
          copay_cents: number;
          delivery_for_pending: boolean;
          delivery_date: string | null;
          prescription_id: string;
          prescriptions?:
            | { patients: { full_name?: string } | { full_name?: string }[] | null }
            | Array<{
                patients:
                  | { full_name?: string }
                  | { full_name?: string }[]
                  | null;
              }>
            | null;
        };
        const prescription = Array.isArray(record.prescriptions)
          ? record.prescriptions[0]
          : record.prescriptions;
        const patients = prescription?.patients;
        const patient = Array.isArray(patients) ? patients[0] : patients;

        return {
          id: record.id,
          slot_start: record.slot_start,
          status: record.status,
          copay_cents: record.copay_cents,
          delivery_for_pending: record.delivery_for_pending,
          delivery_date: record.delivery_date,
          prescription_id: record.prescription_id,
          patient_name: patient?.full_name ?? "Paciente",
        } satisfies Appointment;
      });

      setAppointments(parsed);
    };

    load();

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            load();
          } else if (payload.eventType === "UPDATE") {
            setAppointments((curr) => {
              const updated = payload.new as Appointment;
              return curr.map((a) =>
                a.id === updated.id ? { ...a, ...updated } : a
              );
            });
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
      <p className="text-sm text-[#9497a9]">
        Aun no hay turnos agendados — esperando llamadas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {(["scheduled", "ready_for_pickup", "delivered"] as const).map((lane) => {
        const laneItems = appointments.filter((a) => a.status === lane);
        const laneMeta = STATUS_LABELS[lane];
        return (
          <div key={lane} className="rounded-xl border border-[#dedee5] bg-[#f5f5f7]">
            <div className="rounded-t-xl border-b border-[#dedee5] bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#686b82]">
                {laneMeta?.label ?? lane}
              </p>
            </div>
            <div className="space-y-2 p-2">
              {laneItems.length === 0 ? (
                <p className="px-1 py-2 text-xs text-[#9497a9]">
                  Sin pedidos en esta franja.
                </p>
              ) : (
                laneItems.map((appt) => {
                  const meta = STATUS_LABELS[appt.status] ?? {
                    label: appt.status,
                    className: "",
                  };
                  return (
                    <div
                      key={appt.id}
                      className="rounded-xl border border-[#dedee5] bg-white p-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#101114]">
                          {format(new Date(appt.slot_start), "HH:mm")}
                        </p>
                        <Badge
                          className={`rounded-md border bg-transparent px-2 py-0.5 text-[11px] ${meta.className}`}
                        >
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#686b82]">{appt.patient_name}</p>
                      <p className="text-xs text-[#686b82]">
                        Copago: ${(appt.copay_cents / 100).toLocaleString("es-CO")}
                      </p>
                      {appt.delivery_for_pending && (
                        <p className="text-xs text-[#686b82]">
                          Domicilio: {appt.delivery_date}
                        </p>
                      )}
                      <div className="mt-2">
                        <AppointmentActions
                          appointmentId={appt.id}
                          status={appt.status}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
