# MediAgent — Arquitectura Técnica

> Documento de referencia del stack y decisiones. Para el scope funcional ver `MediAgent_Scope_Consolidado.md`.

---

## 1. Resumen ejecutivo

MediAgent es un agente de voz outbound para dispensación de medicamentos. La arquitectura prioriza:

1. **Voz con acento colombiano** — el agente debe sonar local, no neutro internacional.
2. **Baja latencia conversacional** — objetivo ≤1.2s por turno, suelo realista del pipeline tradicional.
3. **Dashboard en tiempo real** — la cita aparece en pantalla mientras el jurado escucha la llamada.
4. **Simplicidad operativa para 48h** — un solo repo, un solo deploy, un solo lenguaje (TypeScript end-to-end).

---

## 2. Stack final

| Capa | Tecnología | Notas |
|---|---|---|
| **Hosting** | **Railway (plan Hobby, $5/mes)** | Next.js fullstack always-on. Cero cold starts entre requests. |
| **Framework** | **Next.js 15 (App Router) + TypeScript** | Un solo repo: dashboard + Route Handlers para webhooks de Vapi |
| **UI** | **Tailwind + shadcn/ui** | Look profesional sin partir de cero |
| **Base de datos** | **Supabase Postgres** | Schema relacional, 6 tablas. Realtime sólo en `appointments` y `call_logs` |
| **Realtime dashboard** | **Supabase Realtime client** | Updates automáticos sin escribir WebSockets |
| **Orquestador de voz** | **Vapi** | Abstrae Twilio + STT + LLM + TTS + turn-taking + barge-in |
| **Telefonía** | **Twilio (número outbound CO)** | Vapi lo enchufa |
| **STT** | **Deepgram Nova-2 (es)** | Provider dentro de Vapi |
| **LLM** | **OpenAI GPT-4o** | Provider dentro de Vapi. Plan B: GPT-4o-mini si latencia molesta |
| **TTS** | **ElevenLabs Valentina (es-CO)** | Provider dentro de Vapi. Streaming activado |
| **Auth paciente** | **Últimos 4 dígitos de la cédula** | No PIN. Más natural en boca del agente, sin memoria nueva para el paciente |

---

## 3. Diagrama de flujo

```
┌─────────────────────────────────────────────────────────────┐
│  Railway — Next.js fullstack                                │
│                                                             │
│   Dashboard (React + Supabase Realtime client)              │
│   │                                                         │
│   │  "Llamar paciente" (botón)                              │
│   ▼                                                         │
│   POST /api/calls/start ──┐                                 │
│                           │                                 │
│   Route Handlers (tools): │                                 │
│   /api/tools/verify-cc    │                                 │
│   /api/tools/check-stock  │                                 │
│   /api/tools/schedule     │                                 │
└───────────┬───────────────┼─────────────────────────────────┘
            │ webhook       │ create call
            │ (tool calls)  ▼
            │      ┌─────────────────┐
            │      │      Vapi       │
            │      └────────┬────────┘
            │               │
            │      ┌────────┴────────────────────────┐
            │      ▼                                  ▼
            │   Twilio (número CO)              Providers:
            │      │                            • Deepgram (STT)
            │      ▼                            • GPT-4o (LLM)
            │   Teléfono paciente               • ElevenLabs Valentina (TTS)
            │
            ▼
       ┌─────────────────┐         realtime push
       │ Supabase Postgres├──────────────► Dashboard se actualiza
       └─────────────────┘
```

---

## 4. Modelo de datos (Supabase)

```sql
patients (
  id              uuid pk,
  full_name       text,
  phone_e164      text unique,    -- "+573001234567"
  last_4_cc       text,           -- "4729" — auth
  birth_date      date,
  created_at      timestamptz default now()
)

medications (
  id              uuid pk,
  name            text,           -- "Losartán 50mg"
  presentation    text,
  stock_qty       int,
  expires_at      date,
  reorder_eta_days int             -- para stock parcial / domicilio
)

prescriptions (
  id              uuid pk,
  patient_id      uuid fk -> patients,
  status          text,           -- 'ready' | 'scheduled' | 'picked_up' | 'expiring_soon'
  created_at      timestamptz default now()
)

prescription_items (
  id              uuid pk,
  prescription_id uuid fk,
  medication_id   uuid fk,
  qty             int,
  fulfilled       boolean default false
)

appointments (
  id              uuid pk,
  prescription_id uuid fk,
  slot_start      timestamptz,
  slot_end        timestamptz,
  status          text,           -- 'scheduled' | 'completed' | 'no_show'
  copay_cents     int,
  delivery_for_pending boolean,
  delivery_date   date,
  created_at      timestamptz default now()
)

call_logs (
  id              uuid pk,
  patient_id      uuid fk,
  vapi_call_id    text,
  outcome         text,           -- 'auth_failed' | 'scheduled' | 'no_answer' | 'rejected'
  started_at      timestamptz,
  ended_at        timestamptz
)
```

