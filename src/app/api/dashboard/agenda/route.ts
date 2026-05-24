import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  const start = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, status, slot_start, copay_cents, delivery_for_pending, delivery_date,
       prescriptions!inner(
         id,
         patients!inner(id, full_name, phone_e164),
         prescription_items(qty, medications(name))
       )`
    )
    .gte("slot_start", start.toISOString())
    .lt("slot_start", end.toISOString())
    .order("slot_start", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((r) => {
    const row = r as unknown as {
      id: string;
      status: string;
      slot_start: string;
      copay_cents: number;
      delivery_for_pending: boolean;
      delivery_date: string | null;
      prescriptions: {
        id: string;
        patients:
          | { id: string; full_name: string; phone_e164: string }
          | { id: string; full_name: string; phone_e164: string }[]
          | null;
        prescription_items:
          | { qty: number; medications: { name: string } | { name: string }[] | null }[]
          | null;
      } | Array<{
        id: string;
        patients:
          | { id: string; full_name: string; phone_e164: string }
          | { id: string; full_name: string; phone_e164: string }[]
          | null;
        prescription_items:
          | { qty: number; medications: { name: string } | { name: string }[] | null }[]
          | null;
      }>;
    };
    const rx = Array.isArray(row.prescriptions)
      ? row.prescriptions[0]
      : row.prescriptions;
    const patient = Array.isArray(rx?.patients) ? rx?.patients[0] : rx?.patients;
    const meds =
      rx?.prescription_items?.map((pi) => {
        const m = Array.isArray(pi.medications) ? pi.medications[0] : pi.medications;
        return { qty: pi.qty, name: m?.name ?? "—" };
      }) ?? [];
    return {
      id: row.id,
      status: row.status,
      slot_start: row.slot_start,
      copay_cents: row.copay_cents,
      delivery_for_pending: row.delivery_for_pending,
      delivery_date: row.delivery_date,
      patient: patient ?? { id: "", full_name: "Paciente", phone_e164: "" },
      medications: meds,
    };
  });

  return NextResponse.json(items, {
    headers: { "cache-control": "no-store" },
  });
}
