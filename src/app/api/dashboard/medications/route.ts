import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  let query = supabase
    .from("medications")
    .select("id, name, presentation, stock_qty")
    .order("name", { ascending: true })
    .limit(150);

  if (search.length >= 2) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { "cache-control": "no-store" },
  });
}
