"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Phone, PhoneCall } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { supabaseBrowser } from "@/lib/supabase/client";
import { WebCallButton } from "./web-call-button";

type Item = {
  id: string;
  status: "ready" | "expiring_soon" | string;
  created_at: string;
  expires_at: string | null;
  patient: {
    id: string;
    full_name: string;
    phone_e164: string;
    last_4_cc: string | null;
  };
};

type Filter = "all" | "expiring_soon" | "ready";

export function CallList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch("/api/dashboard/contactables", {
          cache: "no-store",
        });
        if (r.ok) setItems(await r.json());
      } catch {}
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const ch = supabase
      .channel("calls-page-calls")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs" },
        (payload) => {
          const pid = payload.new.patient_id as string | undefined;
          if (pid) setActive((c) => new Set([...c, pid]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_logs" },
        (payload) => {
          const pid = payload.new.patient_id as string | undefined;
          const ended = payload.new.ended_at;
          if (pid && ended) {
            setActive((c) => {
              const n = new Set(c);
              n.delete(pid);
              return n;
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, expiring_soon: 0, ready: 0 };
    return {
      all: items.length,
      expiring_soon: items.filter((i) => i.status === "expiring_soon").length,
      ready: items.filter((i) => i.status === "ready").length,
    };
  }, [items]);

  const triggerCall = async (
    patientId: string,
    patientName: string,
    patientPhone: string
  ) => {
    setPending((c) => new Set([...c, patientId]));
    try {
      const r = await fetch("/api/calls/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, phone_e164: patientPhone }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(`Llamando a ${patientName}…`);
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo iniciar la llamada"
      );
    } finally {
      setPending((c) => {
        const n = new Set(c);
        n.delete(patientId);
        return n;
      });
    }
  };

  const callAllPending = async () => {
    if (!filtered || filtered.length === 0) return;
    const targets = filtered
      .filter((i) => !active.has(i.patient.id))
      .slice(0, 10);
    toast(`Encolando ${targets.length} llamadas`);
    for (const it of targets) {
      await triggerCall(
        it.patient.id,
        it.patient.full_name,
        it.patient.phone_e164
      );
    }
  };

  return (
    <div className="px-4 py-8 lg:px-10 lg:py-12">
      {/* Section header */}
      <header className="mb-8 flex flex-col gap-6 border-b border-[var(--color-hairline)] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mt-4 max-w-[52ch] text-[14px] leading-snug text-[var(--color-body)]">
            Cada fila representa un paciente con fórmula lista o por vencer. Al
            tocar “Llamar”, el agente de voz colombiano marca, agenda el turno
            y registra el resultado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={callAllPending}
            disabled={!filtered || filtered.length === 0}
            className="group flex items-center gap-2 border border-[#9fe870] bg-[#9fe870] px-4 py-3 text-[13px] font-semibold text-[#163300] transition hover:bg-[#cdffad] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PhoneCall className="h-4 w-4" strokeWidth={2.5} />
            Llamar a todos ({filtered?.length ?? 0})
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-px border border-[var(--color-hairline)] bg-[var(--color-hairline-strong)]">
        <FilterTab
          active={filter === "all"}
          label="Todos"
          count={counts.all}
          onClick={() => setFilter("all")}
        />
        <FilterTab
          active={filter === "expiring_soon"}
          label="Vence pronto"
          count={counts.expiring_soon}
          onClick={() => setFilter("expiring_soon")}
          tone="negative"
        />
        <FilterTab
          active={filter === "ready"}
          label="Fórmula lista"
          count={counts.ready}
          onClick={() => setFilter("ready")}
        />
      </div>

      {/* Table */}
      <div className="border border-[var(--color-hairline)] bg-[#ffffff]">
        <div className="hidden grid-cols-[40px_2fr_1.2fr_1fr_140px_170px] items-center gap-4 border-b border-[var(--color-hairline)] bg-[#f4f5f1] px-6 py-3 lg:grid">
          <span className="eyebrow text-[10px]">#</span>
          <span className="eyebrow text-[10px]">Paciente</span>
          <span className="eyebrow text-[10px]">Teléfono</span>
          <span className="eyebrow text-[10px]">Cédula</span>
          <span className="eyebrow text-[10px]">Estado</span>
          <span className="eyebrow text-[10px] text-right">Acción</span>
        </div>

        {filtered === null && (
          <div className="px-6 py-10">
            <div className="h-3 w-44 shimmer" />
            <div className="mt-3 h-3 w-72 shimmer" />
            <div className="mt-3 h-3 w-56 shimmer" />
          </div>
        )}

        {filtered && filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-[26px] leading-tight text-[#1f221c]">
              No hay pacientes en cola.
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-mute)]">
              Cuando aparezcan fórmulas listas o por vencer, podrás disparar
              llamadas desde aquí.
            </p>
          </div>
        )}

        <ul className="divide-y divide-[#0e0f0c]/10">
          {filtered?.map((it, i) => {
            const inCall = active.has(it.patient.id);
            const isPending = pending.has(it.patient.id);
            const urgent = it.status === "expiring_soon";
            const expiresLabel = it.expires_at
              ? formatDistanceToNowStrict(new Date(it.expires_at), {
                  addSuffix: true,
                  locale: es,
                })
              : null;
            return (
              <li
                key={it.id}
                className={`relative grid grid-cols-1 gap-3 px-6 py-4 transition lg:grid-cols-[40px_2fr_1.2fr_1fr_140px_170px] lg:items-center lg:gap-4 ${
                  inCall ? "bg-[#9fe870]/15" : "hover:bg-[#f4f5f1]/60"
                }`}
              >
                <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--color-mute)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[18px] leading-tight text-[#1f221c]">
                    {it.patient.full_name}
                  </p>
                  {inCall && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#054d28]">
                      <span className="live-dot" /> en línea
                    </p>
                  )}
                </div>
                <p className="font-mono text-[13px] text-[var(--color-body)]">
                  {it.patient.phone_e164}
                </p>
                <p className="font-mono text-[13px] text-[var(--color-body)]">
                  ····{it.patient.last_4_cc ?? "····"}
                </p>
                <div>
                  {urgent ? (
                    <span className="inline-flex items-center gap-1.5 border border-[#e7c7c9] bg-[#fbeded] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a72027]">
                      <span className="inline-block h-1.5 w-1.5 bg-[#d03238]" />
                      Vence {expiresLabel ?? "pronto"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 border border-[#c5edab] bg-[#e2f6d5] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#054d28]">
                      <span className="inline-block h-1.5 w-1.5 bg-[#2ead4b]" />
                      Lista
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <WebCallButton
                    patientId={it.patient.id}
                    patientName={it.patient.full_name}
                    patientPhone={it.patient.phone_e164}
                  />
                  <button
                    onClick={() =>
                      triggerCall(
                        it.patient.id,
                        it.patient.full_name,
                        it.patient.phone_e164
                      )
                    }
                    disabled={isPending || inCall}
                    className="group flex items-center gap-2 border border-[#9fe870] bg-[#9fe870] px-3 py-2 text-[12px] font-semibold text-[#163300] transition hover:bg-[#cdffad] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {inCall ? "En llamada" : isPending ? "Marcando…" : "Llamar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function FilterTab({
  active,
  label,
  count,
  onClick,
  tone,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  tone?: "negative";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-baseline justify-between gap-3 px-5 py-3 text-left transition lg:flex-none lg:min-w-[180px] ${
        active
          ? "bg-[#9fe870] text-[#1f221c]"
          : "bg-[#ffffff] text-[#1f221c] hover:bg-[#f4f5f1]"
      }`}
    >
      <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
        {label}
      </span>
      <span
        className={`font-display text-[18px] leading-none ${
          tone === "negative" && !active ? "text-[#a72027]" : ""
        }`}
      >
        {count}
      </span>
    </button>
  );
}
