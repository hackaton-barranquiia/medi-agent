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

  const rows = (data ?? []).flatMap((row) => {
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
        prescription_id: r.id,
        status: r.status,
        created_at: r.created_at,
        expires_at: null,
        patient: r.patients,
      },
    ];
  });

  const pri = (status: string) => (status === "expiring_soon" ? 0 : 1);
  const byPatient = new Map<
    string,
    {
      id: string;
      status: string;
      created_at: string;
      expires_at: null;
      patient: {
        id: string;
        full_name: string;
        phone_e164: string;
        last_4_cc: string | null;
        cc_number: string | null;
      };
      prescriptions_count: number;
      prescription_id: string;
    }
  >();

  for (const row of rows) {
    const patientId = row.patient.id;
    const existing = byPatient.get(patientId);

    if (!existing) {
      byPatient.set(patientId, {
        id: patientId,
        status: row.status,
        created_at: row.created_at,
        expires_at: row.expires_at,
        patient: row.patient,
        prescriptions_count: 1,
        prescription_id: row.prescription_id,
      });
      continue;
    }

    existing.prescriptions_count += 1;
    const shouldPromote =
      pri(row.status) < pri(existing.status) ||
      (pri(row.status) === pri(existing.status) &&
        new Date(row.created_at).getTime() >
          new Date(existing.created_at).getTime());

    if (shouldPromote) {
      existing.status = row.status;
      existing.created_at = row.created_at;
      existing.prescription_id = row.prescription_id;
    }
  }

  const items = Array.from(byPatient.values()).sort(
    (a, b) =>
      pri(a.status) - pri(b.status) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json(items, {
    headers: { "cache-control": "no-store" },
  });
}
