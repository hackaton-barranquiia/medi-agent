import { NextRequest, NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { supabaseServer } from "@/lib/supabase/server";
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const patient_id = body.patient_id as string | undefined;
  const phone_e164 = body.phone_e164 as string | undefined;
  if (!patient_id && !phone_e164) {
    return NextResponse.json(
      { error: "patient_id or phone_e164 required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!apiKey || !assistantId || !phoneNumberId) {
    return NextResponse.json(
      { error: "Vapi env vars not configured" },
      { status: 503 }
    );
  }

  const supabase = supabaseServer();
  let query = supabase
    .from("patients")
    .select("id, full_name, phone_e164, last_4_cc");
  query = patient_id
    ? query.eq("id", patient_id)
    : query.eq("phone_e164", phone_e164!);
  const { data: patient, error } = await query.single();

  if (error || !patient) {
    return NextResponse.json({ error: "patient not found" }, { status: 404 });
  }

  let ctx;
  try {
    ctx = await getPatientContextLogic(supabase, patient.phone_e164);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const first_name = patient.full_name.split(" ").slice(0, 2).join(" ");
  const honorific = guessHonorific(patient.full_name).toLowerCase();
  const available_count_spoken =
    COUNT_SPOKEN[ctx.prescription.available_count] ??
    `${ctx.prescription.available_count} medicamentos`;
  const delivery_date = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const variableValues = {
    first_name,
    honorific,
    last_4_cc: patient.last_4_cc,
    prescription_id: ctx.prescription.id,
    available_count_spoken,
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
    copay_cents: COPAY_CENTS,
    copay_spoken: COPAY_SPOKEN,
  };

  const vapiRes = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: patient.phone_e164, name: patient.full_name },
      assistantOverrides: { variableValues },
    }),
  });

  if (!vapiRes.ok) {
    const text = await vapiRes.text();
    return NextResponse.json({ error: `vapi: ${text}` }, { status: 502 });
  }

  const data = await vapiRes.json();

  await supabase.from("call_logs").insert({
    patient_id: patient.id,
    vapi_call_id: data.id,
    started_at: new Date().toISOString(),
  });

  return NextResponse.json({ call_id: data.id, status: "queued" });
}
