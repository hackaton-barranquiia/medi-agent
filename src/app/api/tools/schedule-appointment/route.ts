import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { scheduleAppointmentLogic, type ScheduleAppointmentArgs } from "@/lib/tools/schedule-appointment";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body?.message?.toolCalls?.[0];
  const args = (toolCall?.function?.arguments ?? {}) as Partial<ScheduleAppointmentArgs>;

  if (!args.prescription_id || !args.slot_start || args.copay_cents === undefined) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall?.id, result: { error: "missing_required_args" } }],
    });
  }

  try {
    const result = await scheduleAppointmentLogic(supabaseServer(), args as ScheduleAppointmentArgs);
    return NextResponse.json({ results: [{ toolCallId: toolCall.id, result }] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: { error: message } }],
    });
  }
}
