import { describe, it, expect } from "vitest";
import { scheduleAppointmentLogic } from "./schedule-appointment";

function mockSupabase(insertedSink: Record<string, unknown>[]) {
  return {
    from: () => ({
      insert: (row: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            insertedSink.push(row);
            return { data: { ...row, id: "appt-1" }, error: null };
          },
        }),
      }),
    }),
  } as never;
}

describe("scheduleAppointmentLogic", () => {
  it("inserts an appointment with a 15-minute slot end", async () => {
    const inserted: Record<string, unknown>[] = [];
    const supabase = mockSupabase(inserted);

    const result = await scheduleAppointmentLogic(supabase, {
      prescription_id: "rx-1",
      slot_start: "2026-05-24T09:00:00-05:00",
      copay_cents: 580000,
      delivery_for_pending: false,
    });

    expect(result.appointment_id).toBe("appt-1");
    expect(String(inserted[0].slot_end)).toContain("T14:15:00.000Z");
  });

  it("persists delivery info when delivery_for_pending=true", async () => {
    const inserted: Record<string, unknown>[] = [];
    const supabase = mockSupabase(inserted);

    await scheduleAppointmentLogic(supabase, {
      prescription_id: "rx-2",
      slot_start: "2026-05-24T09:00:00-05:00",
      copay_cents: 580000,
      delivery_for_pending: true,
      delivery_date: "2026-05-28",
    });

    expect(inserted[0].delivery_for_pending).toBe(true);
    expect(inserted[0].delivery_date).toBe("2026-05-28");
  });

  it("defaults delivery flags to false/null when missing", async () => {
    const inserted: Record<string, unknown>[] = [];
    const supabase = mockSupabase(inserted);

    await scheduleAppointmentLogic(supabase, {
      prescription_id: "rx-3",
      slot_start: "2026-05-24T09:00:00-05:00",
      copay_cents: 580000,
    });

    expect(inserted[0].delivery_for_pending).toBe(false);
    expect(inserted[0].delivery_date).toBeNull();
  });

  it("throws when insert fails", async () => {
    const supabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: "fk violation" } }),
          }),
        }),
      }),
    } as never;

    await expect(
      scheduleAppointmentLogic(supabase, {
        prescription_id: "missing-rx",
        slot_start: "2026-05-24T09:00:00-05:00",
        copay_cents: 580000,
      })
    ).rejects.toThrow("fk violation");
  });
});
