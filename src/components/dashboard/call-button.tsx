"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CallButton({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calls/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Llamando a ${patientName}...`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      toast.error(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      size="sm"
      className="h-8 rounded-none border-0 bg-[#0f62fe] px-3 text-xs font-normal text-white hover:bg-[#0050e6]"
    >
      {loading ? "Llamando..." : "Llamar"}
    </Button>
  );
}