**Realtime habilitado solo en `appointments` y `call_logs`** — son las tablas que el dashboard escucha.

**Índices necesarios:** `patients.phone_e164`, `patients.last_4_cc`, `prescriptions.patient_id`, `appointments.prescription_id`.

---

## 5. Flujo end-to-end del demo

1. Operador (jurado) ve en dashboard una alerta roja: "Doña Luz Marina — medicamento vence en 2 días"
2. Operador hace click en "Llamar" → `POST /api/calls/start` → Vapi inicia outbound call
3. Twilio marca al móvil del jurado
4. Jurado contesta. Agente saluda con voz Valentina es-CO
5. Agente pide los **últimos 4 dígitos de la cédula** → tool `verify-cc` valida
6. Agente confirma stock vía tool `check-stock`
7. **Caso stock completo:** agente propone franja horaria → tool `schedule-appointment` → INSERT en `appointments`
8. **Caso stock parcial:** agente agenda lo disponible + propone fecha de domicilio para lo pendiente
9. Agente informa copago hardcoded ("Su copago es de $5.800")
10. INSERT en `appointments` dispara Supabase Realtime → dashboard muestra la cita aparecer en vivo
11. Llamada termina, `call_logs` registra outcome

---

## 6. Decisiones clave (y por qué)

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Railway always-on | Vercel Lambda | Cold starts en serverless dañan latencia de voz; Railway Hobby ($5) los elimina |
| Next.js fullstack en un solo deploy | Backend separado en Express/Hono | 3 fullstack + 48h = simplicidad. Un repo, un deploy |
| Vapi como orquestador | Twilio Media Streams + WebSockets manuales | Vapi ahorra ~1 día de plomería de audio streaming |
| Pipeline tradicional (Deepgram + GPT-4o + ElevenLabs) | GPT-4o Realtime / Gemini Live (voice-native) | Voice-native no tiene voz colombiana — rompe el demo |
| GPT-4o (no GPT-4o-mini) | GPT-4o-mini | Mejor seguimiento de prompt complejo. Probar mini si latencia molesta |
| ElevenLabs Valentina (es-CO) | Twilio `<Say>` Polly, Azure es-CO | Única voz que suena auténticamente colombiana |
| Últimos 4 de cédula | PIN nuevo de 4 dígitos | El paciente ya conoce su cédula, no memoriza nada nuevo |
| Supabase Postgres | DynamoDB | Modelo relacional es 3x más rápido de iterar en 48h |
| OpenAI API directa | AWS Bedrock | Bedrock requiere request de acceso al modelo; OpenAI key es instantáneo |
| Trigger manual de llamada en demo | Cron automático | El jurado dispara la llamada en vivo — más visible y dramático |

---

## 7. 10 optimizaciones de latencia (aplicar desde el día 0)

Suelo absoluto del pipeline tradicional bien afinado: **~700-900ms por turno**.

| # | Optimización | Ahorro esperado |
|---|---|---|
| 1 | **Railway always-on** (Hobby plan) — cero cold starts | -500 a -2000ms en el primer turno |
| 2 | **Streaming TTS explícito** en ElevenLabs (Vapi config) | -300 a -600ms por turno |
| 3 | **Endpointing agresivo** (200-300ms en Vapi, default ~500ms) | -200 a -300ms percibidos |
| 4 | **Tools "fat"** (un solo `get_patient_context` que devuelve todo el contexto, en vez de 4 tools chicas) | -1 a -3s en el peor turn |
| 5 | **System prompt corto** (<1500 tokens) | -100 a -300ms cada turno |
| 6 | **Acknowledgment phrases** ("Un momento, doña Luz, déjeme verificar...") antes de tool calls | enmascara hasta 2s de latencia percibida |
| 7 | **Filler audio / ambient sounds** durante procesamiento (Vapi `backgroundSound`) | enmascara latencia |
| 8 | **Pre-warm call** 60s antes del demo (llamada de prueba) | elimina cualquier startup time residual |
| 9 | **Índices en `patients.phone_e164` y `patients.last_4_cc`** | -50ms por query |
| 10 | **Plan B: GPT-4o-mini** si testing inicial muestra que sigue el prompt bien | -300 a -500ms cada turno |

