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
      const res = await fetch(`/api/appointments/${appointmentId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "request_failed");
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
      <Button
        size="sm"
        variant="outline"
        className="rounded-xl border-[#5741d8] text-[#5741d8] hover:bg-[rgba(133,91,251,0.08)]"
        onClick={() => call("mark-ready")}
        disabled={loading}
      >
        {loading ? "..." : "Marcar alistado"}
      </Button>
    );
  }
  if (status === "ready_for_pickup") {
    return (
      <Button
        size="sm"
        className="rounded-xl bg-[#7132f5] hover:bg-[#5741d8]"
        onClick={() => call("mark-delivered")}
        disabled={loading}
      >
        {loading ? "..." : "Marcar entregado"}
      </Button>
    );
  }
  return null;
}
