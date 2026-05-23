# MediAgent 12h Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the MediAgent live demo in 12 hours: an outbound voice agent that authenticates patients by the last 4 digits of their cédula, schedules pickup appointments (including partial-stock delivery scheduling), and reflects everything in a real-time dashboard the dispenser operator controls.

**Architecture:** Next.js fullstack hosted on Railway (always-on, no cold starts). Vapi orchestrates the voice layer (Twilio + Deepgram + GPT-4o + ElevenLabs Valentina es-CO). Supabase Postgres holds patients/medications/prescriptions/appointments with Realtime publishing for the dashboard. Three parallel work streams (Voice, Backend, Frontend) converging at scheduled integration checkpoints.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Supabase Postgres + Realtime, Vapi, Twilio, Deepgram Nova-2, OpenAI GPT-4o, ElevenLabs Valentina (es-CO), Railway.

---

## How to use this plan

**Three parallel work streams, one document.**

| Stream | Branch | Owner | Surface |
|---|---|---|---|
| **Voice** | `voice` | **Wilson** | Vapi configuration, agent prompt, voice tuning, A/B latency |
| **Backend** | **`main`** (direct) | **Miguel** | **CRITICAL PATH.** Schema, seeds, tools API, realtime publication |
| **Frontend** | `frontend` | **Jose** | Next.js app, dashboard UI, realtime subscription |

Backend publishes contracts that Voice and Frontend consume. Hour 0–1 is **shared setup** — all three together. After that each dev follows their stream's tasks and pauses at **checkpoints** to integrate.

### Git workflow

**Miguel works directly on `main`** because Backend is the critical path and Railway only deploys from `main`. Every Miguel commit triggers a Railway deploy that exposes the tool endpoints Vapi needs.

**Wilson and Jose work on dedicated branches** (`voice`, `frontend`) and merge to `main` at every checkpoint (h3, h6, h9).

```
Initial setup (h0):

  git checkout main && git pull
  # Wilson:
  git checkout -b voice && git push -u origin voice
  # Jose:
  git checkout -b frontend && git push -u origin frontend
  # Miguel: stays on main


Normal work (between checkpoints):

  # Miguel — direct push to main:
  git add . && git commit -m "feat: ..." && git push

  # Wilson / Jose — work on their branch:
  git add . && git commit -m "feat: ..." && git push


At every checkpoint (h3, h6, h9) — Wilson and Jose merge to main:

  git fetch origin
  git rebase origin/main        # pull in Miguel's work
  # resolve conflicts if any
  git push --force-with-lease   # update remote branch

  git checkout main
  git pull
  git merge --no-ff voice       # or frontend
  git push                      # triggers Railway deploy

  git checkout voice            # back to your branch
  git rebase main
  git push --force-with-lease
```

### Communication rules

- **Voice channel always open** (Discord/Meet/Slack call).
- Anyone modifying `package.json`, `.env.example`, or `src/app/layout.tsx`: announce verbally first.
- Miguel announces every new endpoint pushed: "ya está `POST /api/tools/schedule-appointment` en main".
- If a checkpoint fails (something broken), parallel work stops and the team triages together.

### Commit rules

- Commits in English. **NEVER include `Co-Authored-By` trailer.**
- Commit at the end of every task (most tasks have an explicit commit step).

---

## Hour-by-hour structure

| Hour | Activity |
|---|---|
| 0–1 | **Phase 0** — Shared setup |
| 1–3 | **Phase 1** — Parallel foundations |
| **3** | **✅ Checkpoint 1** — schema seeded, tool stubs respond, dashboard renders seed data |
| 3–6 | **Phase 2** — Core flows |
| **6** | **✅ Checkpoint 2** — first end-to-end call works |
| 6–9 | **Phase 3** — Edge cases, error handling, partial stock |
| **9** | **✅ Checkpoint 3** — **FEATURE FREEZE.** Bugfixes only |
| 9–11 | **Phase 4** — Demo polish (prompt tuning, copy) |
| 11–12 | **Phase 5** — Rehearsal + video backup + final deploy |

---

# Phase 0 — Shared Setup (Hour 0–1)

> All three devs together. Do these tasks in order. Block on each before moving on.

## Task 0.1 — Provision accounts and credentials

**Owner:** All three (parallel sub-tasks)

**Step 1: Each dev creates / confirms accounts**

Distribute across the team:
- **Wilson:** Vapi account → `dashboard.vapi.ai`. Twilio account → `console.twilio.com`. Buy one Colombian (+57) or US (+1) outbound-enabled number. ElevenLabs account → `elevenlabs.io`, choose voice **Valentina** (or equivalent es-CO), copy voice ID.
- **Miguel:** Supabase account → `supabase.com`, create new project named `mediagent`. Note URL, anon key, service role key. Railway account → `railway.com`, upgrade to Hobby plan ($5).
- **Jose:** OpenAI API key from `platform.openai.com` (confirm has credit). Vercel account is NOT needed (we deploy to Railway).

**Step 2: Share keys in a single .env.local file**

One dev creates a shared `.env.local` and circulates via 1Password / secure channel. Template:

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vapi
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=
VAPI_ASSISTANT_ID=          # filled in Task 0.4

# OpenAI (used by Vapi)
OPENAI_API_KEY=

# ElevenLabs (used by Vapi)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=        # Valentina es-CO id

# Twilio (used by Vapi)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=        # set after first Railway deploy
WEBHOOK_SECRET=             # generate any random 32-char string
```

**Step 3: Verify each key works**

```bash
# Quick smoke test for OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | head -20
```

Expected: JSON response listing models including `gpt-4o`.

**Step 4: Commit empty .env.example with placeholder names (no real keys)**

```bash
cp .env.local .env.example   # then strip values manually
git add .env.example
git commit -m "chore: add .env.example template"
```

---

## Task 0.2 — Bootstrap Next.js repository

**Owner:** Miguel (then push for others to pull)

**Step 1: Initialize Next.js 15 app in repo root**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint \
  --no-turbopack
```

Choose: TypeScript yes, Tailwind yes, App Router yes, src/ dir yes, alias `@/*`.

**Step 2: Install runtime dependencies**

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  zod \
  date-fns
```

**Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

Choose: Default style, Slate base color, CSS variables yes.

**Step 4: Install a baseline set of shadcn components**

```bash
npx shadcn@latest add button card badge table dialog input label sonner
```

**Step 5: Verify it builds**

```bash
npm run build
```

Expected: Build succeeds, no errors.

**Step 6: Commit**

```bash
git add .
git commit -m "feat: bootstrap Next.js 15 app with Tailwind and shadcn/ui"
git push
```

Wilson and Jose: `git pull` and `npm install` to sync. Then create their branches:

```bash
# Wilson
git checkout -b voice && git push -u origin voice

# Jose
git checkout -b frontend && git push -u origin frontend
```

---

## Task 0.3 — Provision Supabase schema and seed

**Owner:** Miguel

**Step 1: Create the schema migration file**

Create `supabase/migrations/0001_init.sql`:

```sql
create extension if not exists "uuid-ossp";

create table patients (
  id              uuid primary key default uuid_generate_v4(),
  full_name       text not null,
  phone_e164      text unique not null,
  last_4_cc       text not null,
  birth_date      date,
  created_at      timestamptz default now()
);
create index on patients (phone_e164);
create index on patients (last_4_cc);

