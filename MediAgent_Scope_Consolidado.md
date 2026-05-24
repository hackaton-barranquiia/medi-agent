# MediAgent — Scope Consolidado
### Hackathon Barranqui-IA · Mayo 2026

> Agente de voz que elimina la fila antes de que el paciente salga de su casa.

---

## 1. El problema — con datos verificados

### Estadísticas clave

| Dato | Cifra | Fuente |
|---|---|---|
| Tiempo de espera para tomar un turno en el servicio farmacéutico | Hasta 12 horas de anticipación | Infobae, marzo 2025 |
| Tiempo en fila física una vez en el servicio farmacéutico | 2 a 8 horas documentadas | Pulzo 2022 · Radio Guatapuri 2025 |
| Quejas PQRS en salud en el primer semestre de 2025 | 978.177 (+36 % vs 2024) | ConsultorSalud / Supersalud, agosto 2025 |
| Quejas relacionadas con barreras de acceso | 93 % del total de PQRS | ConsultorSalud, agosto 2025 |
| Quejas ante Supersalud por negación de medicamentos (2022–2025) | 28 % del total | Defensoría del Pueblo, noviembre 2025 |
| Tutelas en salud en 2024 | +265.000 | Defensoría del Pueblo, abril 2026 |
| Tutelas en salud en 2025 | ~312.500 (+17,9 % vs 2024) | Defensoría del Pueblo, abril 2026 |
| Del total de tutelas en Colombia, las de salud representan | 34 % | Defensoría del Pueblo, abril 2026 |
| Medicamentos pendientes por entrega en Nueva EPS (crecimiento) | +160 % | Infobae, octubre 2025 |
| Reclamaciones diarias promedio registradas por Supersalud | 5.200 / día | ConsultorSalud, junio 2025 |
| Pacientes crónicos que no adhieren al tratamiento a largo plazo | ~50 % | OMS |

### El dato humano — verificado en prensa

- <br>**Cali, marzo 2025:** cientos de adultos mayores llegaban al servicio farmacéutico Disfarma **12 horas antes** de la apertura, con cartones y almohadas en el suelo, para asegurar uno de los 400 turnos diarios. *(Infobae, El País de Cali, marzo 2025)*

- **Cúcuta, febrero 2026:** una adulta mayor de Cúcuta murió de un paro cardiorrespiratorio **dentro del servicio farmacéutico de CAFAM** mientras esperaba en fila para reclamar medicamentos que no recibía desde hacía varios meses. *(Chicanoticias, febrero 2026)*

- **Calarcá, 2025:** adultos mayores fueron amenazados con arma blanca en la fila del servicio farmacéutico. *(Infobae, marzo 2025)*

- **Valledupar, 2025:** 8 horas de espera, más de 120 personas —la mayoría adultos mayores— atendidas por 3 funcionarios, con personas tendidas en el piso. *(Radio Guatapuri, marzo 2025)*

> **Nota sobre datos retirados:** se eliminaron del documento anterior los siguientes datos por no tener fuente verificable: "40% de pacientes crónicos no adhieren en LATAM", "$3M COP costo de hospitalización evitable" y "0 sistemas de aviso proactivo por voz en Colombia".

---

## 2. Customer journey

### Journey actual — dónde se pierde el tiempo

| Paso 1 | Paso 2 | Paso 3 | Paso 4 | Paso 5 |
|---|---|---|---|---|
| Nadie avisa que el medicamento está listo | Llama al contact center. Espera o desiste. | Va sin turno. Hace fila. A veces lo devuelven. | Paga en ventanilla. Desconoce el valor. | Recoge — si aguantó todo el proceso |
| Día 0 — silencio | 20–40 min | 2 a 8 horas | Fricción extra | Sin garantía |

### Journey con MediAgent

