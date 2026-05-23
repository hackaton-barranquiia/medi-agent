import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getPatientContextLogic } from "@/lib/tools/get-patient-context";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body?.message?.toolCalls?.[0];
  const { phone_e164 } = toolCall?.function?.arguments ?? {};

  if (!phone_e164) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall?.id, result: { error: "phone_e164 required" } }],
    });
  }

  try {
    const result = await getPatientContextLogic(supabaseServer(), phone_e164);
    return NextResponse.json({ results: [{ toolCallId: toolCall.id, result }] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: { error: message } }],
    });
  }
}
