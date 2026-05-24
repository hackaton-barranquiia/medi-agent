import { describe, expect, it } from "vitest";
import { markAppointmentReady } from "./mark-ready";

function mockSupabase(opts: {
  current?: { status: string } | null;
  updated?: { id: string; status: string } | null;
  error?: unknown;
}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: opts.current ?? null,
            error: opts.current ? null : { message: "not found" },
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: opts.updated ?? null,
              error: opts.error ?? null,
            }),
          }),
        }),
      }),
    }),
  } as never;
}

describe("markAppointmentReady", () => {
  it("transitions scheduled -> ready_for_pickup", async () => {
    const supabase = mockSupabase({
      current: { status: "scheduled" },
      updated: { id: "a1", status: "ready_for_pickup" },
    });
    const result = await markAppointmentReady(supabase, "a1");
    expect(result.status).toBe("ready_for_pickup");
  });

  it("rejects transition from delivered", async () => {
    const supabase = mockSupabase({ current: { status: "delivered" } });
    await expect(markAppointmentReady(supabase, "a1")).rejects.toThrow(
      "invalid_transition"
    );
  });

  it("throws when appointment not found", async () => {
    const supabase = mockSupabase({ current: null });
    await expect(markAppointmentReady(supabase, "missing")).rejects.toThrow(
      "appointment_not_found"
    );
  });
});
