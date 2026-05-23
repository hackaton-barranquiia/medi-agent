import type { SupabaseClient } from "@supabase/supabase-js";
import { addMinutes, format } from "date-fns";

export type ScheduleAppointmentArgs = {
  prescription_id: string;
  slot_start: string;
  copay_cents: number;
  delivery_for_pending?: boolean;
  delivery_date?: string;
};

export async function scheduleAppointmentLogic(
  supabase: SupabaseClient,
  args: ScheduleAppointmentArgs
) {
  const slotStartDate = new Date(args.slot_start);
  const slotEndDate = addMinutes(slotStartDate, 15);

  const row = {
    prescription_id: args.prescription_id,
    slot_start: args.slot_start,
    slot_end: slotEndDate.toISOString(),
    status: "scheduled",
    copay_cents: args.copay_cents,
    delivery_for_pending: args.delivery_for_pending ?? false,
    delivery_date: args.delivery_date ?? null,
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "insert_failed");
  }

  const time = format(slotStartDate, "HH:mm");
  const confirmation_message = `Listo. Su turno es mañana a las ${time}.`;

  return {
    appointment_id: data.id,
    slot_start: data.slot_start,
    slot_end: data.slot_end,
    confirmation_message,
  };
}
