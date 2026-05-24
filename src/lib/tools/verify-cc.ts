import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyCcLogic(
  supabase: SupabaseClient,
  identifier: { patient_id?: string; phone_e164?: string },
  last_4_cc: string
): Promise<{ valid: boolean }> {
  const query = supabase.from("patients").select("last_4_cc, id");

  const { data, error } = identifier.phone_e164
    ? await query.eq("phone_e164", identifier.phone_e164).single()
    : await query.eq("id", identifier.patient_id!).single();

  if (error || !data) return { valid: false };
  return { valid: data.last_4_cc === last_4_cc };
}
