import { describe, expect, it, vi } from "vitest";
import { getTodayKpis } from "./today";

describe("getTodayKpis", () => {
  it("returns the three counters in shape", async () => {
    const stubBuilder = () => ({
      select: () => ({
        gte: () => ({
          lt: async () => ({ count: 3, error: null }),
        }),
        eq: () => ({
          gte: () => ({
            lt: async () => ({ count: 1, error: null }),
          }),
        }),
      }),
    });
    const supabase = { from: vi.fn(stubBuilder) } as never;

    const result = await getTodayKpis(supabase);
    expect(result).toEqual({
      calls_today: 3,
      appointments_today: 3,
      deliveries_today: 1,
    });
  });
});