| Paso 1 | Paso 2 | Paso 3 | Paso 4 | Paso 5 |
|---|---|---|---|---|
| El agente llama. Avisa que el medicamento está listo. | Confirma últimos 4 dígitos de su cédula. Autenticado en segundos. | Elige horario. Turno reservado. Sin fila garantizada. | Va en su turno. Sin esperar. Sabe qué va a pagar. | El agente lo recuerda tomar el medicamento después. |
| 0 esfuerzo | 30 segundos | 2 min de llamada | Llegada directa | Adherencia activa |

---

## 3. Propuesta de valor

**El sistema actúa antes de que el paciente lo pida.**

MediAgent es un agente de voz que, a partir del número de fórmula médica, detecta cuándo un medicamento está listo o próximo a vencer en bodega, llama proactivamente al paciente, autentica con los últimos 4 dígitos de la cédula, confirma disponibilidad de stock, agenda el turno en el horario de menor afluencia e informa el copago antes de que el paciente salga de casa. Si hay ítems pendientes por stock parcial, agenda la entrega a domicilio. El servicio farmacéutico ve todo en un dashboard en tiempo real.

**Hipótesis a demostrar en el hackathon:** un agente de voz puede reducir el tiempo efectivo del paciente en el proceso de reclamación de medicamentos de hasta 8 horas a menos de 5 minutos — sin app, sin cuenta, sin fricción — y darle al servicio farmacéutico visibilidad predictiva de su demanda.

---

## 4. Jobs to be done

| Funcional | Emocional | B2B — Servicio farmacéutico |
|---|---|---|
| "Quiero recoger mis medicamentos sin perder media jornada — sin filas, sin llamadas, sin sorpresas." | "Quiero sentir que el sistema de salud me cuida activamente, no que tengo que luchar contra él cada mes." | "Quiero predecir la demanda de mañana, eliminar las filas espontáneas y no tener medicamentos que se venzan sin ser recogidos." |

---

## 5. Flujo del sistema

1. El motor proactivo detecta fórmulas listas o medicamentos próximos a vencer en bodega (≤5 días)
2. El agente llama al paciente — el paciente no hace nada
3. Autenticación por los últimos 4 dígitos de la cédula antes de revelar datos clínicos. Suena natural en boca del agente y no requiere que el paciente memorice nada nuevo
4. El agente confirma disponibilidad de todos los ítems de la fórmula
5. **Si stock completo:** agenda turno en franja de menor afluencia, informa copago
6. **Si stock parcial:**
   - Asigna orden de entrega inmediata para los ítems disponibles
   - Agenda entrega a domicilio para ítems pendientes, propone 2–3 fechas basadas en reabastecimiento estimado
   - Informa copago parcial
7. Si el paciente no puede en el horario propuesto, el agente ofrece franja alternativa en la misma llamada
8. Se genera orden con código QR (fecha, ítems, turno, copago)
9. Recordatorio de llamada 2 horas antes del turno
10. Paciente llega, muestra QR, recoge sin fila
11. El agente llama en el horario de toma registrado para recordar tomar el medicamento
12. Ciclo cerrado en historial; próxima fórmula ya programada

---

## 6. Scope — qué entra y qué no

> Scope cortado para sprint de 48h. Sólo entra al demo lo que aparece explícitamente en los 3 minutos del guión (sección 10).

