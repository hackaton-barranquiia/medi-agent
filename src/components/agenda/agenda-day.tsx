"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Package,
  Phone,
  Pill,
  Rows3,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabaseBrowser } from "@/lib/supabase/client";

type Med = { qty: number; name: string };

type Appt = {
  id: string;
  status: string;
  slot_start: string;
  copay_cents: number;
  delivery_for_pending: boolean;
  delivery_date: string | null;
  patient: { id: string; full_name: string; phone_e164: string };
  medications: Med[];
};

type Filter = "all" | "pending" | "ready" | "delivered";
type ViewMode = "board" | "calendar";

const STATUS: Record<
  string,
  { label: string; tone: string; border: string; pill: string }
> = {
  scheduled: {
    label: "Por alistar",
    tone: "text-[#1f221c]",
    border: "border-[var(--color-hairline)]",
    pill: "bg-[#f4f5f1]",
  },
  ready_for_pickup: {
    label: "Alistado",
    tone: "text-[#4a3b1c]",
    border: "border-[#f3e0a8]",
    pill: "bg-[#fff4cc]",
  },
  delivered: {
    label: "Entregado",
    tone: "text-[#054d28]",
    border: "border-[#c5edab]",
    pill: "bg-[#e2f6d5]",
  },
  no_show: {
    label: "No asistió",
    tone: "text-[#a72027]",
    border: "border-[#e7c7c9]",
    pill: "bg-[#fbeded]",
  },
  cancelled: {
    label: "Cancelada",
    tone: "text-[var(--color-body)]",
    border: "border-[var(--color-hairline-strong)]",
    pill: "bg-[#f4f5f1]",
  },
};

const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 21;

