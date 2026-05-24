"use client";

import { useEffect, useState } from "react";
import { Phone, Package, CheckCircle2, CalendarPlus, Clock } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

type Item = {
  id: string;
  kind: "call" | "appointment";
  status: string;
  patient: string;
  at: string;
};

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Phone; tone: string; bg: string }
> = {
  in_progress: {
    label: "Llamada en curso",
    icon: Phone,
    tone: "text-[#163300]",
    bg: "bg-[#e2f6d5]",
  },
  completed: {
    label: "Llamada finalizada",
    icon: Phone,
    tone: "text-[#4d5048]",
    bg: "bg-[#f4f5f1]",
  },
  scheduled: {
    label: "Cita agendada",
    icon: CalendarPlus,
    tone: "text-[#1f221c]",
    bg: "bg-[#f4f5f1]",
  },
  ready_for_pickup: {
    label: "Pedido alistado",
    icon: Package,
    tone: "text-[#1f221c]",
    bg: "bg-[#f4f5f1]",
  },
  delivered: {
    label: "Entrega registrada",
    icon: CheckCircle2,
    tone: "text-[#054d28]",
    bg: "bg-[#e2f6d5]",
  },
};

export function ActivityStream() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch("/api/dashboard/activity", { cache: "no-store" });
        if (r.ok) setItems(await r.json());
      } catch {}
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="border border-[var(--color-hairline)] bg-white">
      <header className="flex items-baseline justify-between border-b border-[var(--color-hairline)] px-6 py-4">
        <p className="eyebrow">Actividad en vivo</p>
        <p className="font-mono text-[11px] text-[var(--color-mute)]">
          últimos eventos
        </p>
      </header>
      <ol className="relative max-h-[440px] divide-y divide-[var(--color-hairline)] overflow-y-auto">
        {items === null && (
          <li className="px-6 py-6">
            <div className="h-3 w-32 shimmer" />
            <div className="mt-2 h-3 w-48 shimmer" />
          </li>
        )}
        {items && items.length === 0 && (
          <li className="px-6 py-12 text-center text-[13px] text-[var(--color-mute)]">
            Sin actividad reciente — esperando llamadas.
          </li>
        )}
        {items?.map((it, i) => {
          const meta =
            STATUS_META[it.status] ??
            ({
              label: it.status,
              icon: Clock,
              tone: "text-[#4d5048]",
              bg: "bg-[#f4f5f1]",
            } as const);
          const Icon = meta.icon;
          let when = "";
          try {
            when = formatDistanceToNowStrict(new Date(it.at), {
              addSuffix: true,
              locale: es,
            });
          } catch {}
          return (
            <li
              key={it.id}
              className="grid grid-cols-[28px_1fr_auto] items-start gap-4 px-6 py-4 fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span
                className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center ${meta.bg} ${meta.tone}`}
                aria-hidden
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#1f221c]">
                  {it.patient}
                </p>
                <p className="truncate text-[12px] text-[var(--color-body)]">
                  {meta.label}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-[var(--color-mute)]">
                {when}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
