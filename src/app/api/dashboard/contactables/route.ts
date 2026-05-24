import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("prescriptions")
    .select(
      `
      id, status, created_at,
      patients(id, full_name, phone_e164, last_4_cc, cc_number)
    `
    )
    .in("status", ["ready", "expiring_soon", "picked_up"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).flatMap((row) => {
    const r = row as unknown as {
      id: string;
      status: string;
      created_at: string;
      patients:
        | {
            id: string;
            full_name: string;
            phone_e164: string;
            last_4_cc: string | null;
            cc_number: string | null;
          }
        | null;
    };
    if (!r.patients) return [];
    return [
      {
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        expires_at: null,
        patient: r.patients,
      },
    ];
  });

  items.sort((a, b) => {
    const pri = (s: string) => (s === "expiring_soon" ? 0 : 1);
    return (
      pri(a.status) - pri(b.status) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return NextResponse.json(items, {
    headers: { "cache-control": "no-store" },
  });
}
