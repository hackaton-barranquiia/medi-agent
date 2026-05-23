import { describe, it, expect } from "vitest";
import { verifyCcLogic } from "./verify-cc";

function mockSupabase(data: { last_4_cc: string } | null, error: unknown = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data, error }) }),
      }),
    }),
  } as never;
}

describe("verifyCcLogic", () => {
  it("returns valid=true when last_4_cc matches", async () => {
    const supabase = mockSupabase({ last_4_cc: "4729" });
    const result = await verifyCcLogic(supabase, "patient-id", "4729");
    expect(result.valid).toBe(true);
  });

  it("returns valid=false when codes do not match", async () => {
    const supabase = mockSupabase({ last_4_cc: "4729" });
    const result = await verifyCcLogic(supabase, "patient-id", "9999");
    expect(result.valid).toBe(false);
  });

  it("returns valid=false when patient is not found", async () => {
    const supabase = mockSupabase(null, { message: "not found" });
    const result = await verifyCcLogic(supabase, "missing-id", "0000");
    expect(result.valid).toBe(false);
  });
});