create table medications (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  presentation    text,
  stock_qty       int not null default 0,
  expires_at      date,
  reorder_eta_days int default 7
);

create table prescriptions (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id),
  status          text not null default 'ready',
  created_at      timestamptz default now()
);
create index on prescriptions (patient_id);
create index on prescriptions (status);

create table prescription_items (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medication_id   uuid not null references medications(id),
  qty             int not null default 1,
  fulfilled       boolean not null default false
);
create index on prescription_items (prescription_id);

create table appointments (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid not null references prescriptions(id),
  slot_start      timestamptz not null,
  slot_end        timestamptz not null,
  status          text not null default 'scheduled',
  copay_cents     int default 0,
  delivery_for_pending boolean default false,
  delivery_date   date,
  created_at      timestamptz default now()
);
create index on appointments (prescription_id);

create table call_logs (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid references patients(id),
  vapi_call_id    text,
  outcome         text,
  started_at      timestamptz,
  ended_at        timestamptz
);

-- Enable Realtime on appointments and call_logs only
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table call_logs;
```

**Step 2: Apply migration via Supabase SQL editor**

Open Supabase dashboard → SQL Editor → paste the migration → Run.

Expected: All tables created without errors. Check via Table Editor that the 6 tables exist.

**Step 3: Create seed file**

Create `supabase/seed.sql`:

```sql
-- 3 demo patients (use real phone numbers of team + jury)
insert into patients (id, full_name, phone_e164, last_4_cc, birth_date) values
  ('11111111-1111-1111-1111-111111111111', 'Luz Marina Patiño', '+573001112233', '4729', '1952-04-12'),
  ('22222222-2222-2222-2222-222222222222', 'José Antonio Restrepo', '+573004445566', '8814', '1948-09-23'),
  ('33333333-3333-3333-3333-333333333333', 'Carmen Rosa Bedoya', '+573007778899', '3105', '1955-11-30');

-- Medications
insert into medications (id, name, presentation, stock_qty, expires_at, reorder_eta_days) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Losartán 50mg', 'Caja x 30 tabletas', 40, '2026-06-15', 5),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Metformina 850mg', 'Caja x 60 tabletas', 8, '2026-05-25', 3),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Atorvastatina 20mg', 'Caja x 30 tabletas', 0, '2026-08-01', 4),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Enalapril 10mg', 'Caja x 30 tabletas', 22, '2026-05-26', 5);

-- Prescription for Luz Marina — partial stock case (Atorvastatina out of stock)
insert into prescriptions (id, patient_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ready');

insert into prescription_items (prescription_id, medication_id, qty) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 1);

-- Prescription for José — full stock
insert into prescriptions (id, patient_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'ready');

insert into prescription_items (prescription_id, medication_id, qty) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004', 1);

-- Prescription for Carmen — expiring soon
insert into prescriptions (id, patient_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'expiring_soon');

insert into prescription_items (prescription_id, medication_id, qty) values
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 2);
```

**Step 4: Apply seed via SQL editor**

Paste and Run. Verify via Table Editor:
- 3 patients
- 4 medications (one with stock 0)
- 3 prescriptions (one expiring, one full, one partial)

**Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema and seed data"
git push
```

---

## Task 0.4 — Create Vapi assistant skeleton

**Owner:** Wilson

**Step 1: Create assistant in Vapi dashboard**

Go to `dashboard.vapi.ai` → Assistants → Create.

