import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Activity = {
  id: string;
  kind: "call" | "appointment";
  status: string;
  patient: string;
  at: string;
};

export async function GET() {
  const supabase = supabaseServer();

  const [callsRes, apptsRes] = await Promise.all([
    supabase
      .from("call_logs")
      .select(
        "id, started_at, ended_at, outcome, patients!inner(full_name)"
      )
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("appointments")
      .select(
        "id, status, slot_start, updated_at, prescriptions!inner(patients!inner(full_name))"
      )
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  const items: Activity[] = [];

  for (const c of callsRes.data ?? []) {
    const row = c as unknown as {
      id: string;
      started_at: string;
      ended_at: string | null;
      outcome: string | null;
      patients: { full_name: string } | { full_name: string }[] | null;
    };
    const p = Array.isArray(row.patients) ? row.patients[0] : row.patients;
    items.push({
      id: `c-${row.id}`,
      kind: "call",
      status: row.ended_at ? row.outcome ?? "completed" : "in_progress",
      patient: p?.full_name ?? "Paciente",
      at: row.ended_at ?? row.started_at,
    });
  }

  for (const a of apptsRes.data ?? []) {
    const row = a as unknown as {
      id: string;
      status: string;
      slot_start: string;
      updated_at: string | null;
      prescriptions:
        | { patients: { full_name: string } | { full_name: string }[] | null }
        | { patients: { full_name: string } | { full_name: string }[] | null }[]
        | null;
    };
    const rx = Array.isArray(row.prescriptions)
      ? row.prescriptions[0]
      : row.prescriptions;
    const p = Array.isArray(rx?.patients) ? rx?.patients[0] : rx?.patients;
    items.push({
      id: `a-${row.id}`,
      kind: "appointment",
      status: row.status,
      patient: p?.full_name ?? "Paciente",
      at: row.updated_at ?? row.slot_start,
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return NextResponse.json(items.slice(0, 12), {
    headers: { "cache-control": "no-store" },
  });
}
