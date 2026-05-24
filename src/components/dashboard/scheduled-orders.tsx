import { Clock3 } from "lucide-react";
import { format } from "date-fns";
import { AppointmentActions } from "@/components/dashboard/appointment-actions";
import { supabaseServer } from "@/lib/supabase/server";

type AppointmentRow = {
  id: string;
  slot_start: string;
  status: string;
  prescriptions:
    | { patients: { full_name: string } | { full_name: string }[] | null }
    | { patients: { full_name: string } | { full_name: string }[] | null }[]
    | null;
};

function getPatientName(
  value: AppointmentRow["prescriptions"]
): string | undefined {
  const prescription = Array.isArray(value) ? value[0] : value;
  if (!prescription) return undefined;
  const patients = prescription.patients;
  const patient = Array.isArray(patients) ? patients[0] : patients;
  return patient?.full_name;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Por alistar", color: "text-[#686b82] border-[#dedee5]" },
  ready_for_pickup: { label: "Alistado", color: "text-[#5741d8] border-[#5741d8]" },
  delivered: { label: "Entregado", color: "text-[#149e61] border-[#149e61]" },
};

export async function ScheduledOrders() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data } = await supabaseServer()
    .from("appointments")
    .select(
      "id, status, slot_start, prescriptions!inner(patients!inner(full_name))"
    )
    .in("status", ["scheduled", "ready_for_pickup", "delivered"])
    .gte("slot_start", start.toISOString())
    .lt("slot_start", end.toISOString())
    .order("slot_start", { ascending: true })
    .limit(24);

  const rows = (data ?? []) as unknown as AppointmentRow[];

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#9497a9]">
        No hay pedidos agendados para alistar hoy.
      </p>
    );
  }

  // Group by hour
  const grouped = new Map<string, AppointmentRow[]>();
  for (const row of rows) {
    const hourKey = format(new Date(row.slot_start), "HH:00");
    if (!grouped.has(hourKey)) grouped.set(hourKey, []);
    grouped.get(hourKey)!.push(row);
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([hour, slots]) => (
        <div key={hour}>
          <div className="mb-2 flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5 text-[#686b82]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#686b82]">
              {hour}
            </span>
            <span className="text-xs text-[#9497a9]">
              {slots.length} pedido{slots.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {slots.map((row) => {
              const patientName = getPatientName(row.prescriptions) ?? "Paciente";
              const meta = STATUS_META[row.status] ?? STATUS_META.scheduled;
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#dedee5] bg-white px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#101114]">
                      {patientName}
                    </p>
                    <p className="text-xs text-[#686b82]">
                      {format(new Date(row.slot_start), "HH:mm")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-xl border px-2 py-0.5 text-[11px] font-medium ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    <AppointmentActions
                      appointmentId={row.id}
                      status={row.status}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
