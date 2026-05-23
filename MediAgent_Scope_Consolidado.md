# MediAgent — Scope Consolidado
### Hackathon Barranqui-IA · Mayo 2026

> Agente de voz que elimina la fila antes de que el paciente salga de su casa.

---

## 1. El problema — con datos verificados

### Estadísticas clave

| Dato | Cifra | Fuente |
|---|---|---|
| Tiempo de espera para tomar un turno en dispensario | Hasta 12 horas de anticipación | Infobae, marzo 2025 |
| Tiempo en fila física una vez en el dispensario | 2 a 8 horas documentadas | Pulzo 2022 · Radio Guatapuri 2025 |
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

- <br>**Cali, marzo 2025:** cientos de adultos mayores llegaban al dispensario Disfarma **12 horas antes** de la apertura, con cartones y almohadas en el suelo, para asegurar uno de los 400 turnos diarios. *(Infobae, El País de Cali, marzo 2025)*

- **Cúcuta, febrero 2026:** una adulta mayor de Cúcuta murió de un paro cardiorrespiratorio **dentro del dispensario de CAFAM** mientras esperaba en fila para reclamar medicamentos que no recibía desde hacía varios meses. *(Chicanoticias, febrero 2026)*

- **Calarcá, 2025:** adultos mayores fueron amenazados con arma blanca en la fila del dispensario. *(Infobae, marzo 2025)*

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
| El agente llama. Avisa que el medicamento está listo. | PIN de voz. Autenticado en segundos. | Elige horario. Turno reservado. Sin fila garantizada. | Va en su turno. Sin esperar. Sabe qué va a pagar. | El agente lo recuerda tomar el medicamento después. |
| 0 esfuerzo | 30 segundos | 2 min de llamada | Llegada directa | Adherencia activa |

---

## 3. Propuesta de valor

**El sistema actúa antes de que el paciente lo pida.**

MediAgent es un agente de voz que, a partir del número de fórmula médica, detecta cuándo un medicamento está listo o próximo a vencer en bodega, llama proactivamente al paciente, autentica por PIN de voz, confirma disponibilidad de stock, agenda el turno en el horario de menor afluencia e informa el copago antes de que el paciente salga de casa. Si hay ítems pendientes por stock parcial, agenda la entrega a domicilio. El dispensario ve todo en un dashboard en tiempo real.

**Hipótesis a demostrar en el hackathon:** un agente de voz puede reducir el tiempo efectivo del paciente en el proceso de reclamación de medicamentos de hasta 8 horas a menos de 5 minutos — sin app, sin cuenta, sin fricción — y darle al dispensario visibilidad predictiva de su demanda.

---

## 4. Jobs to be done

| Funcional | Emocional | B2B — Dispensario |
|---|---|---|
| "Quiero recoger mis medicamentos sin perder media jornada — sin filas, sin llamadas, sin sorpresas." | "Quiero sentir que el sistema de salud me cuida activamente, no que tengo que luchar contra él cada mes." | "Quiero predecir la demanda de mañana, eliminar las filas espontáneas y no tener medicamentos que se venzan sin ser recogidos." |

---

## 5. Flujo del sistema

1. El motor proactivo detecta fórmulas listas o medicamentos próximos a vencer en bodega (≤5 días)
2. El agente llama al paciente — el paciente no hace nada
3. Autenticación por PIN de 4 dígitos antes de revelar datos clínicos
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

