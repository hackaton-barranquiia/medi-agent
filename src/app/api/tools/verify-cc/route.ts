import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyCcLogic } from "@/lib/tools/verify-cc";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body?.message?.toolCalls?.[0];
  const args = toolCall?.function?.arguments ?? {};
  const { patient_id, phone_e164, last_4_cc } = args;

  if (!last_4_cc || (!patient_id && !phone_e164)) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall?.id, result: { valid: false } }],
    });
  }

  const result = await verifyCcLogic(
    supabaseServer(),
    { patient_id, phone_e164 },
    last_4_cc
  );

  return NextResponse.json({
    results: [{ toolCallId: toolCall.id, result }],
  });
}
