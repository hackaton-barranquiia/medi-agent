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

  const ordered = (data ?? []).sort((a, b) => {
    const priority = (status: string) => (status === "expiring_soon" ? 0 : 1);
    return (
      priority(a.status as string) - priority(b.status as string) ||
      new Date(String(b.created_at)).getTime() -
        new Date(String(a.created_at)).getTime()
    );
  });

  const items = ordered.flatMap((rx) => {
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
