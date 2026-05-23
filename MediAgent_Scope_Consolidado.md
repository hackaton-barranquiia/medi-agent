# MediAgent — Scope Consolidado
### Hackathon Barranqui-IA

> Agente de voz que elimina la fila antes de que el paciente salga de su casa.

---

## 1. Problema

El dispensario de medicamentos es uno de los peores cuellos de botella del sistema de salud colombiano. Un paciente crónico pierde más de 2 horas y media cada vez que va a recoger sus medicamentos — sin saber si están disponibles, sin turno reservado. El dispensario tampoco sabe quién viene. Resultado: filas impredecibles, medicamentos que vencen en bodega sin ser recogidos, y pacientes que abandonan el tratamiento porque el proceso es insostenible.

| Dato | Cifra | Fuente |
|---|---|---|
| Tiempo promedio de espera en dispensario | +2h 40min | KienyKe, 2025 |
| Afectados mayores de 60 años en quejas por medicamentos | 61.3% | Datos RIPS Colombia |
| Filas documentadas en un solo punto de dispensación | Hasta 250 pacientes / hasta 9h de espera | Manizales, 2026 |
| Tutelas por no entrega oportuna de medicamentos (crecimiento 2023–2024) | +107% | Corte Constitucional Colombia |
| Muertes por barreras de acceso al sistema de salud (2025) | +2.400 | Fecoer, 2025 |
| Pacientes crónicos que no adhieren a su tratamiento a largo plazo | ~50% | OMS |
| Cuellos de botella en dispensación: gestión deficiente de inventarios y falta de trazabilidad | Documentado | ACEMI, 2025 |

---

## 2. Customer journey

### Journey actual — dónde se pierde el tiempo

| Paso 1 | Paso 2 | Paso 3 | Paso 4 | Paso 5 |
|---|---|---|---|---|
| Nadie avisa que el medicamento está listo | Llama al contact center. Espera o desiste. | Va sin turno. Hace fila. A veces lo devuelven. | Paga en ventanilla. Desconoce el valor. | Recoge — si aguantó todo el proceso |
| Día 0 — silencio | 20–40 min | +2h en sitio | Fricción extra | Sin garantía |

### Journey con MediAgent

| Paso 1 | Paso 2 | Paso 3 | Paso 4 | Paso 5 |
|---|---|---|---|---|
| El agente llama. Avisa que el medicamento está listo. | PIN de voz. Autenticado en segundos. | Elige horario. Turno reservado. Sin fila garantizada. | Va en su turno. Sin esperar. Sabe qué va a pagar. | El agente lo recuerda tomar el medicamento después. |
| 0 esfuerzo | 30 segundos | 2 min de llamada | Llegada directa | Adherencia activa |

---

## 3. Propuesta de valor

**El sistema actúa antes de que el paciente lo pida.**

MediAgent es un agente de voz que, a partir del número de fórmula médica, detecta cuándo un medicamento está listo o próximo a vencer en bodega, llama proactivamente al paciente, autentica por PIN de voz, confirma disponibilidad de stock, agenda el turno en el horario de menor afluencia e informa el copago antes de que el paciente salga de casa. Si hay ítems pendientes por stock parcial, agenda la entrega a domicilio. El dispensario ve todo en un dashboard en tiempo real.

**Hipótesis a demostrar en el hackathon:** un agente de voz puede reducir el tiempo efectivo del paciente en el proceso de reclamación de medicamentos de más de 2 horas a menos de 5 minutos — sin app, sin cuenta, sin fricción — y darle al dispensario visibilidad predictiva de su demanda.

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
   - Agenda entrega a domicilio para los ítems pendientes, propone 2–3 fechas basadas en reabastecimiento estimado
   - Informa copago parcial
7. Si el paciente no puede en el horario propuesto, el agente ofrece franja alternativa
8. Se genera orden con código QR (fecha, ítems, turno, copago)
9. Recordatorio de llamada 2 horas antes del turno
10. Paciente llega, muestra QR, recoge sin fila
11. El agente llama en el horario de toma registrado para recordar tomar el medicamento
12. Ciclo cerrado en historial; próxima fórmula ya programada

---

## 6. Scope — qué entra y qué no

