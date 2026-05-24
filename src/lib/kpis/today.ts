import type { SupabaseClient } from "@supabase/supabase-js";

export async function getTodayKpis(supabase: SupabaseClient) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const startIso = todayStart.toISOString();
  const endIso = todayEnd.toISOString();

  const [callsRes, apptsRes, deliveriesRes] = await Promise.all([
    supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .gte("started_at", startIso)
      .lt("started_at", endIso),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("slot_start", startIso)
      .lt("slot_start", endIso),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered")
      .gte("slot_start", startIso)
      .lt("slot_start", endIso),
  ]);

  return {
    calls_today: callsRes.count ?? 0,
    appointments_today: apptsRes.count ?? 0,
    deliveries_today: deliveriesRes.count ?? 0,
  };
}
