import { Clock3, PackageCheck } from "lucide-react";
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
    .limit(12);

  const rows = (data ?? []) as unknown as AppointmentRow[];

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#525252]">
        No hay pedidos agendados para alistar en las proximas horas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const patientName = getPatientName(row.prescriptions) ?? "Paciente";
        const isReady = row.status === "ready_for_pickup";
        return (
          <div
            key={row.id}
            className="grid grid-cols-1 items-center gap-2 border border-[#e0e0e0] bg-white px-3 py-2"
          >
            <div>
              <div className="flex items-center gap-2 text-[#161616]">
                <Clock3 className="h-3.5 w-3.5 text-[#0f62fe]" />
                <p className="text-sm font-semibold">
                  {format(new Date(row.slot_start), "HH:mm")}
                </p>
                <span className="text-xs text-[#525252]">- {patientName}</span>
              </div>
              <p className="text-xs text-[#525252]">
                {isReady
                  ? "Pedido listo para entrega en modulo"
                  : "Preparar pedido antes del turno"}
              </p>
            </div>
            <div
              className={`flex w-fit items-center gap-1 border px-2 py-1 text-[11px] ${
                row.status === "delivered"
                  ? "border-[#198038] text-[#198038]"
                  : isReady
                    ? "border-[#8a3ffc] text-[#8a3ffc]"
                    : "border-[#0f62fe] text-[#0f62fe]"
              }`}
            >
              <PackageCheck className="h-3 w-3" />
              {row.status === "delivered"
                ? "Entregado"
                : isReady
                  ? "Alistado"
                  : "Por alistar"}
            </div>
            <div>
              <AppointmentActions appointmentId={row.id} status={row.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
