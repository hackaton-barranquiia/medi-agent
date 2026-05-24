import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";
import {
  getPatientContextLogic,
  guessHonorific,
} from "@/lib/tools/get-patient-context";

const COUNT_SPOKEN: Record<number, string> = {
  0: "ningún medicamento",
  1: "un medicamento",
  2: "dos medicamentos",
  3: "tres medicamentos",
  4: "cuatro medicamentos",
  5: "cinco medicamentos",
  6: "seis medicamentos",
  7: "siete medicamentos",
  8: "ocho medicamentos",
  9: "nueve medicamentos",
  10: "diez medicamentos",
};

const COPAY_CENTS = 5800;
const COPAY_SPOKEN = "cinco mil ochocientos pesos";

const PICKUP_SPOKEN = [
  "mañana a las nueve",
  "mañana a las diez y media",
  "mañana a las dos de la tarde",
];

function spokenMedName(name: string): string {
  return name.replace(/(\d+)\s*mg/gi, "$1 miligramos");
}

function joinSpanishList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export type CallContextResult =
  | {
      ok: true;
      patient: { id: string; full_name: string; phone_e164: string };
      variableValues: Record<string, string>;
    }
  | { ok: false; status: number; error: string };

export async function buildCallContext(
  supabase: SupabaseClient,
  identifier: { patient_id?: string; phone_e164?: string }
): Promise<CallContextResult> {
  if (!identifier.patient_id && !identifier.phone_e164) {
    return { ok: false, status: 400, error: "patient_id or phone_e164 required" };
  }

  let query = supabase
    .from("patients")
    .select("id, full_name, phone_e164, last_4_cc");
  query = identifier.patient_id
    ? query.eq("id", identifier.patient_id)
    : query.eq("phone_e164", identifier.phone_e164!);
  const { data: patient, error } = await query.single();

  if (error || !patient) {
    return { ok: false, status: 404, error: "patient not found" };
  }

  let ctx;
  try {
    ctx = await getPatientContextLogic(supabase, patient.phone_e164);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, status: 422, error: message };
  }

  const first_name = patient.full_name.split(" ").slice(0, 2).join(" ");
  const honorific = guessHonorific(patient.full_name).toLowerCase();
  const available_count_spoken =
    COUNT_SPOKEN[ctx.prescription.available_count] ??
    `${ctx.prescription.available_count} medicamentos`;
  const medications_spoken = joinSpanishList(
    ctx.prescription.items
      .filter((i) => i.available)
      .map((i) => spokenMedName(i.name))
  );
  const delivery_date = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const variableValues: Record<string, string> = {
    first_name,
    honorific,
    last_4_cc: patient.last_4_cc,
    prescription_id: ctx.prescription.id,
    available_count_spoken,
    medications_spoken,
    slot_pickup_iso_1: ctx.suggested_slots[0],
    slot_pickup_iso_2: ctx.suggested_slots[1],
    slot_pickup_iso_3: ctx.suggested_slots[2],
    slot_pickup_spoken_1: PICKUP_SPOKEN[0],
    slot_pickup_spoken_2: PICKUP_SPOKEN[1],
    slot_pickup_spoken_3: PICKUP_SPOKEN[2],
    slot_delivery_iso_morning: ctx.suggested_slots[0],
    slot_delivery_iso_afternoon: ctx.suggested_slots[2],
    slot_delivery_spoken_morning: "mañana en la mañana",
    slot_delivery_spoken_afternoon: "mañana en la tarde",
    delivery_date,
    copay_cents: String(COPAY_CENTS),
    copay_spoken: COPAY_SPOKEN,
  };

  return {
    ok: true,
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      phone_e164: patient.phone_e164,
    },
    variableValues,
  };
}
