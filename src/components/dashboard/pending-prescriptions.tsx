import { supabaseServer } from "@/lib/supabase/server";
import { PendingPrescriptionsList } from "@/components/dashboard/pending-prescriptions-list";

export async function PendingPrescriptions() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("prescriptions")
    .select(
      `
      id, status, created_at,
      patients(id, full_name, phone_e164)
    `
    )
    .in("status", ["ready", "expiring_soon"])
    .order("created_at", { ascending: false });

  const items = (data ?? []).flatMap((rx) => {
    const patient = Array.isArray(rx.patients) ? rx.patients[0] : rx.patients;
    if (!patient) return [];
    return [
      {
        id: rx.id as string,
        status: rx.status as string,
        patients: patient as {
          id: string;
          full_name: string;
          phone_e164: string;
        },
      },
    ];
  });

  return <PendingPrescriptionsList items={items} />;
}
