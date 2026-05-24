"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { format } from "date-fns";

type CallEvent = {
  id: string;
  vapi_call_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

const EVENT_STYLES: Record<string, { label: string; color: string }> = {
  transcript: { label: "TRANSCRIPCIÓN", color: "#0043ce" },
  "tool-call": { label: "TOOL CALL", color: "#b45309" },
  "tool-result": { label: "TOOL RESULT", color: "#15803d" },
  status: { label: "ESTADO", color: "#525252" },
};

function formatPayload(type: string, payload: Record<string, unknown>): string {
  if (type === "transcript") {
    const role = (payload.role as string) === "user" ? "👤" : "🤖";
    return `${role} "${payload.transcript}"`;
  }
  if (type === "tool-call") {
    let args = "";
    try {
      args = JSON.stringify(JSON.parse(payload.arguments as string));
    } catch {
      args = String(payload.arguments ?? "");
    }
    return `${payload.name}(${args})`;
  }
  if (type === "tool-result") {
    return `${payload.name} → ${JSON.stringify(payload.result)}`;
  }
  if (type === "status") {
    return String(payload.status ?? "");
  }
  return JSON.stringify(payload);
}

export function CallLogPanel() {
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Listen for call start events dispatched by CallButton
  useEffect(() => {
    const handler = (e: Event) => {
      const callId = (e as CustomEvent<string>).detail;
      setActiveCallId(callId);
      setEvents([]);
    };
    window.addEventListener("vapi:call-started", handler);
    return () => window.removeEventListener("vapi:call-started", handler);
  }, []);

  // Subscribe to call_events in real-time
  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel("call-events-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_events" },
        (payload) => {
          const ev = payload.new as CallEvent;
          // If we have an active call, only show events for it
          if (activeCallId && ev.vapi_call_id !== activeCallId) return;
          setEvents((curr) => [...curr.slice(-49), ev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCallId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        {activeCallId ? (
          <span className="text-xs text-[#525252] font-mono truncate">
            {activeCallId.slice(0, 18)}…
          </span>
        ) : (
          <span className="text-xs text-[#525252]">Esperando llamada…</span>
        )}
        {events.length > 0 && (
          <button
            onClick={() => setEvents([])}
            className="text-xs text-[#525252] hover:text-[#161616]"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] min-h-[200px] max-h-[320px]">
        {events.length === 0 ? (
          <p className="text-[#525252] text-xs">
            Los eventos aparecerán aquí durante la llamada.
          </p>
        ) : (
          events.map((ev) => {
            const style = EVENT_STYLES[ev.event_type] ?? {
              label: ev.event_type.toUpperCase(),
              color: "#525252",
            };
            return (
              <div key={ev.id} className="flex gap-2 leading-relaxed">
                <span className="text-[#a8a8a8] shrink-0">
                  {format(new Date(ev.created_at), "HH:mm:ss")}
                </span>
                <span
                  className="shrink-0 font-semibold"
                  style={{ color: style.color }}
                >
                  [{style.label}]
                </span>
                <span className="text-[#161616] break-all">
                  {formatPayload(ev.event_type, ev.payload)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