Configuration (set via UI for now, we'll iterate):
- **Name:** `MediAgent`
- **First Message:** `Hola, le habla MediAgent del dispensario. ¿Hablo con la persona del medicamento?`
- **Model:** OpenAI · `gpt-4o`
- **Transcriber:** Deepgram · `nova-2` · language `es`
- **Voice:** 11labs · model `eleven_turbo_v2_5` · voice ID (Valentina es-CO from .env)
- **Server URL:** `https://<your-railway-url>/api/vapi/webhook` (placeholder for now, fix after first Railway deploy in Task 0.6)
- **End Call Phrases:** `["gracias por su tiempo", "que tenga buen día"]`
- **Background Sound:** `office` (masks latency)

System prompt: leave empty for now — Wilson will write it in Task V.2.

**Step 2: Save the Assistant ID into `.env.local`**

Copy the assistant ID from the URL bar or settings page.

Set in `.env.local`:
```bash
VAPI_ASSISTANT_ID=<assistant_id>
```

**Step 3: Assign the Twilio phone number to the assistant**

Vapi dashboard → Phone Numbers → Import from Twilio (paste Account SID + Auth Token + number). Confirm the number appears with status "Active". Note the Phone Number ID.

Set in `.env.local`:
```bash
VAPI_PHONE_NUMBER_ID=<phone_number_id>
```

**Step 4: Quick smoke test via Vapi dashboard**

In the dashboard, click "Talk to Assistant" → speak briefly. Expect to hear Valentina's voice respond in Spanish.

**Step 5: Commit shared notes (no real keys)**

Update `.env.example` if any new vars were added. Commit:

```bash
git add .env.example
git commit -m "chore: add Vapi assistant and phone number env vars"
git push
```

---

## Task 0.5 — Agree on the tool API contracts

**Owner:** All three together. **This unblocks everything downstream.**

**Step 1: Write the contracts file**

Create `docs/contracts.md`:

```markdown
# Tool API Contracts

All tool endpoints are POST `application/json` and respond `200` with JSON.

## POST /api/tools/get-patient-context

**Purpose:** "Fat" tool — Vapi calls this once at the start of the conversation to get everything about the patient.

**Request body (from Vapi tool call):**
```json
{
  "message": {
    "toolCalls": [{
      "id": "string",
      "function": {
        "name": "get_patient_context",
        "arguments": { "phone_e164": "+573001112233" }
      }
    }]
  }
}
```

**Response:**
```json
{
  "results": [{
    "toolCallId": "string",
    "result": {
      "patient": {
        "id": "uuid",
        "full_name": "Luz Marina Patiño",
        "first_name": "Luz Marina",
        "honorific": "Doña"
      },
      "prescription": {
        "id": "uuid",
        "items": [
          { "name": "Losartán 50mg", "presentation": "Caja x 30 tabletas", "qty": 1, "available": true },
          { "name": "Atorvastatina 20mg", "presentation": "Caja x 30 tabletas", "qty": 1, "available": false, "reorder_eta_days": 4 }
        ],
        "all_available": false,
        "available_count": 1,
        "pending_count": 1
      },
      "suggested_slots": [
        "2026-05-24T09:00:00-05:00",
        "2026-05-24T10:30:00-05:00",
        "2026-05-24T14:00:00-05:00"
      ],
      "default_copay_cop": 5800
    }
  }]
}
```

## POST /api/tools/verify-cc

**Request:**
```json
{ "message": { "toolCalls": [{ "id": "...", "function": { "name": "verify_cc", "arguments": { "patient_id": "uuid", "last_4_cc": "4729" } }}]}}
```

**Response:**
```json
{ "results": [{ "toolCallId": "...", "result": { "valid": true } }] }
```

## POST /api/tools/schedule-appointment

**Request:**
```json
{ "message": { "toolCalls": [{ "id": "...", "function": { "name": "schedule_appointment", "arguments": {
  "prescription_id": "uuid",
  "slot_start": "2026-05-24T09:00:00-05:00",
  "copay_cents": 580000,
  "delivery_for_pending": true,
  "delivery_date": "2026-05-28"
}}}]}}
```

**Response:**
```json
{ "results": [{ "toolCallId": "...", "result": {
  "appointment_id": "uuid",
  "slot_start": "2026-05-24T09:00:00-05:00",
  "slot_end": "2026-05-24T09:15:00-05:00",
  "confirmation_message": "Listo doña Luz. Su turno es mañana a las nueve."
}}]}
```

## POST /api/calls/start

**Internal endpoint called by the dashboard when the operator clicks "Llamar".**

**Request:**
```json
{ "patient_id": "uuid" }
```

**Response:**
```json
{ "call_id": "vapi_call_id", "status": "queued" }
```

## POST /api/vapi/webhook

**Vapi sends server events here.** Validate `x-vapi-secret` header against `WEBHOOK_SECRET`.

Events relevant to us:
- `call-start` — insert into `call_logs`
- `call-end` — update `call_logs.outcome` and `ended_at`
- `tool-calls` — actually routed via the specific tool endpoints above (Vapi can be configured this way)
```

**Step 2: Commit and notify both other devs**

```bash
git add docs/contracts.md
git commit -m "docs: define tool API contracts for Vapi integration"
git push
```

Now V can build the assistant prompt referencing these tool names; F can call `/api/calls/start` and subscribe to realtime; B implements the bodies.

---

## Task 0.6 — Deploy empty app to Railway

**Owner:** Miguel

**Step 1: Connect Railway to the repo**

In Railway dashboard → New Project → Deploy from GitHub → select `hackaton-barranquiia/turnos-agent` → main branch.

Railway auto-detects Next.js and starts building.

**Step 2: Add all env vars in Railway dashboard**

Project → Variables → Raw Editor → paste contents of `.env.local`.

**Step 3: Configure custom domain or note generated URL**

Settings → Networking → Generate Domain. Copy URL like `https://mediagent-production.up.railway.app`.

Update `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://mediagent-production.up.railway.app
```

Also update in Railway dashboard variables.

**Step 4: Wait for first deploy to succeed**

Watch logs. Expected: `Deployed successfully` and the URL returns the default Next.js homepage.

**Step 5: Update Vapi assistant Server URL**

Wilson: go back to Vapi dashboard → assistant → set Server URL to `https://<railway-url>/api/vapi/webhook`.

**Step 6: Commit**

```bash
git commit --allow-empty -m "chore: deploy initial app to Railway"
git push
```

---

# Phase 1 — Parallel Foundations (Hour 1–3)

> Each dev follows their own stream. Pause at Checkpoint 1.

## Stream Voice — Wilson

> Branch: `voice`. Merge to `main` at every checkpoint.

### Task V.1 — Set up Vapi voice and TTS tuning

**Files:** Configuration only, via Vapi dashboard.

**Step 1: Configure ElevenLabs voice settings on the assistant**

In Vapi → Assistant → Voice section:
- Voice ID: Valentina (from `.env.local`)
- Stability: `0.5`
- Similarity: `0.75`
- Optimize Streaming Latency: `3` (high) — critical for low latency
- Use Speaker Boost: `true`

**Step 2: Configure Deepgram STT**

- Provider: Deepgram
- Model: `nova-2`
- Language: `es`
- Smart Format: `true`
- Endpointing: `200` (ms — aggressive, default is 500)

**Step 3: Configure GPT-4o model**

- Provider: OpenAI
- Model: `gpt-4o`
- Temperature: `0.4`
- Max Tokens: `300` (keep responses short for voice)

**Step 4: Make a test call to yourself**

Dashboard → Make a Call → enter your own number. Confirm:
- Phone rings
- Voice is Valentina (Colombian accent)
- Conversation works (you can talk and get responses)

**Step 5: Note baseline latency**

In the call log, look at "Avg Latency" — should be 800ms–1.5s. Note the number for Checkpoint 2 comparison.

---

### Task V.2 — Write the agent system prompt (v1 happy path)

**Files:** Vapi dashboard (System Prompt field)

**Step 1: Paste this initial prompt into Vapi assistant System Prompt**

```
Eres MediAgent, asistente de voz del dispensario farmacéutico. Hablas con un acento colombiano cálido y respetuoso, especialmente con adultos mayores. Tu voz proyecta cuidado, no urgencia.

REGLAS DE TONO:
- Trata a la persona de "doña" o "don" + nombre cuando sepas su género del nombre.
- Frases cortas. Pausas naturales. No leas todo de corrido.
- Usa muletillas naturales: "muy bien", "perfecto", "claro que sí".
- Si la persona no entiende o pide repetir, repite con paciencia y otras palabras.

FLUJO DE LA LLAMADA:

1. SALUDO Y CONFIRMACIÓN
   - Confirma que hablas con la persona correcta usando su nombre.
   - Si NO es la persona, pregunta amablemente si está disponible. Si no está, despídete y termina.

2. AUTENTICACIÓN
   - Antes de revelar cualquier información médica, pide los últimos cuatro dígitos del documento de identidad (cédula).
   - Llama a la herramienta verify_cc con esos dígitos.
   - Si verify_cc devuelve valid=false, dile amablemente que el código no coincide y pide que repita.
   - Si falla dos veces, despídete sin revelar información y termina la llamada.

3. CONTEXTO
   - Después de autenticar, llama a get_patient_context con el número de teléfono.
   - Anuncia con calidez: "Le tengo lista su fórmula con [X medicamentos]."

4. CONFIRMACIÓN DE STOCK Y AGENDAMIENTO
   - Si all_available = true:
       * "Tenemos todos los medicamentos disponibles en el dispensario."
       * Ofrece DOS horarios de suggested_slots: "¿Le sirve [horario 1] o prefiere [horario 2]?"
       * Cuando confirme, llama a schedule_appointment con el slot elegido y copay_cents=default_copay_cop*100.
   - Si all_available = false:
       * "De los medicamentos formulados, tenemos [N] disponibles. El [nombre] llega en unos [X] días."
       * Ofrece programar el turno para los disponibles ahora, y entrega a domicilio para los pendientes en una fecha aproximada.
       * Llama a schedule_appointment con delivery_for_pending=true y delivery_date calculada.

5. CIERRE
   - Confirma el turno: "Listo doña [nombre]. Su turno es [día] a las [hora]. Su copago es de cinco mil ochocientos pesos."
   - Despídete: "Que tenga muy buen día, doña [nombre]. Gracias por su tiempo."

REGLAS DE HERRAMIENTAS:
- ANTES de cualquier tool call larga, di una frase corta de "estoy pensando": "Un momento, déjeme verificar..." o "Permítame revisar eso".
- NUNCA reveles información médica antes de autenticar.
- Si una herramienta falla, di "Disculpe, tuve un problema técnico. Por favor llame al dispensario directamente" y termina amablemente.

EJEMPLO DE PRIMER TURNO:
Usuario: "Aló"
Tú: "Doña Luz Marina, muy buenos días, le habla MediAgent del dispensario farmacéutico. ¿Hablo con la persona del medicamento?"
```

**Step 2: Save and test via Vapi dashboard test call**

Test call to yourself. Walk through happy path manually. Note any awkward phrasing.

**Step 3: Commit a copy of the prompt to the repo for version tracking**

Create `vapi/prompts/system-prompt-v1.md` with the same content as the prompt.

```bash
git add vapi/prompts/system-prompt-v1.md
git commit -m "feat(voice): add initial agent system prompt v1"
git push
```

---

### Task V.3 — Configure tools in Vapi assistant

**Files:** Vapi dashboard → Tools section, and `vapi/tools.json` for version tracking.

**Step 1: Add `verify_cc` function tool**

Vapi dashboard → Assistant → Tools → Add Function:

```json
{
  "name": "verify_cc",
  "description": "Verifica los últimos 4 dígitos de la cédula del paciente.",
  "parameters": {
    "type": "object",
    "properties": {
      "patient_id": { "type": "string", "description": "UUID del paciente" },
      "last_4_cc": { "type": "string", "description": "Cuatro dígitos exactos" }
    },
    "required": ["patient_id", "last_4_cc"]
  },
  "server": {
    "url": "https://<railway-url>/api/tools/verify-cc"
  }
}
```

**Step 2: Add `get_patient_context` function tool**

```json
{
  "name": "get_patient_context",
  "description": "Obtiene el contexto completo del paciente: datos personales, fórmula activa, disponibilidad de stock y horarios sugeridos. Llamar al inicio de la conversación.",
  "parameters": {
    "type": "object",
    "properties": {
      "phone_e164": { "type": "string", "description": "Número en formato E.164, ej +573001234567" }
    },
    "required": ["phone_e164"]
  },
  "server": {
    "url": "https://<railway-url>/api/tools/get-patient-context"
  }
}
```

**Step 3: Add `schedule_appointment` function tool**

```json
{
  "name": "schedule_appointment",
  "description": "Crea la cita de recogida. Si hay items pendientes por stock, incluye delivery_for_pending y delivery_date.",
  "parameters": {
    "type": "object",
    "properties": {
      "prescription_id": { "type": "string" },
      "slot_start": { "type": "string", "description": "ISO 8601 con timezone -05:00" },
      "copay_cents": { "type": "integer" },
      "delivery_for_pending": { "type": "boolean" },
      "delivery_date": { "type": "string", "description": "YYYY-MM-DD si delivery_for_pending=true" }
    },
    "required": ["prescription_id", "slot_start", "copay_cents"]
  },
  "server": {
    "url": "https://<railway-url>/api/tools/schedule-appointment"
  }
}
```

**Step 4: Commit a copy of the tool definitions**

Create `vapi/tools.json` with all three definitions for repo version tracking.

```bash
git add vapi/tools.json
git commit -m "feat(voice): configure Vapi tools — verify_cc, get_patient_context, schedule_appointment"
git push
```

---

## Stream Backend — Miguel **(critical path)**

> Branch: `main` (direct). Every commit deploys to Railway.

### Task B.1 — Create Supabase client helpers

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

**Step 1: Server client helper**

`src/lib/supabase/server.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}
```

**Step 2: Browser client helper**

`src/lib/supabase/client.ts`:

```ts
"use client";
import { createClient } from "@supabase/supabase-js";

export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

**Step 3: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat(backend): add Supabase client helpers"
git push
```

---

### Task B.2 — Implement `verify_cc` tool with TDD

**Files:**
- Create: `src/lib/tools/verify-cc.ts`
- Create: `src/lib/tools/verify-cc.test.ts`
- Create: `src/app/api/tools/verify-cc/route.ts`

**Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

Add to `package.json` scripts: `"test": "vitest run"`.

**Step 2: Write the failing unit test**

`src/lib/tools/verify-cc.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyCcLogic } from "./verify-cc";

describe("verifyCcLogic", () => {
  it("returns valid=true when last_4_cc matches the patient", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: { last_4_cc: "4729" }, error: null }) }),
        }),
      }),
    } as any;

    const result = await verifyCcLogic(supabase, "patient-id", "4729");
    expect(result.valid).toBe(true);
  });

  it("returns valid=false when codes do not match", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: { last_4_cc: "4729" }, error: null }) }),
        }),
      }),
    } as any;

    const result = await verifyCcLogic(supabase, "patient-id", "9999");
    expect(result.valid).toBe(false);
  });

  it("returns valid=false when patient not found", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: null, error: { message: "not found" } }) }),
        }),
      }),
    } as any;

    const result = await verifyCcLogic(supabase, "missing-id", "0000");
    expect(result.valid).toBe(false);
  });
});
```

**Step 3: Run the test and verify failure**

```bash
npm test
```

Expected: 3 failing tests (`verifyCcLogic` is not defined).

**Step 4: Write the minimal implementation**

`src/lib/tools/verify-cc.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyCcLogic(
  supabase: SupabaseClient,
  patient_id: string,
  last_4_cc: string
): Promise<{ valid: boolean }> {
  const { data, error } = await supabase
    .from("patients")
    .select("last_4_cc")
    .eq("id", patient_id)
    .single();

  if (error || !data) return { valid: false };
  return { valid: data.last_4_cc === last_4_cc };
}
```

**Step 5: Run tests and verify pass**

```bash
npm test
```

Expected: 3 passing tests.

**Step 6: Wire the route handler**

`src/app/api/tools/verify-cc/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyCcLogic } from "@/lib/tools/verify-cc";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body.message?.toolCalls?.[0];
  const args = toolCall?.function?.arguments ?? {};
  const { patient_id, last_4_cc } = args;

  const result = await verifyCcLogic(supabaseServer(), patient_id, last_4_cc);

  return NextResponse.json({
    results: [{ toolCallId: toolCall.id, result }],
  });
}
```

**Step 7: Smoke-test the endpoint locally**

```bash
npm run dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/tools/verify-cc \
  -H "content-type: application/json" \
  -d '{"message":{"toolCalls":[{"id":"t1","function":{"name":"verify_cc","arguments":{"patient_id":"11111111-1111-1111-1111-111111111111","last_4_cc":"4729"}}}]}}'
```

Expected response:
```json
{"results":[{"toolCallId":"t1","result":{"valid":true}}]}
```

**Step 8: Commit**

```bash
git add src/lib/tools/verify-cc.ts src/lib/tools/verify-cc.test.ts src/app/api/tools/verify-cc/route.ts package.json
git commit -m "feat(backend): implement verify_cc tool with unit tests"
git push
```

---

### Task B.3 — Implement `get_patient_context` tool

**Files:**
- Create: `src/lib/tools/get-patient-context.ts`
- Create: `src/lib/tools/get-patient-context.test.ts`
- Create: `src/app/api/tools/get-patient-context/route.ts`

**Step 1: Write failing test**

`src/lib/tools/get-patient-context.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getPatientContextLogic } from "./get-patient-context";

describe("getPatientContextLogic", () => {
  it("returns patient + prescription + suggested slots", async () => {
    const supabase = mockSupabaseWithPatient();
    const result = await getPatientContextLogic(supabase as any, "+573001112233");
    expect(result.patient.first_name).toBe("Luz Marina");
    expect(result.prescription.items.length).toBeGreaterThan(0);
    expect(result.suggested_slots.length).toBe(3);
  });

  it("marks items as unavailable when stock_qty is 0", async () => {
    const supabase = mockSupabaseWithPartialStock();
    const result = await getPatientContextLogic(supabase as any, "+573001112233");
    expect(result.prescription.all_available).toBe(false);
    expect(result.prescription.pending_count).toBeGreaterThan(0);
  });
});

function mockSupabaseWithPatient() {
  // Mock chain: patients.select.eq.single → prescription_items.select(...)
  return {
    from: (table: string) => {
      if (table === "patients") return {
        select: () => ({ eq: () => ({ single: async () => ({
          data: { id: "p1", full_name: "Luz Marina Patiño", phone_e164: "+573001112233" },
          error: null,
        })})}),
      };
      if (table === "prescriptions") return {
        select: () => ({ eq: () => ({ in: () => ({ limit: async () => ({
          data: [{ id: "rx1" }],
          error: null,
        })})})}),
      };
      if (table === "prescription_items") return {
        select: () => ({ eq: async () => ({
          data: [
            { qty: 1, medications: { name: "Losartán 50mg", presentation: "Caja x 30", stock_qty: 40, reorder_eta_days: 5 }},
          ],
          error: null,
        })}),
      };
      return {} as any;
    },
  };
}

function mockSupabaseWithPartialStock() {
  return {
    from: (table: string) => {
      if (table === "patients") return {
        select: () => ({ eq: () => ({ single: async () => ({
          data: { id: "p1", full_name: "Luz Marina Patiño", phone_e164: "+573001112233" },
          error: null,
        })})}),
      };
      if (table === "prescriptions") return {
        select: () => ({ eq: () => ({ in: () => ({ limit: async () => ({
          data: [{ id: "rx1" }],
          error: null,
        })})})}),
      };
      if (table === "prescription_items") return {
        select: () => ({ eq: async () => ({
          data: [
            { qty: 1, medications: { name: "Losartán 50mg", stock_qty: 40, reorder_eta_days: 5 }},
            { qty: 1, medications: { name: "Atorvastatina 20mg", stock_qty: 0, reorder_eta_days: 4 }},
          ],
          error: null,
        })}),
      };
      return {} as any;
    },
  };
}
```

**Step 2: Run, expect failure**

```bash
npm test
```

Expected: failures.

**Step 3: Implement**

`src/lib/tools/get-patient-context.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";

export async function getPatientContextLogic(
  supabase: SupabaseClient,
  phone_e164: string
) {
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, phone_e164")
    .eq("phone_e164", phone_e164)
    .single();

  if (!patient) throw new Error("patient_not_found");

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("id, status")
    .eq("patient_id", patient.id)
    .in("status", ["ready", "expiring_soon"])
    .limit(1);

  const prescription_id = prescriptions?.[0]?.id;
  if (!prescription_id) throw new Error("no_active_prescription");

  const { data: items } = await supabase
    .from("prescription_items")
    .select("qty, medications(name, presentation, stock_qty, reorder_eta_days)")
    .eq("prescription_id", prescription_id);

  const itemList = (items ?? []).map((it: any) => ({
    name: it.medications.name,
    presentation: it.medications.presentation,
    qty: it.qty,
    available: it.medications.stock_qty >= it.qty,
    reorder_eta_days: it.medications.reorder_eta_days,
  }));

  const available_count = itemList.filter((i) => i.available).length;
  const pending_count = itemList.length - available_count;

  const firstName = patient.full_name.split(" ").slice(0, 2).join(" ");
  const honorific = guessHonorific(patient.full_name);

  // Build 3 suggested slots: tomorrow at 9:00, 10:30, 14:00 (Bogotá time -05:00)
  const tomorrow = addDays(new Date(), 1);
  const slot = (h: number, m: number) =>
    `${format(tomorrow, "yyyy-MM-dd")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-05:00`;

  return {
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      first_name: firstName,
      honorific,
    },
    prescription: {
      id: prescription_id,
      items: itemList,
      all_available: pending_count === 0,
      available_count,
      pending_count,
    },
    suggested_slots: [slot(9, 0), slot(10, 30), slot(14, 0)],
    default_copay_cop: 5800,
  };
}

function guessHonorific(fullName: string): "Doña" | "Don" {
  const female = ["Luz", "Maria", "María", "Carmen", "Rosa", "Ana", "Marta", "Lucía", "Patricia"];
  const first = fullName.split(" ")[0];
  return female.some((n) => first.toLowerCase().startsWith(n.toLowerCase())) ? "Doña" : "Don";
}
```

**Step 4: Run tests, expect pass**

```bash
npm test
```

**Step 5: Add route handler**

`src/app/api/tools/get-patient-context/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getPatientContextLogic } from "@/lib/tools/get-patient-context";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body.message?.toolCalls?.[0];
  const { phone_e164 } = toolCall?.function?.arguments ?? {};

  try {
    const result = await getPatientContextLogic(supabaseServer(), phone_e164);
    return NextResponse.json({ results: [{ toolCallId: toolCall.id, result }] });
  } catch (err: any) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: { error: err.message } }],
    });
  }
}
```

**Step 6: Smoke test**

```bash
curl -X POST http://localhost:3000/api/tools/get-patient-context \
  -H "content-type: application/json" \
  -d '{"message":{"toolCalls":[{"id":"t1","function":{"name":"get_patient_context","arguments":{"phone_e164":"+573001112233"}}}]}}' | jq
```

Expected: JSON with patient `Luz Marina Patiño`, prescription with 2 items (one unavailable: Atorvastatina), 3 suggested slots.

**Step 7: Commit**

```bash
git add src/lib/tools/get-patient-context.ts src/lib/tools/get-patient-context.test.ts src/app/api/tools/get-patient-context/route.ts
git commit -m "feat(backend): implement get_patient_context tool with unit tests"
git push
```

---

## Stream Frontend — Jose

> Branch: `frontend`. Merge to `main` at every checkpoint.

### Task F.1 — Build the dashboard layout shell

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/layout.tsx` (modify existing default)
- Create: `src/components/dashboard/header.tsx`

**Step 1: Replace `src/app/page.tsx` with a dashboard skeleton**

```tsx
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fórmulas pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Cargando...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Citas agendadas hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Sin citas todavía.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Create the Header component**

`src/components/dashboard/header.tsx`:

```tsx
export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">MediAgent</h1>
          <p className="text-sm text-slate-500">Panel del dispensario</p>
        </div>
        <div className="text-xs text-slate-400">
          Demo · Datos sintéticos
        </div>
      </div>
    </header>
  );
}
```

**Step 3: Verify locally**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: clean dashboard with header and two empty cards.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/header.tsx
git commit -m "feat(frontend): add dashboard shell with header and empty cards"
git push
```

---

### Task F.2 — Render pending prescriptions from Supabase

**Files:**
- Create: `src/components/dashboard/pending-prescriptions.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Build the prescriptions list component**

`src/components/dashboard/pending-prescriptions.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabaseServer } from "@/lib/supabase/server";

export async function PendingPrescriptions() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("prescriptions")
    .select(`
      id, status, created_at,
      patients(full_name, phone_e164)
    `)
    .in("status", ["ready", "expiring_soon"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-3">
      {(data ?? []).map((rx: any) => (
        <div
          key={rx.id}
          className="flex items-center justify-between rounded-lg border bg-white p-4"
        >
          <div>
            <p className="font-medium">{rx.patients.full_name}</p>
            <p className="text-xs text-slate-500">{rx.patients.phone_e164}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={rx.status === "expiring_soon" ? "destructive" : "secondary"}>
              {rx.status === "expiring_soon" ? "Vence pronto" : "Lista"}
            </Badge>
            <CallButton patientId={rx.patients?.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CallButton({ patientId }: { patientId: string }) {
  return (
    <form action={`/api/calls/start`} method="POST">
      <input type="hidden" name="patient_id" value={patientId} />
      <Button type="submit" size="sm">Llamar</Button>
    </form>
  );
}
```

> Note: this uses a plain form POST as a placeholder. Will be replaced with a client-side fetch + toast in Task F.4 once `/api/calls/start` exists.

**Step 2: Wire into the page**

Modify `src/app/page.tsx`:

```tsx
import { Header } from "@/components/dashboard/header";
import { PendingPrescriptions } from "@/components/dashboard/pending-prescriptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fórmulas pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingPrescriptions />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Citas agendadas hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Sin citas todavía.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

**Step 3: Verify**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: 3 patients listed with their phones and status badges.

**Step 4: Commit**

```bash
git add src/components/dashboard/pending-prescriptions.tsx src/app/page.tsx
git commit -m "feat(frontend): render pending prescriptions from Supabase"
git push
```

---

# ✅ Checkpoint 1 — Hour 3

**All three devs sync. Verify in the next 15 minutes:**

- [ ] Supabase has 3 patients, 4 meds, 3 prescriptions
- [ ] `GET https://<railway-url>/` shows the dashboard with the 3 patients listed
- [ ] `curl POST /api/tools/verify-cc` returns `{ valid: true }` for Luz Marina + `4729`
- [ ] `curl POST /api/tools/get-patient-context` returns full context for `+573001112233`
- [ ] A test call via Vapi dashboard reaches your phone and Valentina greets you in Spanish

If anything is red, fix before proceeding. **Do not enter Phase 2 with a broken checkpoint.**

---

# Phase 2 — Core Flows (Hour 3–6)

## Stream Voice — Wilson

### Task V.4 — End-to-end happy-path call test

**Files:** No code changes — only manual testing and prompt iteration.

**Step 1: Make a call from the Vapi dashboard to a real phone**

Walk through the full happy path with prescription `bbbbbbbb-0000-0000-0000-000000000002` (José, full stock). Note any awkwardness.

**Step 2: Iterate on the prompt**

If the agent stalls, repeats itself, or sounds robotic, edit the system prompt. Common fixes:
- Add specific example phrasings
- Shorten the FLUJO list
- Add explicit ack phrases before tools

**Step 3: Update `vapi/prompts/system-prompt-v1.md` with the final v1 prompt and commit**

```bash
git add vapi/prompts/
git commit -m "fix(voice): tune prompt for happy path stability"
git push
```

---

### Task V.5 — Verify acknowledgment phrases before tool calls

**Files:** Vapi dashboard System Prompt.

**Step 1: Add explicit ack phrasing**

Append to the system prompt:

```
ANTES DE LLAMAR A UNA HERRAMIENTA, di una frase corta:
- Antes de verify_cc: "Permítame validar."
- Antes de get_patient_context: "Un momento, le reviso su fórmula."
- Antes de schedule_appointment: "Voy a agendarle el turno."
```

**Step 2: Test call again, listen for fillers**

The fillers should mask 1–2s of tool call latency.

**Step 3: Commit**

```bash
git commit --allow-empty -m "chore(voice): add ack phrases tuning notes"
git push
```

---

## Stream Backend — Miguel

### Task B.4 — Implement `schedule_appointment` tool

**Files:**
- Create: `src/lib/tools/schedule-appointment.ts`
- Create: `src/lib/tools/schedule-appointment.test.ts`
- Create: `src/app/api/tools/schedule-appointment/route.ts`

**Step 1: Write failing test**

`src/lib/tools/schedule-appointment.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scheduleAppointmentLogic } from "./schedule-appointment";

describe("scheduleAppointmentLogic", () => {
  it("inserts an appointment with 15-min slot", async () => {
    const inserted: any[] = [];
    const supabase = {
      from: () => ({
        insert: (row: any) => ({
          select: () => ({
            single: async () => {
              inserted.push(row);
              return { data: { ...row, id: "appt-1" }, error: null };
            },
          }),
        }),
      }),
    } as any;

    const result = await scheduleAppointmentLogic(supabase, {
      prescription_id: "rx-1",
      slot_start: "2026-05-24T09:00:00-05:00",
      copay_cents: 580000,
      delivery_for_pending: false,
    });

    expect(result.appointment_id).toBe("appt-1");
    expect(inserted[0].slot_end).toContain("09:15:00");
  });

  it("includes delivery date when delivery_for_pending=true", async () => {
    const inserted: any[] = [];
    const supabase = {
      from: () => ({
        insert: (row: any) => ({
          select: () => ({
            single: async () => {
              inserted.push(row);
              return { data: { ...row, id: "appt-2" }, error: null };
            },
          }),
        }),
      }),
    } as any;

    await scheduleAppointmentLogic(supabase, {
      prescription_id: "rx-2",
      slot_start: "2026-05-24T09:00:00-05:00",
      copay_cents: 580000,
      delivery_for_pending: true,
      delivery_date: "2026-05-28",
    });

    expect(inserted[0].delivery_for_pending).toBe(true);
    expect(inserted[0].delivery_date).toBe("2026-05-28");
  });
});
```

**Step 2: Run, expect failure**

```bash
npm test
```

**Step 3: Implement**

`src/lib/tools/schedule-appointment.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { addMinutes, format } from "date-fns";

type Args = {
  prescription_id: string;
  slot_start: string;
  copay_cents: number;
  delivery_for_pending?: boolean;
  delivery_date?: string;
};

export async function scheduleAppointmentLogic(supabase: SupabaseClient, args: Args) {
  const slotStartDate = new Date(args.slot_start);
  const slotEndDate = addMinutes(slotStartDate, 15);

  const row = {
    prescription_id: args.prescription_id,
    slot_start: args.slot_start,
    slot_end: slotEndDate.toISOString(),
    status: "scheduled",
    copay_cents: args.copay_cents,
    delivery_for_pending: args.delivery_for_pending ?? false,
    delivery_date: args.delivery_date ?? null,
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(row)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "insert_failed");

  const time = format(slotStartDate, "HH:mm");
  const confirmation_message = `Listo. Su turno es mañana a las ${time}.`;

  return {
    appointment_id: data.id,
    slot_start: data.slot_start,
    slot_end: data.slot_end,
    confirmation_message,
  };
}
```

**Step 4: Run tests, expect pass**

```bash
npm test
```

**Step 5: Wire route handler**

`src/app/api/tools/schedule-appointment/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { scheduleAppointmentLogic } from "@/lib/tools/schedule-appointment";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const toolCall = body.message?.toolCalls?.[0];
  const args = toolCall?.function?.arguments ?? {};

  try {
    const result = await scheduleAppointmentLogic(supabaseServer(), args);
    return NextResponse.json({ results: [{ toolCallId: toolCall.id, result }] });
  } catch (err: any) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: { error: err.message } }],
    });
  }
}
```

**Step 6: Commit**

```bash
git add src/lib/tools/schedule-appointment.ts src/lib/tools/schedule-appointment.test.ts src/app/api/tools/schedule-appointment/route.ts
git commit -m "feat(backend): implement schedule_appointment tool"
git push
```

---

### Task B.5 — Implement `/api/calls/start` endpoint

**Files:**
- Create: `src/app/api/calls/start/route.ts`

**Step 1: Implement the endpoint**

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) ?? Object.fromEntries(await req.formData());
  const patient_id = body.patient_id;
  if (!patient_id) return NextResponse.json({ error: "patient_id required" }, { status: 400 });

  const supabase = supabaseServer();
  const { data: patient, error } = await supabase
    .from("patients")
    .select("phone_e164")
    .eq("id", patient_id)
    .single();

  if (error || !patient) return NextResponse.json({ error: "patient not found" }, { status: 404 });

  const vapiRes = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      assistantId: process.env.VAPI_ASSISTANT_ID,
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: { number: patient.phone_e164 },
    }),
  });

  if (!vapiRes.ok) {
    const text = await vapiRes.text();
    return NextResponse.json({ error: `vapi error: ${text}` }, { status: 502 });
  }

  const data = await vapiRes.json();

  await supabase.from("call_logs").insert({
    patient_id,
    vapi_call_id: data.id,
    started_at: new Date().toISOString(),
  });

  return NextResponse.json({ call_id: data.id, status: "queued" });
}
```

**Step 2: Smoke-test from the dashboard manually**

Click "Llamar" next to Luz Marina. Expected: your phone (if patient phone is yours during testing) rings within ~5s.

**Step 3: Commit**

```bash
git add src/app/api/calls/start/route.ts
git commit -m "feat(backend): implement /api/calls/start endpoint"
git push
```

---

## Stream Frontend — Jose

### Task F.3 — Live appointments card with Supabase Realtime

**Files:**
- Create: `src/components/dashboard/live-appointments.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Build the realtime appointments card**