| # | Feature | Por qué importa | Prioridad |
|---|---|---|---|
| 1 | Motor proactivo outbound | Detecta fórmulas listas y medicamentos próximos a vencer (≤5 días). Encola llamadas por urgencia: rojo (urgente) / verde (normal). | MUST |
| 2 | Llamada outbound por voz (Twilio) | El agente llama — el paciente no hace nada. Elimina el paso de llamar al contact center y esperar. Sin app. | MUST |
| 3 | Autenticación por PIN de voz | 4 dígitos antes de revelar datos clínicos. Si falla 2 veces: no revela nada, alerta al dispensario. Protege al adulto mayor de fraude telefónico. | MUST |
| 4 | Confirmación de disponibilidad | El paciente sabe antes de salir si su medicamento está en stock. Elimina visitas en vano. | MUST |
| 5 | Agendamiento de turno por voz | Distribuye la demanda en franjas horarias. Elimina la fila espontánea. | MUST |
| 6 | Dashboard dispensario en tiempo real | Citas del día · semáforo de vencimientos · alertas de no-contactados · demanda por franja horaria. | MUST |
| 7 | Recordatorio de toma post-recogida | El agente llama en el horario de toma registrado. Cierra el ciclo reclamación → recogida → adherencia. Reutiliza el motor outbound. | MUST |
| 8 | Recordatorio 2h antes del turno | Reduce ausentismo. El cupo liberado puede asignarse a otro paciente. | SHOULD |
| 9 | Manejo de objeción "no puedo esa hora" | El agente ofrece franja alternativa en lugar de terminar la llamada. | SHOULD |
| 10 | Alerta a familiar — 2 no-contactos | Si el paciente no contesta dos veces: dashboard alerta al familiar registrado. | SHOULD |
| 11 | Info de copago al confirmar turno | El paciente llega sabiendo cuánto va a pagar. Reduce fricción en ventanilla. | SHOULD |
| 12 | Link de pago Nequi por SMS post-llamada | Copago pagado antes de llegar elimina la fila de ventanilla de pago. | BONUS |
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

> Para el demo, el stock y los datos de pacientes son sintéticos. La arquitectura es la misma que iría a producción.

---

## 8. Dashboard interno — alcance acotado

Panel de control para el operador del dispensario. Muestra únicamente:

1. **Stock actual por medicamento** — disponible hoy, bajo mínimos, próximo a vencer (semáforo rojo/verde)
2. **Órdenes del día** — listado con estado: Pendiente / Agendado / En ruta / Entregado
3. **Alertas de no-contactados** — pacientes que no contestaron la llamada
4. **Demanda por franja horaria** — cuántos pacientes llegan y cuándo

**Rol en el demo:** el jurado opera el dashboard en vivo, ve cómo una alerta roja dispara la llamada automática, y observa el turno aparecer en tiempo real mientras el jurado mismo acaba de contestar la llamada del agente.

---

## 9. Cómo puntúa cada criterio del hackathon

| Criterio | Peso | Cómo MediAgent lo cubre | Puntaje estimado |
|---|---|---|---|
| Prototipo funcional | 30% | Demo end-to-end en vivo. El jurado contesta la llamada. Ve la cita en el dashboard. Resiste variaciones en vivo. | 5 / 5 |
| Uso de IA | 35% | Sin el LLM no hay agente conversacional — hay un IVR de "presione 1". La IA entiende lenguaje natural, maneja objeciones y toma decisiones. | 5 / 5 |
| Impacto | 35% | Problema real, cuantificado, usuario específico y camino de despliegue concreto (IPS privada como piloto). | 4.5 / 5 |

---

## 10. Demo de 3 minutos — guión

| Tiempo | Acción |
|---|---|
| 0:00 – 0:30 | Contexto: "En Colombia un adulto mayor pierde más de 2 horas para recoger una pastilla que ya tiene formulada. El 61% de los afectados tiene más de 60 años." |
| 0:30 – 1:00 | Mostrar dashboard: semáforo rojo — medicamento vence en 2 días, paciente sin contactar |
| 1:00 – 1:30 | El sistema dispara la llamada. El jurado contesta. El agente autentica por PIN. |
| 1:30 – 2:00 | El agente confirma disponibilidad, agenda el turno, informa el copago. La cita aparece en el dashboard en tiempo real. |
| 2:00 – 2:30 | Stock parcial detectado: el agente agenda entrega a domicilio para los ítems pendientes, propone fecha. |
| 2:30 – 3:00 | Cierre: *"Lo que acaban de experimentar tomó 3 minutos. Antes tomaba 3 horas. La fila ya no existe — se gestionó antes de que el paciente saliera de su casa."* |

---

## 11. Roadmap post-hackathon

- Integración real con APIs de EPS vía Historia Clínica Electrónica (Resolución 1995/1999 MINSALUD)
- Delegación familiar: familiar autorizado gestiona el turno o recibe la entrega a domicilio
- Piloto en IPS privada como validación antes de escalar a EPS

---

*Documento consolidado — Hackathon Barranqui-IA · Mayo 2026*
