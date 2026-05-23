import { describe, it, expect } from "vitest";
import { getPatientContextLogic } from "./get-patient-context";

type Item = {
  qty: number;
  medications: { name: string; presentation: string; stock_qty: number; reorder_eta_days: number };
};

function mockSupabase(opts: {
  patient?: { id: string; full_name: string; phone_e164: string } | null;
  prescriptionId?: string;
  items?: Item[];
}) {
  return {
    from: (table: string) => {
      if (table === "patients") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: opts.patient ?? null,
                error: opts.patient ? null : { message: "not found" },
              }),
            }),
          }),
        };
      }
      if (table === "prescriptions") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                limit: async () => ({
                  data: opts.prescriptionId ? [{ id: opts.prescriptionId, status: "ready" }] : [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "prescription_items") {
        return {
          select: () => ({
            eq: async () => ({ data: opts.items ?? [], error: null }),
          }),
        };
      }
      return {} as never;
    },
  } as never;
}

describe("getPatientContextLogic", () => {
  it("returns full context with patient + items + slots", async () => {
    const supabase = mockSupabase({
      patient: { id: "p1", full_name: "Luz Marina Patiño", phone_e164: "+573001112233" },
      prescriptionId: "rx1",
      items: [
        { qty: 1, medications: { name: "Losartán 50mg", presentation: "Caja x 30", stock_qty: 40, reorder_eta_days: 5 } },
      ],
    });

    const result = await getPatientContextLogic(supabase, "+573001112233");

    expect(result.patient.first_name).toBe("Luz Marina");
    expect(result.patient.honorific).toBe("Doña");
    expect(result.prescription.items.length).toBe(1);
    expect(result.prescription.all_available).toBe(true);
    expect(result.suggested_slots.length).toBe(3);
  });

  it("marks items as unavailable when stock_qty is below qty", async () => {
    const supabase = mockSupabase({
      patient: { id: "p1", full_name: "Luz Marina Patiño", phone_e164: "+573001112233" },
      prescriptionId: "rx1",
      items: [
        { qty: 1, medications: { name: "Losartán 50mg", presentation: "Caja x 30", stock_qty: 40, reorder_eta_days: 5 } },
        { qty: 1, medications: { name: "Atorvastatina 20mg", presentation: "Caja x 30", stock_qty: 0, reorder_eta_days: 4 } },
      ],
    });

    const result = await getPatientContextLogic(supabase, "+573001112233");

    expect(result.prescription.all_available).toBe(false);
    expect(result.prescription.available_count).toBe(1);
    expect(result.prescription.pending_count).toBe(1);
    expect(result.prescription.items[1].available).toBe(false);
  });

  it("throws patient_not_found when phone is unknown", async () => {
    const supabase = mockSupabase({ patient: null });
    await expect(getPatientContextLogic(supabase, "+999")).rejects.toThrow("patient_not_found");
  });

  it("guesses 'Don' for male first names", async () => {
    const supabase = mockSupabase({
      patient: { id: "p2", full_name: "José Antonio Restrepo", phone_e164: "+573004445566" },
      prescriptionId: "rx2",
      items: [
        { qty: 1, medications: { name: "Losartán 50mg", presentation: "Caja", stock_qty: 10, reorder_eta_days: 5 } },
      ],
    });

    const result = await getPatientContextLogic(supabase, "+573004445566");
    expect(result.patient.honorific).toBe("Don");
  });
});