`src/components/dashboard/live-appointments.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabaseBrowser } from "@/lib/supabase/client";
import { format } from "date-fns";

type Appointment = {
  id: string;
  slot_start: string;
  status: string;
  copay_cents: number;
  delivery_for_pending: boolean;
  delivery_date: string | null;
  prescription_id: string;
};

export function LiveAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase
      .from("appointments")
      .select("*")
      .order("slot_start")
      .then(({ data }) => setAppointments(data ?? []));

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          setAppointments((curr) => [...curr, payload.new as Appointment]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (appointments.length === 0) {
    return <p className="text-sm text-slate-500">Sin citas todavía.</p>;
  }

  return (
    <div className="space-y-3">
      {appointments.map((appt) => (
        <div key={appt.id} className="rounded-lg border bg-white p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">{format(new Date(appt.slot_start), "HH:mm")}</p>
            <Badge>{appt.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">Copago: ${(appt.copay_cents / 100).toLocaleString("es-CO")}</p>
          {appt.delivery_for_pending && (
            <p className="text-xs text-amber-600">
              Domicilio: {appt.delivery_date}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Wire into the page**

Update the right card in `src/app/page.tsx`:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Citas agendadas hoy</CardTitle>
  </CardHeader>
  <CardContent>
    <LiveAppointments />
  </CardContent>
</Card>
```

