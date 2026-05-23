import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";

type PrescriptionItem = {
  qty: number;
  medications: {
    name: string;
    presentation: string;
    stock_qty: number;
    reorder_eta_days: number;
  };
};

export async function getPatientContextLogic(
  supabase: SupabaseClient,
  phone_e164: string
) {
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, phone_e164")
    .eq("phone_e164", phone_e164)
    .single();

  if (!patient) throw new Error("patient_not_found");

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("id, status")
    .eq("patient_id", patient.id)
    .in("status", ["ready", "expiring_soon"])
    .limit(1);

  const prescription_id = prescriptions?.[0]?.id;
  if (!prescription_id) throw new Error("no_active_prescription");

  const { data: items } = await supabase
    .from("prescription_items")
    .select("qty, medications(name, presentation, stock_qty, reorder_eta_days)")
    .eq("prescription_id", prescription_id);

  const itemList = ((items ?? []) as unknown as PrescriptionItem[]).map((it) => ({
    name: it.medications.name,
    presentation: it.medications.presentation,
    qty: it.qty,
    available: it.medications.stock_qty >= it.qty,
    reorder_eta_days: it.medications.reorder_eta_days,
  }));

  const available_count = itemList.filter((i) => i.available).length;
  const pending_count = itemList.length - available_count;

  const firstName = patient.full_name.split(" ").slice(0, 2).join(" ");
  const honorific = guessHonorific(patient.full_name);

  const tomorrow = addDays(new Date(), 1);
  const slot = (h: number, m: number) =>
    `${format(tomorrow, "yyyy-MM-dd")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-05:00`;

  return {
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      first_name: firstName,
      honorific,
    },
    prescription: {
      id: prescription_id,
      items: itemList,
      all_available: pending_count === 0,
      available_count,
      pending_count,
    },
    suggested_slots: [slot(9, 0), slot(10, 30), slot(14, 0)],
    default_copay_cop: 5800,
  };
}

function guessHonorific(fullName: string): "Doña" | "Don" {
  const female = ["luz", "maria", "maría", "carmen", "rosa", "ana", "marta", "lucía", "lucia", "patricia"];
  const first = fullName.split(" ")[0].toLowerCase();
  return female.some((n) => first.startsWith(n)) ? "Doña" : "Don";
}
