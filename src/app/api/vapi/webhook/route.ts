import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const supabase = supabaseServer();
  const callId: string | undefined = message.call?.id;

  switch (message.type) {
    case "end-of-call-report": {
      if (callId) {
        await supabase
          .from("call_logs")
          .update({ outcome: message.endedReason ?? "unknown", ended_at: new Date().toISOString() })
          .eq("vapi_call_id", callId);
      }
      break;
    }

    case "transcript": {
      if (callId && message.transcript) {
        await supabase.from("call_events").insert({
          vapi_call_id: callId,
          event_type: "transcript",
          payload: {
            role: message.role,
            transcript: message.transcript,
          },
        });
      }
      break;
    }

    case "tool-calls": {
      if (callId && message.toolCallList?.length) {
        for (const tc of message.toolCallList) {
          await supabase.from("call_events").insert({
            vapi_call_id: callId,
            event_type: "tool-call",
            payload: {
              name: tc.function?.name,
              arguments: tc.function?.arguments,
            },
          });
        }
      }
      break;
    }

    case "tool-calls-result": {
      if (callId && message.toolCallList?.length) {
        for (const tc of message.toolCallList) {
          await supabase.from("call_events").insert({
            vapi_call_id: callId,
            event_type: "tool-result",
            payload: {
              name: tc.function?.name,
              result: tc.result,
            },
          });
        }
      }
      break;
    }

    case "status-update": {
      if (callId && message.status) {
        await supabase.from("call_events").insert({
          vapi_call_id: callId,
          event_type: "status",
          payload: { status: message.status },
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
