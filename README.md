# MediAgent

> Voice agent que elimina la fila en los dispensarios de medicamentos en Colombia. Conecta inventario, fórmula y paciente para convertir una espera de 8 horas en una llamada de 3 minutos.
>
> **Hackathon Barranqui-IA · Mayo 2026**

---

## El problema

En Colombia, 312.500 tutelas de salud durante 2025 — el 28% son por negación o demora en la entrega de medicamentos. La ley obliga a dispensar dentro de las 48 horas siguientes a la autorización médica; cada día que pasa después de ese plazo es incumplimiento.

El dispensario no falla por falta de información: tiene inventario, fórmulas activas, fechas de vencimiento y pacientes esperando. Falla porque todo vive desconectado. El paciente aparece sin saber si hay stock. Los medicamentos se vencen mientras otros pacientes siguen esperando.

**MediAgent es la capa operativa que conecta esos sistemas, llama al paciente y cierra la entrega antes de que el problema se convierta en tutela.**

Lee la propuesta completa en [`pitch.md`](./pitch.md) y el alcance funcional en [`MediAgent_Scope_Consolidado.md`](./MediAgent_Scope_Consolidado.md).

---

## Stack

| Capa             | Tecnología                                          |
| ---------------- | --------------------------------------------------- |
| Hosting          | Railway (Next.js fullstack, plan Hobby always-on)   |
| Framework        | Next.js 15 (App Router) · TypeScript · Tailwind v4  |
| UI               | shadcn/ui + diseño propio (Wise-derived, sage/lima) |
| Base de datos    | Supabase Postgres + Realtime                        |
| Voz (orquestador)| Vapi (envuelve Twilio + STT + LLM + TTS)            |
| STT              | Deepgram Nova-2 (es)                                |
| LLM              | OpenAI GPT-4o (fallback: GPT-4o-mini)               |
| TTS              | ElevenLabs Valentina (es-CO)                        |
| Autenticación    | Últimos 4 dígitos de la cédula del paciente         |

> Decisiones bloqueadas: los modelos voice-native (GPT-4o Realtime, Gemini Live) están descartados porque no tienen voces colombianas, y el acento es parte del producto. Pipeline = texto-LLM + ElevenLabs.

---

## Estructura del proyecto

```
src/
  app/
    page.tsx              # Landing pública (/)
    layout.tsx            # Layout raíz (sin shell)
    (app)/                # Route group autenticado
      layout.tsx          # AppShell (sidebar + topbar)
      dashboard/          # /dashboard — operación del día
      llamadas/           # /llamadas — disparar y monitorear
      agenda/             # /agenda — pedidos del día
      orden-medica/       # /orden-medica — búsqueda + orden + llamada
    api/                  # Endpoints (webhooks Vapi, dashboard, calls)
  components/
    dashboard/            # Hero KPI, Funnel, CallCenter, ActivityStream
    agenda/  llamadas/    # Vistas operativas
    shell/                # AppShell, Sidebar, Topbar
    ui/                   # shadcn
  lib/
    supabase/             # Cliente y server actions
    vapi/                 # Config del asistente + helpers
    tools/                # Tool definitions del agente
    kpis/  lifecycle/     # Estado y métricas

supabase/
  migrations/             # Esquema versionado
  seed.sql                # Data de demo

scripts/
  sync-assistant.mjs      # Sincroniza el asistente de Vapi con la config en código
  warmup.sh               # Warm-up call antes del demo
```

---

## Quick start

### 1. Instalar

```bash
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` con:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Vapi
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
```

### 3. Base de datos

Corre las migraciones contra tu proyecto de Supabase y aplica el seed:

```bash
# Aplica las migraciones desde supabase/migrations/ usando el CLI o el SQL editor.
# Luego carga datos de demo:
psql "$SUPABASE_URL" -f supabase/seed.sql
```

### 4. Asistente de Vapi

Sincroniza el asistente con la config versionada:

```bash
node scripts/sync-assistant.mjs --check   # ver diff
node scripts/sync-assistant.mjs           # aplicar
```

### 5. Dev server

```bash
npm run dev
```

- Landing: [http://localhost:3000](http://localhost:3000)
- Tablero: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## Scripts

| Comando              | Descripción                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Dev server con HMR                         |
| `npm run build`      | Build de producción                        |
| `npm run start`      | Sirve el build                             |
| `npm run lint`       | ESLint                                     |
| `npm run test`       | Vitest (single run)                        |
| `npm run test:watch` | Vitest (watch)                             |

---

## Documentación

| Doc                                                  | Para qué                                         |
| ---------------------------------------------------- | ------------------------------------------------ |
| [`pitch.md`](./pitch.md)                             | Guión del pitch de 3 minutos                     |
| [`MediAgent_Scope_Consolidado.md`](./MediAgent_Scope_Consolidado.md) | Alcance funcional cerrado del MVP        |
| [`docs/architecture.md`](./docs/architecture.md)     | Arquitectura técnica y presupuesto de latencia   |
| [`docs/contracts.md`](./docs/contracts.md)           | Contratos de datos y API                         |
| [`docs/design-style.md`](./docs/design-style.md)     | Sistema visual                                   |
| [`docs/latency-optimization-plan.md`](./docs/latency-optimization-plan.md) | 10 optimizaciones para mantener ≤1.2s/turno |
| [`CLAUDE.md`](./CLAUDE.md)                           | Notas operativas para asistentes de código       |

---

## Convenciones

- **Branches:** hackathon mode — trabajamos directo en `main` y coordinamos por voz/Slack.
- **Commits:** en inglés. Sin `Co-Authored-By`.
- **Comentarios:** en inglés. Por defecto, ninguno: solo cuando el "por qué" no es obvio.
- **Copy en la app:** español, registro colombiano.
- **Deploys:** Railway auto-deploya en push a `main`. **Nunca deployar dentro de los 10 minutos previos a un demo en vivo.**

---

## Demo en vivo — checklist operativo

1. Warm-up call 60s antes de cada ronda (`scripts/warmup.sh`).
2. Tener un video de respaldo de un run end-to-end completo.
3. Segundo número de Twilio en standby por si hay problemas de carrier.
4. Monitorear logs de Railway en una pantalla aparte durante el demo.
5. Confirmar que `/dashboard` muestra el `live-dot` verde antes de empezar.

---

## Equipo

3 fullstack devs · sprint de 48 horas · Hackathon Barranqui-IA · Mayo 2026.
