import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { markAppointmentDelivered } from "@/lib/lifecycle/mark-delivered";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await markAppointmentDelivered(supabaseServer(), id);
    return NextResponse.json({ ok: true, appointment: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    const status =
      message === "appointment_not_found"
        ? 404
        : message === "invalid_transition"
          ? 409
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
