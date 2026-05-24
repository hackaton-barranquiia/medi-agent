import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type OrderBody = {
  patient_id?: string;
  items?: Array<{ medication_id?: string; qty?: number }>;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as OrderBody;
  const patientId = body.patient_id;
  const items =
    body.items?.filter(
      (item): item is { medication_id: string; qty: number } =>
        Boolean(item?.medication_id) &&
        Number.isFinite(item?.qty) &&
        Number(item.qty) > 0
    ) ?? [];

  if (!patientId) {
    return NextResponse.json(
      { error: "patient_id is required" },
      { status: 400 }
    );
  }
  if (items.length === 0) {
    return NextResponse.json(
      { error: "At least one item is required" },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const medicationIds = Array.from(new Set(items.map((item) => item.medication_id)));
  const { data: meds, error: medError } = await supabase
    .from("medications")
    .select("id")
    .in("id", medicationIds);

  if (medError) {
    return NextResponse.json({ error: medError.message }, { status: 500 });
  }
  if ((meds ?? []).length !== medicationIds.length) {
    return NextResponse.json(
      { error: "Some medications were not found" },
      { status: 400 }
    );
  }

  const { data: prescription, error: prescriptionError } = await supabase
    .from("prescriptions")
    .insert({ patient_id: patientId, status: "ready" })
    .select("id, status, created_at")
    .single();

  if (prescriptionError || !prescription) {
    return NextResponse.json(
      { error: prescriptionError?.message ?? "Failed to create prescription" },
      { status: 500 }
    );
  }

  const rows = items.map((item) => ({
    prescription_id: prescription.id,
    medication_id: item.medication_id,
    qty: Number(item.qty),
    fulfilled: false,
  }));

  const { error: itemsError } = await supabase
    .from("prescription_items")
    .insert(rows);

  if (itemsError) {
    await supabase.from("prescriptions").delete().eq("id", prescription.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    prescription_id: prescription.id,
    status: prescription.status,
    created_at: prescription.created_at,
    items_count: rows.length,
  });
}