export function AgendaDay() {
  const [items, setItems] = useState<Appt[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  const updateDate = (nextDate: Date) => {
    setSelectedDate(nextDate);
    setSelectedId(null);
    setModalId(null);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/dashboard/agenda?date=${dateKey}`, {
        cache: "no-store",
      });
      if (r.ok) {
        setItems(await r.json());
      } else {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "No se pudo cargar la agenda");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error de agenda");
    }
  }, [dateKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const sb = supabaseBrowser();
    const ch = sb
      .channel("agenda-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (filter === "all") return items;
    if (filter === "pending")
      return items.filter((item) => item.status === "scheduled");
    if (filter === "ready")
      return items.filter((item) => item.status === "ready_for_pickup");
    if (filter === "delivered")
      return items.filter((item) => item.status === "delivered");
    return items;
  }, [items, filter]);

  const grouped = useMemo(() => {
    if (!filtered) return null;
    const map = new Map<string, Appt[]>();
    for (const appointment of filtered) {
      const key = format(parseISO(appointment.slot_start), "HH:00");
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(appointment);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const calendarRows = useMemo(() => {
    if (!filtered) return [];
    return Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }).map(
      (_, index) => {
        const hour = CALENDAR_START_HOUR + index;
        const rows = filtered.filter(
          (item) => parseISO(item.slot_start).getHours() === hour
        );
        return { hour, rows };
      }
    );
  }, [filtered]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, pending: 0, ready: 0, delivered: 0 };
    return {
      all: items.length,
      pending: items.filter((item) => item.status === "scheduled").length,
      ready: items.filter((item) => item.status === "ready_for_pickup").length,
      delivered: items.filter((item) => item.status === "delivered").length,
    };
  }, [items]);

  const selected = items?.find((item) => item.id === selectedId) ?? null;
  const modalAppt = items?.find((item) => item.id === modalId) ?? null;

  const action = async (
    appt: Appt,
    kind: "mark-ready" | "mark-delivered"
  ) => {
    try {
      const r = await fetch(`/api/appointments/${appt.id}/${kind}`, {
        method: "POST",
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "fallo la operación");
      }
      toast.success(
        kind === "mark-ready" ? "Marcado como alistado" : "Entrega registrada"
      );
      load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const dayLabel = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="px-4 py-8 lg:px-10 lg:py-12">
      <header className="mb-8 flex flex-col gap-6 border-b border-[var(--color-hairline)] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{dayLabel}</p>
          <h2 className="mt-3 font-display text-[42px] leading-[0.95] tracking-[-0.04em] text-[#1f221c] lg:text-[56px]">
            Cronograma de <br className="hidden sm:block" />
            <span className="text-[#9fe870]">pedidos</span>.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[14px] leading-snug text-[var(--color-body)]">
            Vista del auxiliar de distribución. Cada bloque agrupa los pedidos
            por hora. Marcá alistado cuando esté listo en mostrador y entregado
            cuando el paciente lo retire.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => updateDate(addDays(selectedDate, -1))}
              className="inline-flex h-8 w-8 items-center justify-center border border-[var(--color-hairline)] bg-white text-[#1f221c] transition hover:bg-[#f4f5f1]"
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <input
              type="date"
              value={dateKey}
              onChange={(event) => {
                if (!event.target.value) return;
                updateDate(new Date(`${event.target.value}T00:00:00`));
              }}
              className="h-8 border border-[var(--color-hairline)] bg-white px-2 text-[12px] font-medium text-[#1f221c] outline-none focus:border-[var(--color-hairline-strong)]"
              aria-label="Seleccionar fecha de agenda"
            />
            <button
              onClick={() => updateDate(addDays(selectedDate, 1))}
              className="inline-flex h-8 w-8 items-center justify-center border border-[var(--color-hairline)] bg-white text-[#1f221c] transition hover:bg-[#f4f5f1]"
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-[12px] font-semibold uppercase tracking-wide transition ${
                viewMode === "board"
                  ? "border-[#9fe870] bg-[#9fe870] text-[#1f221c]"
                  : "border-[var(--color-hairline)] bg-white text-[#1f221c] hover:bg-[#f4f5f1]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.2} />
              Tablero
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-[12px] font-semibold uppercase tracking-wide transition ${
                viewMode === "calendar"
                  ? "border-[#9fe870] bg-[#9fe870] text-[#1f221c]"
                  : "border-[var(--color-hairline)] bg-white text-[#1f221c] hover:bg-[#f4f5f1]"
              }`}
            >
              <Rows3 className="h-3.5 w-3.5" strokeWidth={2.2} />
              Calendario
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px border border-[var(--color-hairline)] bg-[var(--color-hairline-strong)] sm:grid-cols-4">
            <SummaryStat label="Total" value={counts.all} />
            <SummaryStat label="Por alistar" value={counts.pending} />
            <SummaryStat label="Alistados" value={counts.ready} highlight />
            <SummaryStat label="Entregados" value={counts.delivered} accent />
          </div>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-px border border-[var(--color-hairline)] bg-[var(--color-hairline-strong)]">
        <Tab
          active={filter === "all"}
          label="Todos"
          count={counts.all}
          onClick={() => setFilter("all")}
        />
        <Tab
          active={filter === "pending"}
          label="Por alistar"
          count={counts.pending}
          onClick={() => setFilter("pending")}
        />
        <Tab
          active={filter === "ready"}
          label="Alistados"
          count={counts.ready}
          onClick={() => setFilter("ready")}
        />
        <Tab
          active={filter === "delivered"}
          label="Entregados"
          count={counts.delivered}
          onClick={() => setFilter("delivered")}
        />
      </div>

      {grouped === null && (
        <div className="border border-[var(--color-hairline)] bg-white p-6">
          <div className="h-4 w-32 shimmer" />
          <div className="mt-4 h-3 w-72 shimmer" />
        </div>
      )}

      {grouped && grouped.length === 0 && (
        <div className="border border-[var(--color-hairline)] bg-white px-6 py-16 text-center">
          <CalendarDays
            className="mx-auto h-8 w-8 text-[var(--color-body)]"
            strokeWidth={1.5}
          />
          <p className="mt-4 font-display text-[26px] leading-tight text-[#1f221c]">
            No hay pedidos en este filtro.
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-mute)]">
            Cuando los pacientes confirmen su turno por llamada aparecerán aquí.
          </p>
        </div>
      )}

      {viewMode === "board" ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            {grouped?.map(([hour, rows]) => (
              <section key={hour}>
                <div className="mb-3 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[36px] leading-none tracking-[-0.04em] text-[#1f221c]">
                      {hour}
                    </span>
                    <span className="eyebrow text-[var(--color-body)]">
                      {rows.length} pedido{rows.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="ml-6 h-px flex-1 bg-[var(--color-hairline-strong)]/15" />
                </div>

                <ul className="border border-[var(--color-hairline)] bg-white">
                  {rows.map((appointment, index) => {
                    const meta = STATUS[appointment.status] ?? STATUS.scheduled;
                    const isSelected = appointment.id === selectedId;
                    return (
                      <li
                        key={appointment.id}
                        className={`grid grid-cols-[80px_1fr_auto] items-center gap-4 px-5 py-4 transition-colors ${
                          index > 0
                            ? "border-t border-[var(--color-hairline)]/10"
                            : ""
                        } ${
                          isSelected ? "bg-[#e2f6d5]" : "hover:bg-[#f4f5f1]/50"
                        }`}
                        onClick={() => setSelectedId(appointment.id)}
                      >
                        <div>
                          <p className="font-mono text-[12px] text-[var(--color-body)]">
                            {format(parseISO(appointment.slot_start), "HH:mm")}
                          </p>
                          <p className="mt-1 text-[10px] font-mono uppercase tracking-wide text-[var(--color-mute)]">
                            #{appointment.id.slice(0, 6)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-[18px] leading-tight text-[#1f221c]">
                            {appointment.patient.full_name}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-[var(--color-body)]">
                            {appointment.medications.length > 0
                              ? appointment.medications
                                  .slice(0, 2)
                                  .map((medication) => `${medication.name} ×${medication.qty}`)
                                  .join(" · ")
                              : "Sin items registrados"}
                            {appointment.medications.length > 2 &&
                              ` +${appointment.medications.length - 2}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`hidden items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide sm:inline-flex ${meta.border} ${meta.pill} ${meta.tone}`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 ${
                                appointment.status === "delivered"
                                  ? "bg-[#2ead4b]"
                                  : appointment.status === "ready_for_pickup"
                                    ? "bg-[#b86700]"
                                    : appointment.status === "no_show"
                                      ? "bg-[#a72027]"
                                      : "bg-[var(--color-hairline-strong)]"
                              }`}
                            />
                            {meta.label}
                          </span>
                          <AgendaActions
                            appt={appointment}
                            onAction={(kind) => action(appointment, kind)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <aside className="hidden self-start lg:sticky lg:top-6 lg:block">
            <DetailPanel appt={selected} onAction={action} />
          </aside>
        </div>
      ) : (
        <section className="border border-[var(--color-hairline)] bg-white">
          {calendarRows.map(({ hour, rows }, index) => (
            <div
              key={hour}
              className={`grid grid-cols-[84px_1fr] ${
                index > 0 ? "border-t border-[var(--color-hairline)]/10" : ""
              }`}
            >
              <div className="border-r border-[var(--color-hairline)]/10 bg-[#f4f5f1] px-3 py-4">
                <p className="font-mono text-[12px] text-[var(--color-body)]">
                  {String(hour).padStart(2, "0")}:00
                </p>
              </div>
              <div className="min-h-[68px] px-4 py-3">
                {rows.length === 0 ? (
                  <div className="flex h-full items-center rounded-sm border border-dashed border-[var(--color-hairline)]/40 px-3 text-[12px] text-[var(--color-mute)]">
                    Espacio disponible
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rows.map((appointment) => {
                      const meta = STATUS[appointment.status] ?? STATUS.scheduled;
                      return (
                        <button
                          key={appointment.id}
                          onClick={() => setModalId(appointment.id)}
                          className="w-full border border-[var(--color-hairline)] px-3 py-2 text-left transition hover:bg-[#f4f5f1]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-display text-[16px] leading-tight text-[#1f221c]">
                              {appointment.patient.full_name}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.border} ${meta.pill} ${meta.tone}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[12px] text-[var(--color-body)]">
                            {format(parseISO(appointment.slot_start), "HH:mm")} ·{" "}
                            {appointment.medications.length} item
                            {appointment.medications.length !== 1 ? "s" : ""}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <Dialog
        open={Boolean(modalAppt)}
        onOpenChange={(open) => !open && setModalId(null)}
      >
        <DialogContent className="max-w-2xl rounded-none border border-[var(--color-hairline)] bg-white p-0 sm:max-w-2xl">
          {modalAppt && (
            <>
              <DialogHeader className="border-b border-[var(--color-hairline)] bg-[#f4f5f1] px-6 py-4">
                <DialogTitle className="font-display text-[24px] leading-tight text-[#1f221c]">
                  {modalAppt.patient.full_name}
                </DialogTitle>
                <DialogDescription className="font-mono text-[12px] text-[var(--color-body)]">
                  {format(parseISO(modalAppt.slot_start), "HH:mm")} · #
                  {modalAppt.id.slice(0, 6)}
                </DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <DetailPanel appt={modalAppt} onAction={action} compact />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-baseline justify-between gap-3 px-5 py-3 text-left transition lg:min-w-[180px] lg:flex-none ${
        active
          ? "bg-[#9fe870] text-[#1f221c]"
          : "bg-white text-[#1f221c] hover:bg-[#f4f5f1]"
      }`}
    >
      <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
        {label}
      </span>
      <span className="font-display text-[18px] leading-none">{count}</span>
    </button>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`px-5 py-3 ${
        accent ? "bg-[#9fe870] text-[#1f221c]" : "bg-white text-[#1f221c]"
      }`}
    >
      <p className="eyebrow text-[var(--color-body)]">{label}</p>
      <p
        className={`mt-1 font-display text-[28px] leading-none ${
          highlight ? "text-[#b86700]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AgendaActions({
  appt,
  onAction,
}: {
  appt: Appt;
  onAction: (kind: "mark-ready" | "mark-delivered") => void;
}) {
  if (appt.status === "scheduled") {
    return (
      <button
        onClick={(event) => {
          event.stopPropagation();
          onAction("mark-ready");
        }}
        className="flex items-center gap-1.5 border border-[var(--color-hairline)] bg-white px-3 py-2 text-[12px] font-semibold text-[#1f221c] transition hover:bg-[#ffd11a]"
      >
        <Package className="h-3.5 w-3.5" strokeWidth={2.5} />
        Alistar
      </button>
    );
  }

  if (appt.status === "ready_for_pickup") {
    return (
      <button
        onClick={(event) => {
          event.stopPropagation();
          onAction("mark-delivered");
        }}
        className="flex items-center gap-1.5 border border-[#9fe870] bg-[#9fe870] px-3 py-2 text-[12px] font-semibold text-[#163300] transition hover:bg-[#cdffad]"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        Entregar
      </button>
    );
  }

  if (appt.status === "delivered") {
    return (
      <span className="flex items-center gap-1 border border-[#c5edab] bg-[#e2f6d5] px-3 py-2 text-[12px] font-semibold text-[#054d28]">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        Listo
      </span>
    );
  }

  return null;
}

function DetailPanel({
  appt,
  onAction,
  compact = false,
}: {
  appt: Appt | null;
  onAction: (appt: Appt, kind: "mark-ready" | "mark-delivered") => void;
  compact?: boolean;
}) {
  if (!appt) {
    return (
      <div className="border border-[var(--color-hairline)] bg-white p-6">
        <p className="eyebrow">Detalle del pedido</p>
        <p className="mt-4 font-display text-[22px] leading-tight text-[#1f221c]">
          Seleccioná un pedido para ver el detalle.
        </p>
        <p className="mt-2 text-[13px] text-[var(--color-mute)]">
          Hacé click en cualquier fila del cronograma para abrir su información
          completa.
        </p>
      </div>
    );
  }

  const meta = STATUS[appt.status] ?? STATUS.scheduled;
  return (
    <div className={compact ? "bg-white" : "border border-[var(--color-hairline)] bg-white"}>
      {!compact && (
        <div className="border-b border-[var(--color-hairline)] bg-[#f4f5f1] px-6 py-4">
          <p className="eyebrow">Detalle del pedido</p>
          <p className="mt-2 font-display text-[22px] leading-tight text-[#1f221c]">
            {appt.patient.full_name}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.border} ${meta.pill} ${meta.tone}`}
            >
              {meta.label}
            </span>
            <span className="font-mono text-[12px] text-[var(--color-body)]">
              {format(parseISO(appt.slot_start), "HH:mm")} · #{appt.id.slice(0, 6)}
            </span>
          </div>
        </div>
      )}

      <div className={compact ? "space-y-5" : "space-y-5 p-6"}>
        {compact && (
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.border} ${meta.pill} ${meta.tone}`}
            >
              {meta.label}
            </span>
            <span className="font-mono text-[12px] text-[var(--color-body)]">
              {format(parseISO(appt.slot_start), "HH:mm")} · #{appt.id.slice(0, 6)}
            </span>
          </div>
        )}

        <div>
          <p className="eyebrow text-[10px]">Contacto</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-[13px] text-[#1f221c]">
            <Phone className="h-3.5 w-3.5 text-[var(--color-body)]" strokeWidth={2} />
            {appt.patient.phone_e164 || "—"}
          </p>
        </div>

        <div>
          <p className="eyebrow text-[10px]">Medicamentos</p>
          <ul className="mt-2 space-y-1">
            {appt.medications.length === 0 && (
              <li className="text-[12px] text-[var(--color-mute)]">
                Sin items registrados.
              </li>
            )}
            {appt.medications.map((medication) => (
              <li
                key={medication.name}
                className="flex items-center justify-between border border-[var(--color-hairline)]/15 bg-[#f4f5f1] px-3 py-2 text-[13px]"
              >
                <span className="flex items-center gap-2 text-[#1f221c]">
                  <Pill className="h-3.5 w-3.5 text-[var(--color-body)]" strokeWidth={2} />
                  {medication.name}
                </span>
                <span className="font-mono text-[12px] text-[var(--color-body)]">
                  ×{medication.qty}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-px border border-[var(--color-hairline)] bg-[var(--color-hairline-strong)]">
          <div className="bg-white px-3 py-2">
            <p className="eyebrow text-[10px]">Copago</p>
            <p className="mt-1 font-display text-[18px] leading-none text-[#1f221c]">
              ${(appt.copay_cents / 100).toLocaleString("es-CO")}
            </p>
          </div>
          <div className="bg-white px-3 py-2">
            <p className="eyebrow text-[10px]">Modalidad</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-[#1f221c]">
              {appt.delivery_for_pending ? (
                <>
                  <Truck className="h-3.5 w-3.5" strokeWidth={2} />
                  Domicilio
                </>
              ) : (
                "Retiro en sede"
              )}
            </p>
          </div>
        </div>

        {appt.status === "scheduled" && (
          <button
            onClick={() => onAction(appt, "mark-ready")}
            className="flex w-full items-center justify-center gap-2 border border-[#f3e0a8] bg-[#fff4cc] px-3 py-3 text-[13px] font-semibold text-[#4a3b1c] transition hover:bg-[#ffd11a]"
          >
            <Package className="h-4 w-4" strokeWidth={2.5} />
            Marcar como alistado
          </button>
        )}
        {appt.status === "ready_for_pickup" && (
          <button
            onClick={() => onAction(appt, "mark-delivered")}
            className="flex w-full items-center justify-center gap-2 border border-[#9fe870] bg-[#9fe870] px-3 py-3 text-[13px] font-semibold text-[#163300] transition hover:bg-[#cdffad]"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Confirmar entrega
          </button>
        )}
      </div>
    </div>
  );
}
