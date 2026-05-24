# MediAgent MVP Closeout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the operational loop of the MVP — scheduled appointments can be marked `ready_for_pickup` and `delivered` by the dispenser operator, with realtime visibility and three top-level KPIs on the dashboard. Closes the gap between current state (call → appointment in DB) and the MVP defined in `docs/mvp-plataformas-servicio.md`.

**Architecture:** Add a 3-stage appointment lifecycle (`scheduled` → `ready_for_pickup` → `delivered`) enforced by two new POST endpoints. The dashboard subscribes to Postgres UPDATE events too (not just INSERT) so any operator action propagates live. A small KPI strip aggregates three counts from existing tables; no new tables needed.

**Tech Stack:** Same as the rest of the project — Next.js 15 App Router + TypeScript + Supabase (Postgres + Realtime) + shadcn/ui + Tailwind + Vitest. No new external services.

---

## Scope decisions (closing the 7 validation questions from the MVP doc)

| # | Question | Decision for this MVP |
|---|---|---|
| 1 | Channel | **Pickup only.** Home delivery flag stays in DB but no post-call flow is built. |
| 2 | Segmentation rule | **Fixed in backend:** `expiring_soon` first, then `ready` by `created_at desc`. No admin panel. |
| 3 | SLA | **Communicated in copy** (`<24h` called, `<48h` scheduled). Not programmatically enforced. |
| 4 | Appointment block | **Fixed 15-min slots** (already implemented in `schedule-appointment.ts`). |
| 5 | Success metrics (KPIs) | Three counters in dashboard: **llamadas hoy**, **citas hoy**, **entregas hoy**. |
| 6 | Operator config panel | **Out of scope.** Backend rules fixed for MVP. |
| 7 | Compliance | **Existing `call_logs` table covers traceability.** Outcome already persisted via webhook. |

---

## Current state (verifiable before starting)

✅ Backend tools (`verify-cc`, `get-patient-context`, `schedule-appointment`) operational against Supabase
✅ `/api/calls/start`, `/api/vapi/webhook`, `/api/health` deployed on Railway
✅ Dashboard with `PendingPrescriptions`, `LiveAppointments`, `StockStatus`
✅ Vapi assistant configured, voice agent authenticates and schedules
❌ No state transitions after `scheduled` — appointment stays "Agendada" forever
❌ No KPIs visible on dashboard
❌ Realtime only catches INSERTs, not UPDATEs (operator state changes invisible to other browsers)
❌ "Vence pronto" rows not visually prioritized in pending list

---

## Streams and timeline

| Stream | Branch | Owner |
|---|---|---|
| Backend | `main` direct | **Miguel** |
| Frontend | `frontend` | **Jose** |
| Voice | `voice` | **Wilson** — light touch only (prompt update if needed) |

| Hour | Activity |
|---|---|
| 0–1 | Phase 1 — Lifecycle backend (Miguel) + sync of seeds |
| 1–3 | Phase 2 — Lifecycle UI (Jose) in parallel with Phase 3 — KPIs (Miguel/Jose) |
| 3 | ✅ Checkpoint A — full lifecycle works in dashboard |
| 3–5 | Phase 4 — Polish, prioritization, prompt tune (all) |
| 5 | ✅ Checkpoint B — FREEZE |
| 5–6 | Phase 5 — Rehearsal + video backup |

---

# Phase 1 — Lifecycle backend (Miguel, `main`)

## Task M.1 — Extend `appointments.status` with allowed values

**Files:**
- Create: `supabase/migrations/0002_appointment_lifecycle.sql`

**Step 1: Write migration**

```sql
-- 0002_appointment_lifecycle.sql
-- The status column is already text; this migration enforces allowed values
-- and adds an index used by KPI queries.

alter table appointments
  add constraint appointments_status_check
  check (status in ('scheduled', 'ready_for_pickup', 'delivered', 'no_show', 'cancelled'));

create index if not exists appointments_status_idx on appointments (status);
create index if not exists appointments_slot_start_idx on appointments (slot_start);
```