And add the import:
```ts
import { LiveAppointments } from "@/components/dashboard/live-appointments";
```

**Step 3: Test realtime locally**

```bash
npm run dev
```

Open dashboard. In another tab, open Supabase Table Editor → insert a row in `appointments` manually. Expected: the row appears in the dashboard within ~1s without refresh.

**Step 4: Commit**

```bash
git add src/components/dashboard/live-appointments.tsx src/app/page.tsx
git commit -m "feat(frontend): add live appointments card with Supabase Realtime"
git push
```

---

### Task F.4 — Replace form POST with client-side fetch + toast

**Files:**
- Create: `src/components/dashboard/call-button.tsx`
- Modify: `src/components/dashboard/pending-prescriptions.tsx`

**Step 1: Build the CallButton client component**

`src/components/dashboard/call-button.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CallButton({ patientId, patientName }: { patientId: string; patientName: string }) {
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
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={loading} size="sm">
      {loading ? "Llamando..." : "Llamar"}
    </Button>
  );
}
```

**Step 2: Update PendingPrescriptions to pass patient.id and name**

Replace the local `CallButton` form with the imported component. Also update the query to include `patients.id`:

```tsx
.select(`
  id, status, created_at,
  patients(id, full_name, phone_e164)
`)
```

And in the JSX:
```tsx
<CallButton patientId={rx.patients.id} patientName={rx.patients.full_name} />
```

