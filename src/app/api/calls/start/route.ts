import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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
    .select("id, full_name, phone_e164");
  query = patient_id ? query.eq("id", patient_id) : query.eq("phone_e164", phone_e164!);
  const { data: patient, error } = await query.single();

  if (error || !patient) {
    return NextResponse.json({ error: "patient not found" }, { status: 404 });
  }

  const firstName = patient.full_name.split(" ").slice(0, 2).join(" ");
  const dynamicFirstMessage = `Buenos dias, le habla MediAgent del dispensario. Hablo con ${firstName}?`;

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
      assistantOverrides: {
        firstMessage: dynamicFirstMessage,
        variableValues: {
          patient_name: patient.full_name,
          patient_first_name: firstName,
          patient_phone_e164: patient.phone_e164,
        },
      },
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
