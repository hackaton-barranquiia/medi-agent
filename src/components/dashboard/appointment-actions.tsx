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
        className="rounded-none"
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
        className="rounded-none"
        onClick={() => call("mark-delivered")}
        disabled={loading}
      >
        {loading ? "..." : "Marcar entregado"}
      </Button>
    );
  }
  return null;
}