| # | Feature | Por qué importa | Estado demo 48h |
|---|---|---|---|
| 1 | Motor proactivo outbound | Detecta fórmulas listas y medicamentos próximos a vencer (≤5 días). | **DEMO** — trigger manual desde dashboard, no cron real |
| 2 | Llamada outbound por voz (Vapi + Twilio) | El agente llama — el paciente no hace nada. Sin app. | **DEMO** |
| 3 | Autenticación por últimos 4 de cédula | Antes de revelar datos clínicos. Si falla 2 veces: no revela nada. Más natural que un PIN nuevo. | **DEMO** |
| 4 | Confirmación de disponibilidad (stock completo y parcial) | El paciente sabe antes de salir si su medicamento está en stock. | **DEMO** |
| 5 | Agendamiento de turno por voz | Distribuye la demanda en franjas horarias. Elimina la fila espontánea. | **DEMO** |
| 6 | Dashboard del servicio farmacéutico en tiempo real | Citas del día · semáforo de vencimientos · alertas de no-contactados · demanda por franja horaria. | **DEMO** |
| 7 | Info de copago al confirmar turno | El paciente llega sabiendo cuánto va a pagar. | **DEMO** — hardcoded en voz, no calculado |
| 8 | Manejo de objeción "no puedo esa hora" | El agente ofrece franja alternativa en lugar de terminar la llamada. | **DEMO** — sólo en prompt del agente, sin lógica adicional |
| 9 | Entrega a domicilio para ítems pendientes | Se agenda verbalmente y se inserta el registro en DB. | **DEMO** — sin flujo posterior real |
| 10 | Recordatorio de toma post-recogida | El agente llama en el horario de toma registrado. Cierra el ciclo adherencia. | **RECORTADO** — no aparece en el guión de demo |
| 11 | Recordatorio 2h antes del turno | Reduce ausentismo. | **RECORTADO** — roadmap |
| 12 | Alerta a familiar — 2 no-contactos | Si el paciente no contesta dos veces, alertar a familiar registrado. | **RECORTADO** — roadmap |
| 13 | Link de pago Nequi por SMS post-llamada | Copago pagado antes de llegar. | **RECORTADO** — roadmap |
| 14 | Generación de orden con QR | QR con fecha, ítems, turno, copago. | **RECORTADO** — el agendamiento basta para el demo |
| 15 | Cron automático del motor proactivo | Detección continua sin intervención humana. | **RECORTADO** — trigger manual es más visible en demo |
| — | Integración real EPS · App móvil · Biometría · Multi-sede | Fuera de scope completo. | **WON'T** |

---

## 7. Arquitectura técnica

> Stack diseñado para 48h con foco en baja latencia conversacional y voz con acento colombiano. Detalle completo en `docs/architecture.md`.

```
┌─────────────────────────────────────────────────────────────┐
│  Railway — Next.js fullstack (always-on, sin cold starts)   │
│                                                             │
│   Dashboard (React + Supabase Realtime client)              │
│   │  "Llamar paciente" (botón)                              │
│   ▼                                                         │
│   POST /api/calls/start                                     │
│                                                             │
│   Route Handlers (tools):                                   │
│   /api/tools/verify-cc                                      │
│   /api/tools/check-stock                                    │
│   /api/tools/schedule                                       │
└───────────┬─────────────────────────┬───────────────────────┘
            │ webhook (tool calls)    │ create call
            │                         ▼
            │                  ┌─────────────┐
            │                  │     Vapi    │
            │                  └──────┬──────┘
            │                         │
            │              ┌──────────┴──────────────────────┐
            │              ▼                                  ▼
            │     Twilio (número CO)                  Providers configurados:
            │              │                          • Deepgram Nova-2 (STT)
            │              ▼                          • OpenAI GPT-4o (LLM)
            │     Teléfono paciente                   • ElevenLabs Valentina (TTS es-CO)
            │
            ▼
       ┌──────────────────┐    realtime push
       │Supabase Postgres ├──────────────► Dashboard se actualiza en vivo
       └──────────────────┘
```

**Stack:**
- **Hosting:** Railway (Next.js fullstack always-on, plan Hobby $5/mes)
- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Base de datos:** Supabase Postgres + Realtime
- **Orquestador de voz:** Vapi (abstrae Twilio + STT + LLM + TTS + turn-taking + barge-in)
- **Telefonía:** Twilio (número outbound CO)
- **STT:** Deepgram Nova-2 (español)
- **LLM:** OpenAI GPT-4o (con GPT-4o-mini como plan B de latencia)
- **TTS:** ElevenLabs voz Valentina (es-CO) — único TTS con acento auténticamente colombiano
- **Auth paciente:** últimos 4 dígitos de la cédula (no PIN nuevo)

> Para el demo, los datos de pacientes, medicamentos y stock son sintéticos. La arquitectura es idéntica a la de producción.