**Step 3: Add Toaster to root layout**

In `src/app/layout.tsx`, add:
```tsx
import { Toaster } from "sonner";

// inside <body>:
<Toaster richColors position="top-right" />
```

**Step 4: Test**

Click "Llamar" → toast appears → real call happens.

**Step 5: Commit**

```bash
git add src/components/dashboard/call-button.tsx src/components/dashboard/pending-prescriptions.tsx src/app/layout.tsx
git commit -m "feat(frontend): replace form POST with client fetch + toast feedback"
git push
```

---

# ✅ Checkpoint 2 — Hour 6

**All three devs sync. The critical demo flow must work end-to-end.**

Test together:
- [ ] Operator clicks "Llamar" for **José** (full-stock case) on the dashboard
- [ ] Phone rings, agent authenticates with cédula `8814`
- [ ] Agent schedules an appointment
- [ ] Appointment **appears in the right card of the dashboard within 2 seconds** (realtime)
- [ ] Toast shows the call started
- [ ] `call_logs` has a row with `outcome=null` (it's still 'in progress' since we don't track end yet)

**If this works, you have a demo.** Everything after is polish and safety margin.

---

# Phase 3 — Edge Cases & Error Handling (Hour 6–9)

## Stream Voice — Wilson

### Task V.6 — Test partial stock case (Luz Marina)

