import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyCcLogic(
  supabase: SupabaseClient,
  patient_id: string,
  last_4_cc: string
): Promise<{ valid: boolean }> {
  const { data, error } = await supabase
    .from("patients")
    .select("last_4_cc")
    .eq("id", patient_id)
    .single();

  if (error || !data) return { valid: false };
  return { valid: data.last_4_cc === last_4_cc };
}