**Step 2: Apply in Supabase SQL editor → Run.**

Expected: "Success. No rows returned."

**Step 3: Verify the constraint blocks an invalid value**

In SQL editor:
```sql
update appointments set status = 'bogus' where id = (select id from appointments limit 1);
```

Expected: error `new row for relation "appointments" violates check constraint "appointments_status_check"`.

**Step 4: Commit**

```bash
git add supabase/migrations/0002_appointment_lifecycle.sql
git commit -m "feat(backend): enforce appointment status enum and add KPI indexes"
git push
```

---

## Task M.2 — `mark-ready` endpoint with TDD

**Files:**
- Create: `src/lib/lifecycle/mark-ready.ts`
- Create: `src/lib/lifecycle/mark-ready.test.ts`
- Create: `src/app/api/appointments/[id]/mark-ready/route.ts`

**Step 1: Failing test**

`src/lib/lifecycle/mark-ready.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { markAppointmentReady } from "./mark-ready";

function mockSupabase(opts: { current?: { status: string } | null; updated?: { id: string; status: string } | null; error?: unknown }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: opts.current ?? null, error: opts.current ? null : { message: "not found" } }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: opts.updated ?? null, error: opts.error ?? null }),
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
    await expect(markAppointmentReady(supabase, "a1")).rejects.toThrow("invalid_transition");
  });

  it("throws when appointment not found", async () => {
    const supabase = mockSupabase({ current: null });
    await expect(markAppointmentReady(supabase, "missing")).rejects.toThrow("appointment_not_found");
  });
});
```

**Step 2: Run, expect failure**

```bash
npm test src/lib/lifecycle/mark-ready.test.ts
```

Expected: "Cannot find module './mark-ready'".

**Step 3: Implement**

`src/lib/lifecycle/mark-ready.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_FROM = ["scheduled"];

export async function markAppointmentReady(supabase: SupabaseClient, id: string) {
  const { data: current, error: fetchError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("appointment_not_found");
  if (!VALID_FROM.includes(current.status)) throw new Error("invalid_transition");

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "ready_for_pickup" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "update_failed");
  return data;
}
```

**Step 4: Verify pass**

```bash
npm test src/lib/lifecycle/mark-ready.test.ts
```

Expected: 3 passing.

**Step 5: Wire route handler**

`src/app/api/appointments/[id]/mark-ready/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { markAppointmentReady } from "@/lib/lifecycle/mark-ready";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await markAppointmentReady(supabaseServer(), id);
    return NextResponse.json({ ok: true, appointment: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    const status = message === "appointment_not_found" ? 404 : message === "invalid_transition" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 6: Smoke test against Railway**

After `git push`, wait for Railway redeploy. Then:

```bash
APPT_ID=$(curl -s "https://exmfigfxzqpibrvensak.supabase.co/rest/v1/appointments?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[0].id')

curl -s -X POST "https://turnos-agent-production.up.railway.app/api/appointments/$APPT_ID/mark-ready"
```

Expected: `{"ok":true,"appointment":{"id":"...","status":"ready_for_pickup",...}}`

**Step 7: Commit**

```bash
git add src/lib/lifecycle/ src/app/api/appointments/
git commit -m "feat(backend): add mark-ready endpoint with state machine validation"
git push
```

---

## Task M.3 — `mark-delivered` endpoint with TDD

**Files:**
- Create: `src/lib/lifecycle/mark-delivered.ts`
- Create: `src/lib/lifecycle/mark-delivered.test.ts`
- Create: `src/app/api/appointments/[id]/mark-delivered/route.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { markAppointmentDelivered } from "./mark-delivered";

function mockSupabase(opts: { current?: { status: string } | null; updated?: unknown; error?: unknown }) {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: opts.current ?? null, error: opts.current ? null : { message: "not found" } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: opts.updated ?? null, error: opts.error ?? null }) }) }) }),
    }),
  } as never;
}