| # | Feature | Por qué importa | Prioridad |
|---|---|---|---|
| 1 | Motor proactivo outbound | Detecta fórmulas listas y medicamentos próximos a vencer (≤5 días). Encola llamadas por urgencia: rojo / verde. | MUST |
| 2 | Llamada outbound por voz (Twilio) | El agente llama — el paciente no hace nada. Sin app. | MUST |
| 3 | Autenticación por PIN de voz | 4 dígitos antes de revelar datos clínicos. Si falla 2 veces: no revela nada, alerta al dispensario. | MUST |
| 4 | Confirmación de disponibilidad | El paciente sabe antes de salir si su medicamento está en stock. Elimina visitas en vano. | MUST |
| 5 | Agendamiento de turno por voz | Distribuye demanda en franjas. Elimina la fila espontánea. | MUST |
| 6 | Dashboard dispensario en tiempo real | Citas del día · semáforo de vencimientos · alertas de no-contactados · demanda por franja horaria. | MUST |
| 7 | Recordatorio de toma post-recogida | Cierra el ciclo reclamación → recogida → adherencia. Reutiliza el motor outbound. | MUST |
| 8 | Recordatorio 2h antes del turno | Reduce ausentismo. El cupo liberado puede asignarse a otro paciente. | SHOULD |
| 9 | Manejo de objeción "no puedo esa hora" | El agente ofrece franja alternativa sin colgar. | SHOULD |
| 10 | Alerta a familiar — 2 no-contactos | Si el paciente no contesta dos veces: dashboard alerta al familiar registrado. | SHOULD |
| 11 | Info de copago al confirmar turno | El paciente llega sabiendo cuánto va a pagar. Reduce fricción en ventanilla. | SHOULD |
| 12 | Link de pago Nequi por SMS post-llamada | Copago pagado antes de llegar elimina la fila de ventanilla. | BONUS |
| — | Integración real EPS · App móvil · Biometría · Multi-sede | Fuera de scope. No se menciona en el pitch. | WON'T |

---

## 7. Arquitectura técnica

```
Motor proactivo (cron / evento fórmula lista)
        │
        ▼
   AWS Lambda  ◄──── Agente IA (AWS Bedrock / Claude Sonnet)
        │
        ├──► Twilio Voice API (llamada outbound al paciente)
        │
        ├──► DynamoDB (pacientes, fórmulas, stock, órdenes, turnos)
        │
        └──► Dashboard interno (React + datos simulados)
```

**Stack:**
- Agente de voz: Twilio Voice API + AWS Lambda
- IA conversacional: AWS Bedrock (Claude Sonnet)
- Base de datos: DynamoDB
- Dashboard: React (datos sintéticos para el demo)
- Notificaciones adicionales: Amazon SNS / Twilio SMS

> Para el demo, el stock y los datos de pacientes son sintéticos. La arquitectura es idéntica a la de producción.

---

## 8. Dashboard interno — alcance acotado

Panel de control para el operador del dispensario. Muestra únicamente:

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
| 0:00 – 0:30 | *"En febrero de 2026 una adulta mayor murió de un paro cardíaco dentro de un dispensario en Cúcuta. Estaba esperando en fila. Son las 978.177 quejas del primer semestre de 2025. Este es el problema que resuelve MediAgent."* |
| 0:30 – 1:00 | Mostrar dashboard: semáforo rojo — medicamento vence en 2 días, paciente sin contactar. El sistema dispara la llamada. |
| 1:00 – 1:45 | El jurado contesta. El agente autentica por PIN, confirma stock parcial, agenda turno para lo disponible y propone fecha de domicilio para lo pendiente. La cita aparece en el dashboard en tiempo real. |
| 1:45 – 2:30 | Recordatorio automático 2h antes del turno. El paciente llega, muestra QR. Estado cambia a "Entregado". El agente llama a recordarle tomar el medicamento. |
| 2:30 – 3:00 | *"Lo que acaban de experimentar tomó 3 minutos. Antes tomaba hasta 8 horas — si es que llegaba el turno. La fila ya no existe. Se gestionó antes de que el paciente saliera de su casa."* |

---

## 11. Roadmap post-hackathon

- Integración real con APIs de EPS vía Historia Clínica Electrónica (Resolución 1995/1999 MINSALUD)
- Delegación familiar: familiar autorizado gestiona el turno o recibe la entrega a domicilio
- Piloto en IPS privada como validación antes de escalar a EPS
- Cumplimiento proactivo de la Circular Externa 017 de 2026 (entrega máxima en 48h) y Resolución 2117 de 2025 (Modelo de Gestión de Tiempos de Espera)

---

*Documento consolidado — Hackathon Barranqui-IA · Mayo 2026*
