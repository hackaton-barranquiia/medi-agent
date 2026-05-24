import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildCallContext } from "@/lib/calls/build-context";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
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
  const ctx = await buildCallContext(supabase, {
    patient_id: body.patient_id,
    phone_e164: body.phone_e164,
  });

  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
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
      customer: { number: ctx.patient.phone_e164, name: ctx.patient.full_name },
      assistantOverrides: { variableValues: ctx.variableValues },
    }),
  });

  if (!vapiRes.ok) {
    const text = await vapiRes.text();
    return NextResponse.json({ error: `vapi: ${text}` }, { status: 502 });
  }

  const data = await vapiRes.json();

  await supabase.from("call_logs").insert({
    patient_id: ctx.patient.id,
    vapi_call_id: data.id,
    started_at: new Date().toISOString(),
  });

  return NextResponse.json({ call_id: data.id, status: "queued" });
}
