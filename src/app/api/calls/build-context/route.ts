import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildCallContext } from "@/lib/calls/build-context";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  if (!assistantId) {
    return NextResponse.json(
      { error: "VAPI_ASSISTANT_ID not configured" },
      { status: 503 }
    );
  }

  const ctx = await buildCallContext(supabaseServer(), {
    patient_id: body.patient_id,
    phone_e164: body.phone_e164,
  });

  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  return NextResponse.json({
    assistantId,
    patient: ctx.patient,
    variableValues: ctx.variableValues,
  });
}
