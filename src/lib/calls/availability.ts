import type { SupabaseClient } from "@supabase/supabase-js";

export const TIMES_OF_DAY: { h: number; m: number; label: string }[] = [
  { h: 9, m: 0, label: "09:00" },
  { h: 10, m: 30, label: "10:30" },
  { h: 14, m: 0, label: "14:00" },
];
export const HORIZON_DAYS = 7;

const TZ = "America/Bogota";
const OFFSET = "-05:00";

const HOUR_WORDS: Record<number, string> = {
  1: "una",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
};

export type Slot = { iso: string; spoken: string; date: string };

export function bogotaDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function bogotaDateStringPlusDays(days: number, from: Date = new Date()): string {
  const base = bogotaDateString(from);
  const utcMidnight = new Date(`${base}T00:00:00Z`);
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + days);
  return utcMidnight.toISOString().slice(0, 10);
}

export function bogotaWeekdaySpanish(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    weekday: "long",
  }).format(d);
}

function buildIso(dateStr: string, h: number, m: number): string {
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dateStr}T${hh}:${mm}:00${OFFSET}`;
}

function spokenSlot(dateStr: string, h: number, m: number): string {
  const today = bogotaDateString();
  const tomorrow = bogotaDateStringPlusDays(1);
  const dayAfter = bogotaDateStringPlusDays(2);

  let dayPart: string;
  if (dateStr === tomorrow) dayPart = "mañana";
  else if (dateStr === dayAfter) dayPart = "pasado mañana";
  else if (dateStr === today) dayPart = "hoy";
  else {
    const noon = new Date(`${dateStr}T12:00:00${OFFSET}`);
    dayPart = `el ${bogotaWeekdaySpanish(noon)}`;
  }

  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  let timePart = `a las ${HOUR_WORDS[hour12] ?? String(hour12)}`;
  if (m === 30) timePart += " y media";
  else if (m !== 0) timePart += ` y ${m}`;

  if (h >= 12 && h < 19) timePart += " de la tarde";
  else if (h >= 19) timePart += " de la noche";
  else timePart += " de la mañana";

  return `${dayPart} ${timePart}`;
}

export async function getAvailableSlots(
  supabase: SupabaseClient,
  count = 3
): Promise<Slot[]> {
  const todayStr = bogotaDateString();
  const horizonIsoUtc = new Date(
    `${bogotaDateStringPlusDays(HORIZON_DAYS)}T23:59:59${OFFSET}`
  ).toISOString();
  const lowerIsoUtc = new Date(`${todayStr}T00:00:00${OFFSET}`).toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("slot_start")
    .gte("slot_start", lowerIsoUtc)
    .lte("slot_start", horizonIsoUtc)
    .in("status", ["scheduled"]);

  const taken = new Set(
    ((data ?? []) as { slot_start: string }[]).map((a) =>
      new Date(a.slot_start).getTime()
    )
  );

  const slots: Slot[] = [];
  for (let d = 1; d <= HORIZON_DAYS && slots.length < count; d++) {
    const dateStr = bogotaDateStringPlusDays(d);
    for (const { h, m } of TIMES_OF_DAY) {
      if (slots.length >= count) break;
      const iso = buildIso(dateStr, h, m);
      if (taken.has(new Date(iso).getTime())) continue;
      slots.push({ iso, spoken: spokenSlot(dateStr, h, m), date: dateStr });
    }
  }

  return slots;
}

export type AvailabilityCheck =
  | { available: true; iso: string; spoken: string; date: string }
  | {
      available: false;
      reason: "taken" | "out_of_hours" | "out_of_horizon" | "invalid_input";
      suggestion?: string;
    };

export async function checkSlotAvailability(
  supabase: SupabaseClient,
  date: string,
  hour: string
): Promise<AvailabilityCheck> {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const hourMatch = /^(\d{1,2}):(\d{2})$/.exec(hour);
  if (!dateMatch || !hourMatch) return { available: false, reason: "invalid_input" };

  const todayStr = bogotaDateString();
  const horizonStr = bogotaDateStringPlusDays(HORIZON_DAYS);
  if (date < todayStr || date > horizonStr) {
    return { available: false, reason: "out_of_horizon" };
  }

  const h = parseInt(hourMatch[1], 10);
  const m = parseInt(hourMatch[2], 10);
  const slot = TIMES_OF_DAY.find((s) => s.h === h && s.m === m);
  if (!slot) {
    return {
      available: false,
      reason: "out_of_hours",
      suggestion: nearestSlotLabel(h, m),
    };
  }

  const iso = buildIso(date, h, m);
  const { data } = await supabase
    .from("appointments")
    .select("slot_start")
    .eq("status", "scheduled");

  const taken = ((data ?? []) as { slot_start: string }[]).some(
    (a) => new Date(a.slot_start).getTime() === new Date(iso).getTime()
  );
  if (taken) return { available: false, reason: "taken" };

  return { available: true, iso, spoken: spokenSlot(date, h, m), date };
}

function nearestSlotLabel(h: number, m: number): string {
  const target = h * 60 + m;
  let best = TIMES_OF_DAY[0];
  let bestDist = Infinity;
  for (const s of TIMES_OF_DAY) {
    const dist = Math.abs(s.h * 60 + s.m - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best.label;
}