describe("markAppointmentDelivered", () => {
  it("transitions ready_for_pickup -> delivered", async () => {
    const supabase = mockSupabase({
      current: { status: "ready_for_pickup" },
      updated: { id: "a1", status: "delivered" },
    });
    const result = await markAppointmentDelivered(supabase, "a1");
    expect(result.status).toBe("delivered");
  });

  it("rejects skipping ready_for_pickup", async () => {
    const supabase = mockSupabase({ current: { status: "scheduled" } });
    await expect(markAppointmentDelivered(supabase, "a1")).rejects.toThrow("invalid_transition");
  });
});
```

**Step 2: Run, expect failure.**

**Step 3: Implement**

`src/lib/lifecycle/mark-delivered.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_FROM = ["ready_for_pickup"];

export async function markAppointmentDelivered(supabase: SupabaseClient, id: string) {
  const { data: current, error: fetchError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("appointment_not_found");
  if (!VALID_FROM.includes(current.status)) throw new Error("invalid_transition");

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "delivered" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "update_failed");
  return data;
}
```

**Step 4: Run, expect pass. Wire route handler.**

`src/app/api/appointments/[id]/mark-delivered/route.ts` — mirror of mark-ready route, swapping the function.

**Step 5: Commit**

```bash
git add src/lib/lifecycle/mark-delivered.ts src/lib/lifecycle/mark-delivered.test.ts src/app/api/appointments/[id]/mark-delivered/route.ts
git commit -m "feat(backend): add mark-delivered endpoint completing appointment lifecycle"
git push
```

---

## Task M.4 — KPI aggregation endpoint

**Files:**
- Create: `src/lib/kpis/today.ts`
- Create: `src/lib/kpis/today.test.ts`
- Create: `src/app/api/dashboard/kpis/route.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { getTodayKpis } from "./today";

function mockSupabase(counts: { calls?: number; appts?: number; delivered?: number }) {
  return {
    from: (table: string) => ({
      select: (_cols: string, opts?: { count?: string; head?: boolean }) => ({
        gte: () => ({
          lt: () => ({
            count: opts?.count === "exact" ? null : undefined,
            data: null,
            error: null,
            then: undefined,
          }),
          // simulate Postgrest's terminal count promise
          ...(opts?.count === "exact" && {
            then: undefined,
          }),
        }),
      }),
    }),
  } as never;
}

describe("getTodayKpis", () => {
  it("returns three counters using parallel counts", async () => {
    // Stub supabase that returns counts based on table name
    const supabase = {
      from: (table: string) => ({
        select: (_cols: string, _opts?: unknown) => ({
          gte: () => ({
            lt: async () => ({
              count:
                table === "call_logs" ? 7 :
                table === "appointments" ? 4 : 0,
              error: null,
            }),
          }),
        }),
      }),
    } as never;

    // For delivered we need a different branch — implementation will use .eq
    // Mock will be refined in impl-time.

    const result = await getTodayKpis(supabase);
    expect(result.calls_today).toBe(7);
    expect(result.appointments_today).toBe(4);
    expect(typeof result.deliveries_today).toBe("number");
  });
});
```

> Note: the mock above is intentionally rough. Refine in step 3 as the implementation requires.

**Step 2: Run, expect failure.**

**Step 3: Implement**

`src/lib/kpis/today.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getTodayKpis(supabase: SupabaseClient) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const startIso = todayStart.toISOString();
  const endIso = todayEnd.toISOString();

  const [callsRes, apptsRes, deliveriesRes] = await Promise.all([
    supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .gte("started_at", startIso)
      .lt("started_at", endIso),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("slot_start", startIso)
      .lt("slot_start", endIso),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered")
      .gte("slot_start", startIso)
      .lt("slot_start", endIso),
  ]);

  return {
    calls_today: callsRes.count ?? 0,
    appointments_today: apptsRes.count ?? 0,
    deliveries_today: deliveriesRes.count ?? 0,
  };
}
```

> Note: the head-count pattern in Supabase returns count without rows. Easier to verify with a thin integration test against the real DB at step 6.

**Step 4: Adjust test to match (simplify with a single test that the result shape is correct).**

Replace test body with:

```ts
import { describe, it, expect, vi } from "vitest";
import { getTodayKpis } from "./today";