**Step 1:** Call Luz Marina, walk through partial-stock case. The agent should:
- Confirm Losartán is available, Atorvastatina is not
- Agendar el turno para Losartán
- Proponer domicilio para Atorvastatina con fecha

**Step 2:** Fix prompt if needed. Commit prompt iteration.

### Task V.7 — Test rejection cases

**Step 1:** Call José but give wrong cédula (`9999`). Verify:
- Agent says code doesn't match
- Asks to repeat
- After 2nd wrong attempt, terminates without revealing info

If broken: tighten the prompt's auth rules. Commit.

### Task V.8 — Test "no puedo esa hora" objection

**Step 1:** When agent proposes 9:00 AM, say "no puedo a esa hora". Agent should propose alternative from `suggested_slots`. If broken, add to prompt:

```
Si la persona dice que no puede en el horario propuesto, ofrece el siguiente slot de suggested_slots. No insistas más de dos veces.
```

Commit.

## Stream Backend — Miguel

### Task B.6 — Add `/api/vapi/webhook` for call lifecycle events

**Files:**
- Create: `src/app/api/vapi/webhook/route.ts`

**Step 1: Implement webhook handler for call-end**

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;

  if (message?.type === "end-of-call-report") {
    const callId = message.call?.id;
    const outcome = message.endedReason ?? "unknown";
    if (callId) {
      await supabaseServer()
        .from("call_logs")
        .update({ outcome, ended_at: new Date().toISOString() })
        .eq("vapi_call_id", callId);
    }
  }

  return NextResponse.json({ ok: true });
}
```

**Step 2: Verify the URL is set in Vapi assistant Server URL field (Task 0.4 step 1)**

**Step 3: Make a call, hang up, verify `call_logs` updates**

**Step 4: Commit**

```bash
git add src/app/api/vapi/webhook/route.ts
git commit -m "feat(backend): handle Vapi end-of-call webhook to close call_logs"
git push
```

### Task B.7 — Handle missing patient gracefully

**Step 1:** If `get_patient_context` errors with `patient_not_found`, return a sensible error string so the agent says "Lo siento, no encuentro su registro" instead of crashing. Already handled in B.3 step 5 — verify with a curl using an invalid phone.

```bash
curl -X POST http://localhost:3000/api/tools/get-patient-context \
  -H "content-type: application/json" \
  -d '{"message":{"toolCalls":[{"id":"t1","function":{"name":"get_patient_context","arguments":{"phone_e164":"+999"}}}]}}'
