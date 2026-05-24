"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WebCallButton } from "@/components/llamadas/web-call-button";

type Contactable = {
  id: string;
  status: string;
  created_at: string;
  patient: {
    id: string;
    full_name: string;
    phone_e164: string;
    last_4_cc: string | null;
  };
};

type Client = {
  id: string;
  full_name: string;
  phone_e164: string;
  last_4_cc: string | null;
};

type Medication = {
  id: string;
  name: string;
  presentation: string | null;
  stock_qty: number;
};

type OrderItem = {
  id: string;
  medication_id: string;
  qty: number;
};

const emptyItem = (): OrderItem => ({
  id: crypto.randomUUID(),
  medication_id: "",
  qty: 1,
});

export default function OrdenMedicaPage() {
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [contactables, setContactables] = useState<Contactable[] | null>(null);
  const [medications, setMedications] = useState<Medication[] | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([emptyItem()]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [webCallClient, setWebCallClient] = useState<Client | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCallTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const loadData = async () => {
    try {
      const [patientsRes, medsRes] = await Promise.all([
        fetch("/api/dashboard/contactables", { cache: "no-store" }),
        fetch("/api/dashboard/medications", { cache: "no-store" }),
      ]);

      if (!patientsRes.ok) {
        const err = (await patientsRes.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(err?.error ?? "No se pudo cargar pacientes");
      }
      if (!medsRes.ok) {
        const err = (await medsRes.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(err?.error ?? "No se pudo cargar medicamentos");
      }

      const patientsJson = (await patientsRes.json()) as Contactable[];
      const medsJson = (await medsRes.json()) as Medication[];
      setContactables(patientsJson);
      setMedications(medsJson);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error cargando datos");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => {
      clearTimeout(timer);
      clearCallTimeout();
    };
  }, []);

  const uniqueClients = useMemo<Client[]>(() => {
    const list = contactables ?? [];
    const byId = new Map<string, Client>();
    for (const row of list) {
      if (!row.patient?.id || byId.has(row.patient.id)) continue;
      byId.set(row.patient.id, {
        id: row.patient.id,
        full_name: row.patient.full_name,
        phone_e164: row.patient.phone_e164,
        last_4_cc: row.patient.last_4_cc,
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name, "es")
    );
  }, [contactables]);

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    return uniqueClients.filter((client) => {
      if (!normalizedQuery) return true;
      return (
        client.full_name.toLowerCase().includes(normalizedQuery) ||
        client.phone_e164.includes(normalizedQuery) ||
        (client.last_4_cc ?? "").includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, uniqueClients]);

  const medicationById = useMemo(() => {
    const map = new Map<string, Medication>();
    for (const medication of medications ?? []) {
      map.set(medication.id, medication);
    }
    return map;
  }, [medications]);

  const addOrderItem = () => {
    setOrderItems((prev) => [...prev, emptyItem()]);
  };

  const removeOrderItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateOrderItem = (id: string, patch: Partial<OrderItem>) => {
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const queueWebCallSession = (client: Client) => {
    clearCallTimeout();
    setWebCallClient(null);
    toast.message("Orden registrada. Habilitando sesión web en 5 segundos.");
    timeoutRef.current = setTimeout(() => {
      setWebCallClient(client);
      toast.success(`Sesión web lista para ${client.full_name}.`);
    }, 5000);
  };

  const saveOrderAndCall = async () => {
    if (!selectedClient) {
      toast.error("Selecciona un paciente antes de registrar la orden.");
      return;
    }

    const validItems = orderItems.filter(
      (item) =>
        Boolean(item.medication_id) &&
        Number.isFinite(item.qty) &&
        Number(item.qty) > 0
    );
    if (validItems.length === 0) {
      toast.error("Agrega al menos un medicamento válido.");
      return;
    }

    setIsSavingOrder(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedClient.id,
          items: validItems.map((item) => ({
            medication_id: item.medication_id,
            qty: item.qty,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; prescription_id?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo crear la orden");
      }

      toast.success(`Orden ${payload?.prescription_id?.slice(0, 8) ?? ""} creada.`);
      setOrderItems([emptyItem()]);
      await loadData();
      queueWebCallSession(selectedClient);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error guardando orden");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const isLoading = contactables === null || medications === null;

  return (
    <div className="px-4 py-8 lg:px-10 lg:py-12">
      <header className="mb-8 border-b border-[var(--color-hairline)] pb-8">
        <p className="eyebrow">flujo médico sincronizado</p>
        <h2 className="mt-3 font-display text-[42px] leading-[0.95] tracking-[-0.04em] text-[#1f221c] lg:text-[56px]">
          Búsqueda de cliente <br className="hidden sm:block" />y{" "}
          <span className="text-[#9fe870]">orden médica</span>.
        </h2>
        <p className="mt-4 max-w-[58ch] text-[14px] leading-snug text-[var(--color-body)]">
          Usa la misma fuente de pacientes contactables del módulo de llamadas.
          Al guardar, se crea la prescripción real en base de datos y se habilita
          la misma sesión de llamada web que usa el módulo de llamadas.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="border border-[var(--color-hairline)] bg-white">
          <div className="border-b border-[var(--color-hairline)] bg-[#f4f5f1] px-5 py-4">
            <p className="eyebrow">paso 1</p>
            <h3 className="mt-1 font-display text-[24px] leading-tight text-[#1f221c]">
              Buscar paciente
            </h3>
          </div>

          <div className="space-y-4 p-5">
            <label className="block space-y-1">
              <span className="eyebrow text-[10px]">
                Últimos 4 de cédula, celular o nombre
              </span>
              <div className="flex items-center border border-[var(--color-hairline)] bg-white px-3">
                <Search className="h-4 w-4 text-[var(--color-mute)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej: 2689 o +573046002689"
                  className="h-10 w-full bg-transparent px-2 text-[13px] text-[#1f221c] outline-none"
                />
              </div>
            </label>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-10 w-full shimmer" />
                <div className="h-10 w-full shimmer" />
                <div className="h-10 w-full shimmer" />
              </div>
            ) : (
              <ul className="max-h-[340px] space-y-2 overflow-auto">
                {results.map((client) => {
                  const isActive = selectedClient?.id === client.id;
                  return (
                    <li key={client.id}>
                      <button
                        onClick={() => setSelectedClient(client)}
                        className={`w-full border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-[#9fe870] bg-[#e2f6d5]"
                            : "border-[var(--color-hairline)] bg-white hover:bg-[#f4f5f1]"
                        }`}
                      >
                        <p className="font-display text-[18px] leading-tight text-[#1f221c]">
                          {client.full_name}
                        </p>
                        <p className="mt-1 font-mono text-[12px] text-[var(--color-body)]">
                          CC ••••{client.last_4_cc ?? "----"} · {client.phone_e164}
                        </p>
                      </button>
                    </li>
                  );
                })}
                {results.length === 0 && (
                  <li className="border border-dashed border-[var(--color-hairline)] px-4 py-8 text-center text-[13px] text-[var(--color-mute)]">
                    No se encontraron pacientes con ese criterio.
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        <section className="border border-[var(--color-hairline)] bg-white">
          <div className="border-b border-[var(--color-hairline)] bg-[#f4f5f1] px-5 py-4">
            <p className="eyebrow">paso 2</p>
            <h3 className="mt-1 font-display text-[24px] leading-tight text-[#1f221c]">
              Crear orden de medicamentos
            </h3>
          </div>

          <div className="space-y-4 p-5">
            <div className="border border-[var(--color-hairline)] bg-[#f4f5f1] px-4 py-3">
              <p className="eyebrow text-[10px]">paciente seleccionado</p>
              <p className="mt-1 text-[14px] font-semibold text-[#1f221c]">
                {selectedClient?.full_name ?? "Sin seleccionar"}
              </p>
            </div>

            {orderItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_90px_auto] gap-2 border border-[var(--color-hairline)] p-3"
              >
                <select
                  value={item.medication_id}
                  onChange={(event) =>
                    updateOrderItem(item.id, { medication_id: event.target.value })
                  }
                  className="h-9 border border-[var(--color-hairline)] px-2 text-[13px] outline-none focus:border-[#1f221c]"
                >
                  <option value="">Medicamento {index + 1}</option>
                  {(medications ?? []).map((medication) => (
                    <option key={medication.id} value={medication.id}>
                      {medication.name}
                      {medication.presentation ? ` · ${medication.presentation}` : ""}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(event) =>
                    updateOrderItem(item.id, {
                      qty: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className="h-9 border border-[var(--color-hairline)] px-2 text-[13px] outline-none focus:border-[#1f221c]"
                />
                <button
                  onClick={() => removeOrderItem(item.id)}
                  disabled={orderItems.length === 1}
                  className="inline-flex h-9 w-9 items-center justify-center border border-[var(--color-hairline)] text-[var(--color-body)] transition hover:bg-[#fbeded] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Eliminar medicamento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {item.medication_id && medicationById.get(item.medication_id) && (
                  <p className="col-span-3 text-[11px] text-[var(--color-mute)]">
                    Stock actual: {medicationById.get(item.medication_id)?.stock_qty ?? 0}
                  </p>
                )}
              </div>
            ))}

            <button
              onClick={addOrderItem}
              className="inline-flex items-center gap-1.5 border border-[var(--color-hairline)] bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-[#1f221c] transition hover:bg-[#f4f5f1]"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar medicamento
            </button>

            <button
              onClick={saveOrderAndCall}
              disabled={isSavingOrder || isLoading}
              className="flex w-full items-center justify-center gap-2 border border-[#9fe870] bg-[#9fe870] px-3 py-3 text-[13px] font-semibold text-[#163300] transition hover:bg-[#cdffad] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              {isSavingOrder
                ? "Guardando orden..."
                : "Guardar orden y preparar llamada web"}
            </button>

            {webCallClient && (
              <div className="border border-[var(--color-hairline)] bg-[#f4f5f1] px-4 py-3">
                <p className="eyebrow text-[10px]">sesión web</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-[#1f221c]">
                    Iniciar llamada web con {webCallClient.full_name}
                  </p>
                  <WebCallButton
                    patientId={webCallClient.id}
                    patientName={webCallClient.full_name}
                    patientPhone={webCallClient.phone_e164}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