---

## 8. Plan de validación A/B de latencia

**Antes de comprometerse al stack final, hacer un test A/B en las primeras 2-3 horas del sprint.**

| Assistant | Stack | Para qué sirve |
|---|---|---|
| **A — el oficial** | Vapi · Deepgram Nova-2 · GPT-4o · ElevenLabs Valentina | El stack del demo |
| **B — benchmark** | **Gemini Live** (voice-native) | Medir cuánta latencia se gana sacrificando acento CO |

**Procedimiento:**
1. Crear ambos assistants en Vapi
2. Hacer 3-5 llamadas a cada uno con el mismo guión hablado
3. Comparar latencias en Vapi call logs (TTFB + end-of-speech-to-response)
4. Juzgar cualitativamente el acento de Gemini Live en español

**Criterio de decisión:**
- Si Gemini Live es **>500ms más rápido Y el acento suena aceptable** → reconsiderar
- Caso contrario → **Assistant A es el ganador, fin de discusión**

---

## 9. Variables de entorno

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vapi
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=

# OpenAI (LLM dentro de Vapi)
OPENAI_API_KEY=

# ElevenLabs (TTS dentro de Vapi)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=   # Valentina es-CO

# Twilio (número outbound dentro de Vapi)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
WEBHOOK_SECRET=         # para validar webhooks de Vapi
```

**Compartir vía 1Password o `.env` cifrado.** No commit al repo.

---

## 10. Deploy en Railway

1. `railway login`
2. `railway init` en la raíz del repo
3. Setear env vars en el dashboard de Railway
4. `git push` → deploy automático
5. Apuntar webhooks de Vapi al dominio Railway (ej. `https://mediagent.up.railway.app/api/tools/*`)

**Plan Hobby ($5/mes) obligatorio** — el trial gratis puede tener sleep.

---

## 11. Scope cortado para 48h

**Entra al demo (MUST):**
- Motor proactivo: trigger manual desde dashboard (no cron real)
- Llamada outbound vía Vapi
- Autenticación por últimos 4 de cédula
- Confirmación de stock (completo y parcial)
- Agendamiento de turno por voz
- Dashboard con stock + órdenes + alerta roja + realtime
- Info de copago (hardcoded en voz, no calculado)
- Manejo verbal de "no puedo esa hora" (sólo en prompt, sin lógica extra)

**Recortado (no se construye):**
- Recordatorio de toma post-recogida
- Recordatorio 2h antes del turno
- Alerta a familiar tras 2 no-contactos
- Link de pago Nequi por SMS
- Cron automático del motor proactivo
- Flujo posterior de entrega a domicilio (sí se agenda verbalmente y se inserta el registro, pero no hay seguimiento)
- Generación de QR

**Regla de oro:** si un feature no aparece en los 3 minutos del guión de demo, no se construye.

---

## 12. Riesgos conocidos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Vapi caído durante demo | **Video grabado de respaldo** del demo end-to-end |
| Acento del jurado confunde al STT con el "4729" | Prompt incluye instrucción de pedir dígito por dígito si falla la primera vez |
| Latencia molesta en demo | Plan B: cambiar a GPT-4o-mini en 10 segundos modificando JSON en Vapi |
| Cold start tras inactividad larga | Script de warm-up que pinga endpoints cada 4 min durante el evento |
| Deploy fallido durante demo | **NO desplegar dentro de los 10 minutos previos a cada demo** |
| Twilio bloquea número outbound | Tener un segundo número de respaldo registrado |
| Realtime de Supabase no actualiza | Fallback: polling cada 2s en el dashboard como backup |

---

*Documento de arquitectura · Hackathon Barranqui-IA · Mayo 2026*
