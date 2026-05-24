import { describe, expect, it } from "vitest";
import { markAppointmentDelivered } from "./mark-delivered";

function mockSupabase(opts: {
  current?: { status: string } | null;
  updated?: { id: string; status: string; prescription_id: string } | null;
  error?: unknown;
}) {
  const updates: Array<{ table: string; row: Record<string, unknown> }> = [];
  const supabase = {
    from: (table: string) => {
      if (table === "appointments") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: opts.current ?? null,
                error: opts.current ? null : { message: "not found" },
              }),
            }),
          }),
          update: (row: Record<string, unknown>) => {
            updates.push({ table, row });
            return {
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: opts.updated ?? null,
                    error: opts.error ?? null,
                  }),
                }),
              }),
            };
          },
        };
      }

      return {
        update: (row: Record<string, unknown>) => {
          updates.push({ table, row });
          return {
            eq: async () => ({ error: null }),
          };
        },
      };
    },
  } as never;

  return { supabase, updates };
}

describe("markAppointmentDelivered", () => {
  it("transitions ready_for_pickup -> delivered", async () => {
    const { supabase } = mockSupabase({
      current: { status: "ready_for_pickup" },
      updated: { id: "a1", status: "delivered", prescription_id: "rx1" },
    });
    const result = await markAppointmentDelivered(supabase, "a1");
    expect(result.status).toBe("delivered");
  });

  it("rejects skipping ready_for_pickup", async () => {
    const { supabase } = mockSupabase({ current: { status: "scheduled" } });
    await expect(markAppointmentDelivered(supabase, "a1")).rejects.toThrow(
      "invalid_transition"
    );
  });

  it("marks the parent prescription as picked_up", async () => {
    const { supabase, updates } = mockSupabase({
      current: { status: "ready_for_pickup" },
      updated: { id: "a1", status: "delivered", prescription_id: "rx1" },
    });

    await markAppointmentDelivered(supabase, "a1");

    expect(
      updates.some(
        (u) => u.table === "prescriptions" && u.row.status === "picked_up"
      )
    ).toBe(true);
  });
});
