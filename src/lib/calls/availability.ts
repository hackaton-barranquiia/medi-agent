import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export const TIMES_OF_DAY: { h: number; m: number; label: string }[] = [
  { h: 9, m: 0, label: "09:00" },
  { h: 10, m: 30, label: "10:30" },
  { h: 14, m: 0, label: "14:00" },
];
export const HORIZON_DAYS = 7;

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

export async function getAvailableSlots(
  supabase: SupabaseClient,
  count = 3
): Promise<Slot[]> {
  const now = new Date();
  const horizon = addDays(now, HORIZON_DAYS);

  const { data } = await supabase
    .from("appointments")
    .select("slot_start")
    .gte("slot_start", now.toISOString())
    .lte("slot_start", horizon.toISOString())
    .in("status", ["scheduled"]);

  const taken = new Set(
    ((data ?? []) as { slot_start: string }[]).map((a) => new Date(a.slot_start).getTime())
  );

  const slots: Slot[] = [];
  for (let d = 1; d <= HORIZON_DAYS && slots.length < count; d++) {
    const day = addDays(now, d);
    for (const { h, m } of TIMES_OF_DAY) {
      if (slots.length >= count) break;
      const iso = buildIso(day, h, m);
      if (taken.has(new Date(iso).getTime())) continue;
      slots.push({ iso, spoken: spokenSlot(day, h, m), date: format(day, "yyyy-MM-dd") });
    }
  }

  return slots;
}

function buildIso(day: Date, h: number, m: number): string {
  const date = format(day, "yyyy-MM-dd");
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${date}T${hh}:${mm}:00-05:00`;
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
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const hourMatch = /^(\d{1,2}):(\d{2})$/.exec(hour);
  if (!match || !hourMatch) return { available: false, reason: "invalid_input" };

  const day = new Date(`${date}T00:00:00-05:00`);
  if (Number.isNaN(day.getTime())) return { available: false, reason: "invalid_input" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDay = addDays(today, HORIZON_DAYS);
  if (day < today || day > maxDay) {
    return { available: false, reason: "out_of_horizon" };
  }

  const h = parseInt(hourMatch[1], 10);
  const m = parseInt(hourMatch[2], 10);
  const slot = TIMES_OF_DAY.find((s) => s.h === h && s.m === m);
  if (!slot) {
    const nearest = nearestSlotLabel(h, m);
    return { available: false, reason: "out_of_hours", suggestion: nearest };
  }

  const iso = buildIso(day, h, m);
  const { data } = await supabase
    .from("appointments")
    .select("slot_start")
    .eq("status", "scheduled")
    .eq("slot_start", iso);

  if ((data ?? []).length > 0) return { available: false, reason: "taken" };

  return { available: true, iso, spoken: spokenSlot(day, h, m), date };
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

function spokenSlot(day: Date, h: number, m: number): string {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  let dayPart: string;
  if (isSameDay(day, tomorrow)) dayPart = "mañana";
  else if (isSameDay(day, dayAfter)) dayPart = "pasado mañana";
  else dayPart = `el ${format(day, "EEEE", { locale: es })}`;

  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  let timePart = `a las ${HOUR_WORDS[hour12] ?? String(hour12)}`;
  if (m === 30) timePart += " y media";
  else if (m !== 0) timePart += ` y ${m}`;

  if (h >= 12 && h < 19) timePart += " de la tarde";
  else if (h >= 19) timePart += " de la noche";
  else timePart += " de la mañana";

  return `${dayPart} ${timePart}`;
}
