"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { Globe, PhoneOff } from "lucide-react";
import { toast } from "sonner";

type Status = "idle" | "loading" | "active";

type Props = {
  patientId: string;
  patientName: string;
  patientPhone: string;
};

export function WebCallButton({ patientId, patientName, patientPhone }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!pk) {
      console.warn("NEXT_PUBLIC_VAPI_PUBLIC_KEY missing — WebCallButton disabled");
      return;
    }
    const v = new Vapi(pk);
    v.on("call-start", () => setStatus("active"));
    v.on("call-end", () => setStatus("idle"));
    v.on("call-start-progress", (e: unknown) => {
      console.log("[vapi.call-start-progress]", e);
    });
    v.on("call-start-success", (e: unknown) => {
      console.log("[vapi.call-start-success]", e);
    });
    v.on("call-start-failed", (e: unknown) => {
      console.error("[vapi.call-start-failed]", e);
      const ev = e as {
        stage?: string;
        error?: string;
        errorStack?: string;
        context?: unknown;
      };
      toast.error(
        ev?.error
          ? `${ev.stage ?? "call"}: ${ev.error}`
          : "Vapi call-start-failed (ver consola)"
      );
      setStatus("idle");
    });
    v.on("error", (e: unknown) => {
      console.error("[vapi.error] raw:", e);
      console.error("[vapi.error] typeof:", typeof e);
      console.error("[vapi.error] keys:", Object.keys((e as object) || {}));
      console.error(
        "[vapi.error] ownProps:",
        Object.getOwnPropertyNames((e as object) || {})
      );
      console.error("[vapi.error] string:", String(e));
      setStatus("idle");
    });
    vapiRef.current = v;
    return () => {
      v.stop();
      vapiRef.current = null;
    };
  }, []);

  const start = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (micErr) {
          throw new Error(
            "Permite acceso al micrófono en el navegador para usar la llamada web."
          );
        }
      }

      const r = await fetch("/api/calls/build-context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, phone_e164: patientPhone }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { assistantId, variableValues } = await r.json();
      if (!vapiRef.current) throw new Error("Vapi SDK no inicializado (¿falta NEXT_PUBLIC_VAPI_PUBLIC_KEY?)");
      console.log("vapi.start", { assistantId, variableValues });
      await vapiRef.current.start(assistantId, { variableValues });
      toast.success(`Llamada web con ${patientName}`);
    } catch (e: unknown) {
      console.error("WebCallButton start failed", e);
      toast.error(e instanceof Error ? e.message : "Error iniciando llamada web");
      setStatus("idle");
    }
  };

  const stop = () => {
    vapiRef.current?.stop();
    setStatus("idle");
  };

  if (status === "active") {
    return (
      <button
        onClick={stop}
        title="Colgar llamada web"
        className="border border-[#d03238] bg-[#fbeded] px-2 py-2 text-[#a72027] transition hover:bg-[#f5dadc]"
      >
        <PhoneOff className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <button
      onClick={start}
      disabled={status === "loading"}
      title="Probar en navegador (sin llamar al celular)"
      className="border border-[var(--color-hairline-strong)] bg-[#ffffff] px-2 py-2 text-[#1f221c] transition hover:bg-[#f4f5f1] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Globe className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
}
