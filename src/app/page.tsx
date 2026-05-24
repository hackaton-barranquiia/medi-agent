import Link from "next/link";
import { ArrowRight, PhoneOutgoing, Sparkles, Calendar } from "lucide-react";

export const metadata = {
  title: "MediAgent — Cero filas, cero medicamentos vencidos.",
  description:
    "Voice agent que conecta inventario, fórmula y paciente. Convierte la fila de 8 horas en una llamada de 3 minutos. Hackathon Barranqui-IA · Mayo 2026.",
};

const STATS = [
  {
    value: "312.500",
    suffix: "tutelas",
    label: "en salud durante 2025 en Colombia",
    note: "+17,9% vs. 2024 · Defensoría del Pueblo",
  },
  {
    value: "87.500",
    suffix: "al año",
    label: "son por negación o demora de medicamentos",
    note: "28% del total · Defensoría del Pueblo",
  },
  {
    value: "+160%",
    suffix: "crecimiento",
    label: "de pendientes en Nueva EPS",
    note: "Infobae · octubre 2025",
  },
  {
    value: "48",
    suffix: "horas",
    label: "máximo legal para dispensar tras autorización",
    note: "Ley 1438 · Sentencia T-760 · Circular 017",
  },
];

const STEPS = [
  {
    code: "01",
    icon: Sparkles,
    title: "Detecta",
    body: "El sistema sabe cuándo un medicamento está listo, próximo a vencer o pendiente de retiro. Inventario, fórmula y paciente, conectados en una sola capa operativa.",
  },
  {
    code: "02",
    icon: PhoneOutgoing,
    title: "Llama",
    body: "Disparo automático de llamada. El agente autentica al paciente con los últimos 4 dígitos de su cédula y confirma qué se entrega hoy, qué queda pendiente.",
  },
  {
    code: "03",
    icon: Calendar,
    title: "Agenda",
    body: "Retiro programado o domicilio en una sola llamada. El dispensario sabe quién llega, cuándo y a buscar qué. Cero filas. Cero medicamentos vencidos.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0e0f0c] text-[#f4f5f1]">
      {/* Public Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1f221c] bg-[#0e0f0c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="font-display text-[22px] leading-none tracking-[-0.04em] text-[#f4f5f1]">
              medi
            </span>
            <span className="font-display text-[22px] leading-none tracking-[-0.04em] text-[#f4f5f1]">
              agent
            </span>
            <span className="ml-1 inline-block h-1.5 w-1.5 translate-y-[-2px] bg-[#9fe870]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 border border-[#9fe870] bg-[#9fe870] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0e0f0c] transition hover:bg-[#cdffad]"
            >
              Ver el tablero
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#1f221c]">
        <div className="mx-auto max-w-[1280px] px-6 pt-20 pb-24 lg:px-10 lg:pt-32 lg:pb-36">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9fe870]">
            Hackathon Barranqui-IA · Mayo 2026
          </p>

          <h1 className="mt-8 font-display text-[56px] leading-[0.92] tracking-[-0.045em] text-[#f4f5f1] sm:text-[88px] lg:text-[128px]">
            Cecilia tenía
            <br />
            70 años.
            <br />
            <span className="text-[#9fe870]">Murió esperando</span>
            <br />
            un medicamento.
          </h1>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <p className="max-w-[58ch] text-[18px] leading-[1.45] text-[#c5c7bd] lg:text-[20px]">
              El 24 de febrero entró a una farmacéutica de Barranquilla a
              reclamar la medicina que no recibía desde diciembre. Llegó a la
              ventanilla. Le dijeron que no había. Se sentó. Se levantó.{" "}
              <span className="text-[#f4f5f1]">Y se desplomó.</span>{" "}
              <span className="text-[#f4f5f1]">
                Murió dentro de la farmacéutica, esperando el medicamento que
                necesitaba para no morir.
              </span>
            </p>

            <div className="flex flex-col gap-3 lg:items-end lg:justify-end">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-between gap-3 border border-[#9fe870] bg-[#9fe870] px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0e0f0c] transition hover:bg-[#cdffad]"
              >
                Ver el tablero en vivo
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#problema"
                className="inline-flex items-center justify-between gap-3 border border-[#2a2c25] bg-transparent px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#f4f5f1] transition hover:border-[#f4f5f1]"
              >
                Conocer la propuesta
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Annotation row */}
          <div className="mt-20 grid gap-6 border-t border-[#1f221c] pt-6 sm:grid-cols-3">
            <Annotation label="caso documentado" value="Barranquilla · 24 feb 2026" />
            <Annotation label="tutelas locales" value="513 en menos de 5 meses" />
            <Annotation label="obligación legal" value="48 h tras autorización" />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problema" className="border-b border-[#1f221c]">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9fe870]">
                01 — El problema
              </p>
              <h2 className="mt-6 font-display text-[40px] leading-[0.95] tracking-[-0.035em] text-[#f4f5f1] sm:text-[56px] lg:text-[68px]">
                No falla por <span className="text-[#9fe870]">falta de información.</span>{" "}
                Falla porque está <span className="text-[#9fe870]">desconectada.</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-[16px] leading-[1.55] text-[#c5c7bd] lg:text-[18px]">
                El dispensario tiene inventario. Tiene fórmulas activas. Tiene
                fechas de vencimiento. Tiene pacientes esperando. Pero todo vive
                separado: una cosa es la bodega, otra la fórmula, otra la
                llamada, otra la fila.{" "}
                <span className="text-[#f4f5f1]">
                  Cada tutela por medicamentos es una entrega que no se cerró a
                  tiempo.
                </span>
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-16 grid gap-px bg-[#1f221c] sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.value}
                className="flex flex-col justify-between gap-6 bg-[#0e0f0c] p-6 lg:p-8"
              >
                <p className="font-display text-[56px] leading-[0.9] tracking-[-0.04em] text-[#9fe870] lg:text-[72px]">
                  {stat.value}
                </p>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8d83]">
                    {stat.suffix}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.4] text-[#f4f5f1]">
                    {stat.label}
                  </p>
                  <p className="mt-3 border-t border-[#1f221c] pt-2 text-[11px] leading-snug text-[#8a8d83]">
                    {stat.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="border-b border-[#1f221c] bg-[#f4f5f1] text-[#1f221c]">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#163300]">
            02 — La solución
          </p>
          <h2 className="mt-6 max-w-[18ch] font-display text-[44px] leading-[0.92] tracking-[-0.04em] text-[#0e0f0c] sm:text-[64px] lg:text-[88px]">
            Una capa operativa que conecta inventario, fórmula y paciente.
          </h2>

          <p className="mt-8 max-w-[62ch] text-[17px] leading-[1.5] text-[#4d5048] lg:text-[19px]">
            El dispensario deja de reaccionar al paciente que llegó primero y
            empieza a gestionar la entrega antes de que el problema se convierta
            en reclamo, tutela o riesgo clínico.
          </p>

          {/* Steps */}
          <div className="mt-16 grid gap-px bg-[#1f221c] sm:grid-cols-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.code}
                  className="flex flex-col gap-6 bg-[#f4f5f1] p-6 lg:p-10"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center border border-[#1f221c] bg-white">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#8a8d83]">
                      {step.code}
                    </span>
                  </div>
                  <h3 className="font-display text-[40px] leading-none tracking-[-0.035em] text-[#0e0f0c] lg:text-[52px]">
                    {step.title}
                    <span className="text-[#9fe870]">.</span>
                  </h3>
                  <p className="text-[15px] leading-[1.5] text-[#4d5048]">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-10 max-w-[68ch] border-t border-[#c9cdc1] pt-6 text-[13px] leading-snug text-[#6c6f67]">
            Voz natural en español colombiano. Autenticación con los últimos 4
            dígitos de la cédula. Stock parcial, reservas y domicilio resueltos
            en la misma llamada.
          </p>
        </div>
      </section>

      {/* BEFORE / AFTER + CTA */}
      <section className="border-b border-[#1f221c]">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9fe870]">
            03 — El antes y el después
          </p>
          <h2 className="mt-6 max-w-[22ch] font-display text-[44px] leading-[0.92] tracking-[-0.04em] text-[#f4f5f1] sm:text-[64px] lg:text-[88px]">
            De <span className="line-through decoration-[#d03238] decoration-[6px]">8 horas</span>{" "}
            a <span className="text-[#9fe870]">3 minutos</span>.
          </h2>

          <div className="mt-16 grid gap-px bg-[#1f221c] lg:grid-cols-2">
            <BeforeAfterCol
              tone="negative"
              eyebrow="Antes"
              lines={[
                "Hasta 8 horas de fila bajo el sol.",
                "El paciente aparece sin saber si hay stock.",
                "Medicamentos vencidos en bodega.",
                "Tutela, sanción de Supersalud, riesgo clínico.",
              ]}
            />
            <BeforeAfterCol
              tone="positive"
              eyebrow="Después"
              lines={[
                "Una llamada de 3 minutos.",
                "El paciente sabe qué hay y cuándo retirar.",
                "Stock rota antes de vencerse.",
                "Cero filas. Cero tutelas evitables.",
              ]}
            />
          </div>

          <div className="mt-20 flex flex-col items-start justify-between gap-8 border-t border-[#1f221c] pt-12 lg:flex-row lg:items-center">
            <p className="max-w-[42ch] font-display text-[28px] leading-[1.05] tracking-[-0.025em] text-[#f4f5f1] lg:text-[36px]">
              El dispensario gana visibilidad, control y un canal para llegar al
              paciente antes de que salga de su casa.
            </p>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 border border-[#9fe870] bg-[#9fe870] px-8 py-5 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#0e0f0c] transition hover:bg-[#cdffad]"
            >
              Abrir el tablero
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0e0f0c]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[18px] leading-none tracking-[-0.04em] text-[#f4f5f1]">
              medi
            </span>
            <span className="font-display text-[18px] leading-none tracking-[-0.04em] text-[#f4f5f1]">
              agent
            </span>
            <span className="ml-1 inline-block h-1.5 w-1.5 translate-y-[-2px] bg-[#9fe870]" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a8d83]">
            v0.1 · barranqui-ia · mayo 2026
          </p>
        </div>
      </footer>
    </main>
  );
}

function Annotation({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8d83]">
        {label}
      </p>
      <p className="mt-2 text-[14px] font-semibold text-[#f4f5f1]">{value}</p>
    </div>
  );
}

function BeforeAfterCol({
  tone,
  eyebrow,
  lines,
}: {
  tone: "negative" | "positive";
  eyebrow: string;
  lines: string[];
}) {
  const isPositive = tone === "positive";
  return (
    <div className="flex flex-col gap-6 bg-[#0e0f0c] p-8 lg:p-12">
      <p
        className={`font-mono text-[11px] uppercase tracking-[0.22em] ${
          isPositive ? "text-[#9fe870]" : "text-[#d03238]"
        }`}
      >
        {eyebrow}
      </p>
      <ul className="flex flex-col gap-4">
        {lines.map((line) => (
          <li
            key={line}
            className="flex gap-4 border-t border-[#1f221c] pt-4 first:border-t-0 first:pt-0"
          >
            <span
              className={`mt-2 inline-block h-2 w-2 shrink-0 ${
                isPositive ? "bg-[#9fe870]" : "bg-[#d03238]"
              }`}
            />
            <span className="font-display text-[22px] leading-[1.15] tracking-[-0.02em] text-[#f4f5f1] lg:text-[26px]">
              {line}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
