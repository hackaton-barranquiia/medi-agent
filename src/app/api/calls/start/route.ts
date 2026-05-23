import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const patient_id = body.patient_id;
  if (!patient_id) {
    return NextResponse.json({ error: "patient_id required" }, { status: 400 });
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
  const { data: patient, error } = await supabase
    .from("patients")
    .select("phone_e164")
    .eq("id", patient_id)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "patient not found" }, { status: 404 });
  }

  const vapiRes = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: patient.phone_e164 },
    }),
  });

  if (!vapiRes.ok) {
    const text = await vapiRes.text();
    return NextResponse.json({ error: `vapi: ${text}` }, { status: 502 });
  }

  const data = await vapiRes.json();

  await supabase.from("call_logs").insert({
    patient_id,
    vapi_call_id: data.id,
    started_at: new Date().toISOString(),
  });

  return NextResponse.json({ call_id: data.id, status: "queued" });
}