**Decisiones clave (justificación detallada en `docs/architecture.md`):**
- **Railway en lugar de AWS Lambda** — los cold starts de serverless dañan la latencia de voz; Railway always-on los elimina
- **Vapi en lugar de Twilio + Lambda crudo** — ahorra ~1 día de plomería de audio streaming
- **OpenAI API directa en lugar de Bedrock** — Bedrock requiere request de acceso al modelo, incompatible con sprint de 48h
- **Supabase Postgres en lugar de DynamoDB** — modelo relacional es 3x más rápido de iterar en 48h
- **Pipeline tradicional en lugar de voice-native (GPT-4o Realtime / Gemini Live)** — voice-native no tiene voz colombiana, y el acento local es parte del impacto del demo

---

## 8. Dashboard interno — alcance acotado

Panel de control para el operador del servicio farmacéutico. Muestra únicamente:

1. **Stock actual por medicamento** — disponible hoy, bajo mínimos, próximo a vencer (semáforo rojo/verde)
2. **Órdenes del día** — listado con estado: Pendiente / Agendado / En ruta / Entregado
3. **Alertas de no-contactados** — pacientes que no contestaron la llamada
4. **Demanda por franja horaria** — cuántos pacientes llegan y cuándo

**Rol en el demo:** el jurado opera el dashboard en vivo, ve cómo una alerta roja dispara la llamada automática, y observa el turno aparecer en tiempo real mientras él mismo acaba de contestar la llamada del agente.

---

## 9. Cómo puntúa cada criterio del hackathon

| Criterio | Peso | Cómo MediAgent lo cubre | Puntaje estimado |
|---|---|---|---|
| Prototipo funcional | 30% | Demo end-to-end en vivo. El jurado contesta la llamada. Ve la cita en el dashboard. Resiste variaciones en vivo. | 5 / 5 |
| Uso de IA | 35% | Sin el LLM no hay agente conversacional — hay un IVR de "presione 1". La IA entiende lenguaje natural, maneja objeciones y toma decisiones. | 5 / 5 |
| Impacto | 35% | Problema real, cuantificado con fuentes verificadas, usuario específico y camino de despliegue concreto (IPS privada como piloto). | 4.5 / 5 |

---

## 10. Demo de 3 minutos — guión

| Tiempo | Acción |
|---|---|
| 0:00 – 0:30 | *"En febrero de 2026 una adulta mayor murió de un paro cardíaco dentro de un servicio farmacéutico en Cúcuta. Estaba esperando en fila. Son las 978.177 quejas del primer semestre de 2025. Este es el problema que resuelve MediAgent."* |
| 0:30 – 1:00 | Mostrar dashboard: semáforo rojo — medicamento vence en 2 días, paciente sin contactar. El sistema dispara la llamada. |
| 1:00 – 1:45 | El jurado contesta. El agente autentica con los últimos 4 dígitos de la cédula, confirma disponibilidad, agenda el turno e informa el copago. La cita aparece en el dashboard en tiempo real. |
| 1:45 – 2:30 | Stock parcial detectado: el agente agenda lo disponible para el turno y propone fecha de entrega a domicilio para los ítems pendientes. Todo el flujo en una sola llamada. |
| 2:30 – 3:00 | *"Lo que acaban de experimentar tomó 3 minutos. Antes tomaba hasta 8 horas — si es que llegaba el turno. La fila ya no existe. Se gestionó antes de que el paciente saliera de su casa."* |

---

## 11. Roadmap post-hackathon

- Integración real con APIs de EPS vía Historia Clínica Electrónica (Resolución 1995/1999 MINSALUD)
- Delegación familiar: familiar autorizado gestiona el turno o recibe la entrega a domicilio
- Piloto en IPS privada como validación antes de escalar a EPS
- Cumplimiento proactivo de la Circular Externa 017 de 2026 (entrega máxima en 48h) y Resolución 2117 de 2025 (Modelo de Gestión de Tiempos de Espera)

---

*Documento consolidado — Hackathon Barranqui-IA · Mayo 2026*
