import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { checkSlotAvailability } from "@/lib/calls/availability";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body?.message?.toolCalls?.[0];
  const args = (toolCall?.function?.arguments ?? {}) as {
    date?: string;
    hour?: string;
  };

  if (!args.date || !args.hour) {
    return NextResponse.json({
      results: [
        {
          toolCallId: toolCall?.id,
          result: { available: false, reason: "invalid_input" },
        },
      ],
    });
  }

  const result = await checkSlotAvailability(supabaseServer(), args.date, args.hour);
  return NextResponse.json({
    results: [{ toolCallId: toolCall.id, result }],
  });
}
