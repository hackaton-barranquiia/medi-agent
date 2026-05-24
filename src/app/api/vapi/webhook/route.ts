import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;

  if (message?.type === "end-of-call-report") {
    const callId = message.call?.id;
    const outcome = message.endedReason ?? "unknown";
    if (callId) {
      await supabaseServer()
        .from("call_logs")
        .update({ outcome, ended_at: new Date().toISOString() })
        .eq("vapi_call_id", callId);
    }
  }

  return NextResponse.json({ ok: true });
}
