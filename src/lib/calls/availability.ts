import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

const TIMES_OF_DAY: { h: number; m: number }[] = [
  { h: 9, m: 0 },
  { h: 10, m: 30 },
  { h: 14, m: 0 },
];
const HORIZON_DAYS = 7;

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
