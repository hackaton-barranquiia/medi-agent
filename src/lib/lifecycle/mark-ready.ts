import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_FROM = ["scheduled"];

export async function markAppointmentReady(supabase: SupabaseClient, id: string) {
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
    .update({ status: "ready_for_pickup" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "update_failed");
  }

  return data;
}