describe("getTodayKpis", () => {
  it("returns the three counters in shape", async () => {
    const stubBuilder = () => ({
      select: () => ({ gte: () => ({ lt: async () => ({ count: 3, error: null }) }), eq: () => ({ gte: () => ({ lt: async () => ({ count: 1, error: null }) }) }) }),
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
```

**Step 5: Run, expect pass.**

**Step 6: Wire route**

`src/app/api/dashboard/kpis/route.ts`:

```ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getTodayKpis } from "@/lib/kpis/today";

export async function GET() {
  const kpis = await getTodayKpis(supabaseServer());
  return NextResponse.json(kpis, {
    headers: { "cache-control": "no-store" },
  });
}
```

**Step 7: Smoke test on Railway**

```bash
curl -s https://turnos-agent-production.up.railway.app/api/dashboard/kpis
```

Expected: `{"calls_today":N,"appointments_today":M,"deliveries_today":K}`.

**Step 8: Commit**

```bash
git add src/lib/kpis/ src/app/api/dashboard/
git commit -m "feat(backend): add today KPIs endpoint with parallel counts"
git push
```

---

# Phase 2 — Lifecycle UI (Jose, `frontend`)

> **Sync first:** rebase `frontend` on `main` to get `mark-ready`, `mark-delivered`, KPIs available.
>
> ```bash
> git fetch origin && git checkout frontend && git rebase origin/main && git push --force-with-lease
> ```

## Task J.1 — Subscribe to UPDATEs in `live-appointments`

**Files:**
- Modify: `src/components/dashboard/live-appointments.tsx`

**Step 1: Replace the `INSERT`-only subscription with an `*` subscription**

Find the existing `.on("postgres_changes", { event: "INSERT", ... })` and replace with two handlers (insert + update) — or use `event: "*"` and switch on `eventType`.

Change:

```ts
const channel = supabase
  .channel("appointments-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "appointments" },
    (payload) => {
      if (payload.eventType === "INSERT") {
        setAppointments((curr) => [...curr, payload.new as Appointment]);
      } else if (payload.eventType === "UPDATE") {
        setAppointments((curr) =>
          curr.map((a) => (a.id === (payload.new as Appointment).id ? (payload.new as Appointment) : a))
        );
      }
    }
  )
  .subscribe();
```

**Step 2: Verify locally**

```bash
npm run dev
```

Open dashboard. In another tab, run an UPDATE on appointments via SQL editor:

```sql
update appointments set status = 'ready_for_pickup' where id = (select id from appointments limit 1);
```

Expected: badge updates from "Agendada" to the new status without refreshing.

**Step 3: Commit**

```bash
git add src/components/dashboard/live-appointments.tsx
git commit -m "feat(frontend): subscribe to UPDATE events on appointments"
git push
```

---

## Task J.2 — Lifecycle buttons on each appointment row

**Files:**
- Modify: `src/components/dashboard/live-appointments.tsx`
- Create: `src/components/dashboard/appointment-actions.tsx`

**Step 1: Build the actions component**

`src/components/dashboard/appointment-actions.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = { appointmentId: string; status: string };

export function AppointmentActions({ appointmentId, status }: Props) {
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const call = async (action: "mark-ready" | "mark-delivered") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/${action}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "request_failed");
      }
      const labels: Record<string, string> = {
        "mark-ready": "Marcado como alistado",
        "mark-delivered": "Entrega registrada",
      };
      toast.success(labels[action]);
      startTransition(() => {});
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "scheduled") {
    return (
      <Button size="sm" variant="outline" onClick={() => call("mark-ready")} disabled={loading}>
        {loading ? "..." : "Marcar alistado"}
      </Button>
    );
  }
  if (status === "ready_for_pickup") {
    return (
      <Button size="sm" onClick={() => call("mark-delivered")} disabled={loading}>
        {loading ? "..." : "Marcar entregado"}
      </Button>
    );
  }
  return null;
}
```

**Step 2: Wire into live-appointments**

In `live-appointments.tsx`, inside the map, after the copay paragraph:

```tsx
import { AppointmentActions } from "./appointment-actions";

// inside the row:
<div className="mt-2">
  <AppointmentActions appointmentId={appt.id} status={appt.status} />
</div>
```

**Step 3: Verify locally**

Click "Marcar alistado" → toast appears, badge updates to `ready_for_pickup` (via realtime). Click "Marcar entregado" → updates to `delivered`.

**Step 4: Commit**

```bash
git add src/components/dashboard/appointment-actions.tsx src/components/dashboard/live-appointments.tsx
git commit -m "feat(frontend): add lifecycle action buttons to appointment rows"
git push
```

---

## Task J.3 — Color-coded status badges

**Files:**
- Modify: `src/components/dashboard/live-appointments.tsx`

**Step 1: Add helper for status presentation**

Above the component:

```tsx
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendada", className: "border-[#0f62fe] text-[#0f62fe]" },
  ready_for_pickup: { label: "Alistada", className: "border-[#8a3ffc] text-[#8a3ffc]" },
  delivered: { label: "Entregada", className: "border-[#198038] text-[#198038]" },
  no_show: { label: "No asistió", className: "border-[#525252] text-[#525252]" },
  cancelled: { label: "Cancelada", className: "border-[#da1e28] text-[#da1e28]" },
};
```

Replace the existing badge rendering with:

```tsx
const meta = STATUS_LABELS[appt.status] ?? { label: appt.status, className: "" };
// ...
<Badge className={`rounded-none border bg-transparent px-2 py-0.5 text-[11px] ${meta.className}`}>
  {meta.label}
</Badge>
```

**Step 2: Verify color shifts as the status changes.**

**Step 3: Commit**

```bash
git add src/components/dashboard/live-appointments.tsx
git commit -m "feat(frontend): color-coded status badges with Spanish labels"
git push
```

---

# Phase 3 — KPIs on the dashboard (Jose, `frontend`)

## Task J.4 — KPI strip component

**Files:**
- Create: `src/components/dashboard/kpi-strip.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Build the strip**

`src/components/dashboard/kpi-strip.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type Kpis = { calls_today: number; appointments_today: number; deliveries_today: number };

export function KpiStrip() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch("/api/dashboard/kpis", { cache: "no-store" });
        if (res.ok) setKpis(await res.json());
      } catch {
        // intentionally swallow — KPIs are best-effort
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  const cells = [
    { label: "Llamadas hoy", value: kpis?.calls_today ?? "—" },
    { label: "Citas hoy", value: kpis?.appointments_today ?? "—" },
    { label: "Entregas hoy", value: kpis?.deliveries_today ?? "—" },
  ];

  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden border border-[#e0e0e0] bg-[#e0e0e0]">
      {cells.map((c) => (
        <div key={c.label} className="bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-[#525252]">{c.label}</p>
          <p className="text-2xl font-light text-[#161616]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Insert into page above the cards**

In `src/app/page.tsx`, after the intro `<div>` and before the `<div className="grid">`:

```tsx
import { KpiStrip } from "@/components/dashboard/kpi-strip";

// ...
<div className="mb-6">
  <KpiStrip />
</div>
```

**Step 3: Verify locally**

Run dev, see the three KPI cells. Trigger a call via "Llamar" — within 5s the `Llamadas hoy` counter increments.

**Step 4: Commit**

```bash
git add src/components/dashboard/kpi-strip.tsx src/app/page.tsx
git commit -m "feat(frontend): add KPI strip with polling every 5s"
git push
```

---

## Task J.5 — Prioritize `expiring_soon` in PendingPrescriptions

**Files:**
- Modify: `src/components/dashboard/pending-prescriptions.tsx` (or `-list.tsx` if that's the active one)

**Step 1: Find the Supabase query for pending prescriptions and reorder**

Replace the existing `.order(...)` with:

```ts
.order("status", { ascending: false })       // 'expiring_soon' > 'ready' alphabetically? No — use a CASE.
```

Postgres-portable workaround using a derived column: change to two queries or sort client-side.

Simpler — sort client-side after fetch:

```ts
const ordered = (data ?? []).sort((a, b) => {
  const priority = (status: string) => (status === "expiring_soon" ? 0 : 1);
  return priority(a.status) - priority(b.status) ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});
```

**Step 2: Add visual indicator for `expiring_soon`**

Show a red badge "Vence pronto" on those rows:

```tsx
{rx.status === "expiring_soon" && (
  <Badge className="rounded-none border border-[#da1e28] bg-transparent px-2 py-0.5 text-[11px] text-[#da1e28]">
    Vence pronto
  </Badge>
)}
```

**Step 3: Verify with seed data — Carmen Rosa should appear at the top with the red badge.**

**Step 4: Commit**

```bash
git add src/components/dashboard/pending-prescriptions.tsx
git commit -m "feat(frontend): prioritize and badge expiring-soon prescriptions"
git push
```

---

# Phase 4 — Polish and voice integration (all)

## Task P.1 — Update prescription status when appointment delivered (Miguel, `main`)

**Files:**
- Modify: `src/lib/lifecycle/mark-delivered.ts`

**Why:** When an appointment is delivered, the parent prescription should move to `picked_up` so it disappears from the pending list. Currently it would still show.

**Step 1: After the update of appointments, also update the parent prescription**

```ts
const { data, error } = await supabase
  .from("appointments")
  .update({ status: "delivered" })
  .eq("id", id)
  .select("id, status, prescription_id")
  .single();

if (error || !data) throw new Error(error?.message ?? "update_failed");

// Mark parent prescription as picked_up so it leaves the pending list
await supabase
  .from("prescriptions")
  .update({ status: "picked_up" })
  .eq("id", data.prescription_id);

return data;
```

**Step 2: Add a test for the side effect**

```ts
it("marks the parent prescription as picked_up", async () => {
  const updates: Record<string, unknown>[] = [];
  const supabase = {
    from: (table: string) => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { status: "ready_for_pickup" }, error: null }) }) }),
      update: (row: Record<string, unknown>) => {
        updates.push({ table, ...row });
        return { eq: () => ({ select: () => ({ single: async () => ({ data: { id: "a1", status: "delivered", prescription_id: "rx1" }, error: null }) }) }), eq2: undefined };
      },
    }),
  } as never;
  // workaround: supabase mock returning .eq chain
  // refine if needed
  await markAppointmentDelivered(supabase, "a1");
  expect(updates.some((u) => u.table === "prescriptions" && u.status === "picked_up")).toBe(true);
});
```

> Note: if mock proves brittle, run only the integration smoke (full curl + DB verify) instead. For hackathon scope a brittle mock is acceptable; the curl-level smoke is the source of truth.

**Step 3: Run tests + smoke. Commit.**

```bash
git commit -am "feat(backend): mark parent prescription as picked_up on delivery"
git push
```

---

## Task P.2 — Voice agent: confirm pickup wording (Wilson, `voice`)

**Files:** Vapi dashboard system prompt + `vapi/prompts/system-prompt-v1.md`.

**Step 1:** Append to the closing block of the prompt:

```
CIERRE:
Después de confirmar el turno, di algo como:
- "Doña [nombre], cuando llegue al dispensario, preséntese en el módulo de turnos y le entregarán su medicamento sin fila."
- "Su turno es a las [hora]. Por favor llegue 10 minutos antes."
```

**Step 2: Test call. Iterate. Commit prompt md.**

```bash
git commit -am "fix(voice): clarify pickup procedure in closing message"
git push
```

---

## Task P.3 — Seed update with realistic team/jury data (Miguel, `main`)

**Files:**
- Modify: `supabase/seed.sql`
- Run additional SQL in Supabase editor for live update.

**Step 1:** Update the 3 patient rows' `phone_e164` with real numbers (your phones + jury phone). DON'T commit real numbers to the repo — use the SQL editor directly:

```sql
update patients set phone_e164 = '+57<real>' where last_4_cc = '4729';
-- etc.
```

**Step 2:** No commit needed (data only). Just confirm via curl that get_patient_context returns the right patient when called with the real number.

---

# ✅ Checkpoint A — Hour 3

Verify all together:

- [ ] `curl POST /api/appointments/<id>/mark-ready` returns 200 and updates DB
- [ ] `curl POST /api/appointments/<id>/mark-delivered` returns 200, DB row delivered, parent prescription picked_up
- [ ] Dashboard shows live status changes when SQL editor updates a row
- [ ] Click "Marcar alistado" then "Marcar entregado" works end-to-end with toasts
- [ ] KPI strip shows 3 numbers, updates within 5s
- [ ] `expiring_soon` row appears at the top of pending list with red badge

If any red → stop new work, fix, then proceed.

---

# Phase 5 — Demo polish (Hour 3–5)

## Task R.1 — End-to-end rehearsal flow with new states (all)

**Sequence:**
1. Operator clicks "Llamar" → call rings
2. Agent authenticates with cédula
3. Agent schedules appointment
4. Appointment appears in dashboard as "Agendada"
5. Operator clicks "Marcar alistado" → status changes live across all open tabs
6. Operator clicks "Marcar entregado" → status changes, KPI `Entregas hoy` increments, prescription disappears from pending list

Practice 3 times. Note awkwardness.

## Task R.2 — Empty states and copy polish (Jose)

- "Sin citas todavía" → "Aún no hay turnos agendados — esperando llamadas"
- "Sin prescripciones pendientes" → "No hay fórmulas pendientes por contactar"
- Tooltip on KPI cells explaining what each counts

Commit:
```bash
git commit -am "polish(frontend): empty-state copy and KPI tooltips"
git push
```

## Task R.3 — Pre-warm script update (Miguel)

**Files:**
- Create or modify: `scripts/warmup.sh`

Add the new endpoints to the warmup script:

```bash
#!/bin/bash
URL="${NEXT_PUBLIC_APP_URL:-https://turnos-agent-production.up.railway.app}"
while true; do
  curl -s "$URL/api/health" > /dev/null
  curl -s "$URL/api/dashboard/kpis" > /dev/null
  curl -s -X POST "$URL/api/tools/verify-cc" -H "content-type: application/json" -d '{"message":{"toolCalls":[{"id":"w","function":{"arguments":{"patient_id":"11111111-1111-1111-1111-111111111111","last_4_cc":"0000"}}}]}}' > /dev/null
  sleep 240
done
```

Commit and run before the demo.

## Task R.4 — Record demo video backup (all)

Record a 3-minute capture of the full happy-path flow including the new lifecycle. Save the link in a shared note. This is the safety net.

---

# ✅ Checkpoint B — Hour 5 — FEATURE FREEZE

No more new features. Only bugfix commits after this point.

# Phase 6 — Final rehearsal (Hour 5–6)

## Task R.5 — Three full rehearsals at speed

Time each. Target ≤ 3 minutes for the live portion. Confirm warmup is running before each rehearsal.

## Task R.6 — Final deploy lock

- Last `git push` at least 10 minutes before the jury session
- Confirm Railway shows latest commit deployed
- Confirm KPIs strip works on the production URL
- Phones on, ringer up, dashboard on projector

---

# Appendix — Working agreements (unchanged from prior plan)

- Branches: Miguel `main`, Jose `frontend`, Wilson `voice`
- Merges to `main` at every checkpoint
- Commits in English, **NEVER** include `Co-Authored-By`
- Voice channel open at all times
- Announce package.json / layout.tsx / shared file edits before pushing

---

*Plan generated 2026-05-24 · MediAgent MVP closeout sprint*
