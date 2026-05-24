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
    if (!pk) return;
    const v = new Vapi(pk);
    v.on("call-start", () => setStatus("active"));
    v.on("call-end", () => setStatus("idle"));
    v.on("error", (e: unknown) => {
      console.error("vapi error", e);
      toast.error("Error en llamada web");
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
      const r = await fetch("/api/calls/build-context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, phone_e164: patientPhone }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { assistantId, variableValues } = await r.json();
      if (!vapiRef.current) throw new Error("Vapi SDK no inicializado");
      await vapiRef.current.start(assistantId, { variableValues });
      toast.success(`Llamada web con ${patientName}`);
    } catch (e: unknown) {
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
