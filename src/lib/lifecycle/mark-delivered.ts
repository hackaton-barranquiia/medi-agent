import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_FROM = ["ready_for_pickup"];

export async function markAppointmentDelivered(
  supabase: SupabaseClient,
  id: string
) {
  const { data: current, error: fetchError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    throw new Error("appointment_not_found");
  }
  if (!VALID_FROM.includes(current.status)) {
    throw new Error("invalid_transition");
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "delivered" })
    .eq("id", id)
    .select("id, status, prescription_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "update_failed");
  }

  await supabase
    .from("prescriptions")
    .update({ status: "picked_up" })
    .eq("id", data.prescription_id);

  return data;
}
