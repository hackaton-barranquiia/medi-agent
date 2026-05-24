import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getTodayKpis } from "@/lib/kpis/today";

export async function GET() {
  const kpis = await getTodayKpis(supabaseServer());
  return NextResponse.json(kpis, {
    headers: { "cache-control": "no-store" },
  });
}