```

Expected: `{"results":[{"toolCallId":"t1","result":{"error":"patient_not_found"}}]}`

### Task B.8 — Add `pre-warm` route to keep functions hot

**Files:**
- Create: `src/app/api/health/route.ts`

```ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
```

Commit:
```bash
git add src/app/api/health/route.ts
git commit -m "feat(backend): add health endpoint for pre-warm pings"
git push
```

## Stream Frontend — Jose

### Task F.5 — Stock semáforo card

**Files:**
- Create: `src/components/dashboard/stock-status.tsx`
- Modify: `src/app/page.tsx`

**Step 1:** Add a small card showing stock status:

```tsx
import { Badge } from "@/components/ui/badge";
import { supabaseServer } from "@/lib/supabase/server";

export async function StockStatus() {
  const { data } = await supabaseServer()
    .from("medications")
    .select("name, stock_qty, expires_at")
    .order("stock_qty");

  return (
    <div className="space-y-2">
      {(data ?? []).map((m: any) => {
        const low = m.stock_qty < 10;
        const out = m.stock_qty === 0;
        return (
          <div key={m.name} className="flex items-center justify-between text-sm">
            <span>{m.name}</span>
            <Badge variant={out ? "destructive" : low ? "secondary" : "outline"}>
              {out ? "Agotado" : low ? `Bajo (${m.stock_qty})` : m.stock_qty}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2:** Add card to layout under "Citas":

```tsx
<Card>
  <CardHeader><CardTitle>Stock</CardTitle></CardHeader>
  <CardContent><StockStatus /></CardContent>
</Card>
```

**Step 3:** Commit.

```bash
git add src/components/dashboard/stock-status.tsx src/app/page.tsx
git commit -m "feat(frontend): add stock status card"
git push
```

### Task F.6 — Mark prescription row when call is in progress

**Step 1:** In `live-appointments.tsx` or a new subscription in `pending-prescriptions.tsx`, listen for `call_logs` realtime events and visually highlight the patient row when a call starts. Optional polish — only if time permits.

If included, commit:
```bash
git add ...
git commit -m "feat(frontend): highlight patient row during active call"
git push
```

---

# ✅ Checkpoint 3 — Hour 9 — **FEATURE FREEZE**

**No new features after this point. Only bugfixes and demo polish.**

Verify together:
- [ ] Full-stock flow works (José)
- [ ] Partial-stock flow works (Luz Marina)
- [ ] Wrong cédula is rejected gracefully
- [ ] Objection "no puedo esa hora" is handled
- [ ] Dashboard shows: pending prescriptions, live appointments, stock status
- [ ] Realtime updates work
- [ ] `call_logs` records start AND end of each call

**Anything broken: triage now. Fix only what blocks the demo.**

---

# Phase 4 — Demo Polish (Hour 9–11)

## Task P.1 — Final prompt pass

**Owner:** Wilson

Listen to 5 calls back-to-back. Make a list of awkward phrasings. Edit prompt to fix. Commit.

```bash
git commit -am "polish(voice): final prompt pass for demo"
git push
```

## Task P.2 — Dashboard visual polish

**Owner:** Jose

- Replace any "Lorem"-like placeholders with clean copy
- Add empty-state messages for cards
- Verify mobile responsive doesn't break (mostly irrelevant for demo, but no broken layouts on the projector)

```bash
git commit -am "polish(frontend): dashboard copy + empty states"
git push
```

## Task P.3 — Pre-warm script

**Owner:** Miguel

Create `scripts/warmup.sh`:

```bash
#!/bin/bash
URL="${NEXT_PUBLIC_APP_URL:-https://mediagent-production.up.railway.app}"
while true; do
  curl -s "$URL/api/health" > /dev/null
  curl -s -X POST "$URL/api/tools/verify-cc" -H "content-type: application/json" -d '{"message":{"toolCalls":[{"id":"warm","function":{"arguments":{"patient_id":"11111111-1111-1111-1111-111111111111","last_4_cc":"0000"}}}]}}' > /dev/null
  sleep 240
done
```

Run this in a separate terminal during the event.

```bash
chmod +x scripts/warmup.sh
git add scripts/warmup.sh
git commit -m "chore: add warmup script for demo"
git push
```

## Task P.4 — Record video backup of the full demo

**Owner:** All (one person records, others narrate)

Record a clean 3-minute screen+phone capture of the entire flow:
- Open dashboard
- Click Llamar Luz Marina
- Show phone ringing
- Walk through call
- Show appointment appearing
- Cut

Save to Google Drive / shared link. **This is the safety net if the live demo fails.**

---

# Phase 5 — Rehearsal & Final Deploy (Hour 11–12)

## Task R.1 — Final deploy

**Owner:** Miguel

- Push any last commits
- Wait for Railway deploy to succeed
- Open dashboard URL, verify it renders
- **NO MORE DEPLOYS AFTER THIS.**

## Task R.2 — Rehearse the demo 3 times

**Owner:** All

Each rehearsal:
1. Open dashboard on projector
2. Operator clicks Llamar
3. Person playing patient answers
4. Walk through script
5. Time it

Target: ≤3 minutes consistently. Note any rough edges.

## Task R.3 — Run warmup script and hold

**Owner:** Miguel

Start `scripts/warmup.sh` in a terminal. Leave it running until the demo is done.

---

# Appendix — Working agreements

## Branches & commits
- **Miguel (Backend)** works directly on `main` because Railway only deploys from `main` and his endpoints unblock both Wilson and Jose.
- **Wilson (Voice)** works on branch `voice`. Merges to `main` at every checkpoint.
- **Jose (Frontend)** works on branch `frontend`. Merges to `main` at every checkpoint.
- Commit every completed task (most tasks have explicit commit step).
- Commits in English. **NEVER include `Co-Authored-By` trailer.**

## When something breaks
- **Miguel has priority for unblocking calls.** If a tool endpoint is broken mid-demo, the agent can't function. Wilson and Jose drop their stream to help.
- If a checkpoint fails, the team stops parallel work and triages together.

## Communication
- Voice channel always open. Announce blockers immediately.
- Anyone can ping anyone — no waiting.
- Miguel announces every new endpoint pushed to `main`: "ya está `POST /api/tools/<name>`".
- Anyone modifying `package.json`, `.env.example`, or `src/app/layout.tsx`: announce verbally first to avoid conflicts.

## Pre-checkpoint sync (h3, h6, h9 — 15 min each)
- Wilson and Jose rebase their branches on `origin/main`, resolve conflicts, then merge to `main`.
- Miguel keeps pushing to `main` while they merge — coordinate the order verbally.
- After all merges, all three run `git pull` on main, Wilson and Jose rebase their branches again.
- Run the checkpoint verification checklist together.

## Final demo briefing (5 min before pitch)
- Confirm warmup script running
- Confirm phone (jury's) is on, ringer up
- Confirm projector shows dashboard
- **Roles during demo:**
  - **Jose:** drives the dashboard
  - **Wilson:** monitors Vapi dashboard for call status and latency
  - **Miguel:** narrates the script and watches Railway logs
