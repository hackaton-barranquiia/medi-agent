import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getTodayKpis } from "@/lib/kpis/today";

export async function GET() {
  const supabase = supabaseServer();
  const todayKpis = await getTodayKpis(supabase);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [activeCallsRes, criticalQueueRes, overdueRes] = await Promise.all([
    supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .is("ended_at", null)
      .gte("started_at", start.toISOString())
      .lt("started_at", end.toISOString()),
    supabase
      .from("prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "expiring_soon"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .lt("slot_start", new Date().toISOString()),
  ]);

  return NextResponse.json(
    {
      ...todayKpis,
      active_calls: activeCallsRes.count ?? 0,
      critical_queue: criticalQueueRes.count ?? 0,
      overdue_slots: overdueRes.count ?? 0,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
