# MediAgent — Plataformas de Servicio y Alcance MVP

Base narrativa tomada de `pitch.md`: el problema no es solo la fila; es la desconexión operativa entre inventario, fórmula y paciente en el último tramo de entrega.

---

## 1) Actores y plataformas que vamos a ofrecer

## Actor 1: Dispensario / Distribuidora (operador)
- Necesita visibilidad operativa de qué pedidos preparar, para quién y a qué hora.
- Necesita reducir filas, tutelas, pérdida por vencimiento y reprocesos manuales.

### Plataforma A: Dashboard Operativo de Entrega (B2B)
- Vista de fórmulas pendientes por estado: `lista`, `vence pronto`, `stock parcial`.
- Agenda de turnos por franja horaria (ej. bloques de 15 min).
- Cola de llamadas y estado: `pendiente`, `llamado`, `agendado`, `fallido`.
- Lista de pedidos a alistar por hora para alistamiento previo.
- Estado final del caso: `entregado`, `parcial entregado`, `pendiente domicilio` (si aplica).

## Actor 2: Población segmentada (pacientes)
- Personas con urgencia de acceso oportuno al medicamento.
- Adulto mayor, crónico o población con barreras fuertes de movilidad/espera.

### Plataforma B: Canal Paciente por Voz Telefónica (B2C habilitado por B2B)
- Llamada automática saliente.
- Autenticación por últimos 4 de cédula.
- Confirmación de disponibilidad (total o parcial).
- Agendamiento de turno para retiro sin fila.
- Opción de domicilio para pendientes (si se define en MVP o fase siguiente).

## Plataforma transversal (núcleo)
### Plataforma C: Orquestador de Entrega (reglas + agente)
- Motor que conecta inventario, fórmula y paciente.
- Decide a quién contactar primero (segmentación/priorización).
- Publica eventos en tiempo real al dashboard.

---

## 2) Definición propuesta del MVP (recomendado)

## Objetivo del MVP
Demostrar, de punta a punta, que MediAgent puede convertir una fórmula pendiente en una entrega programada con franja horaria, reduciendo espera y mejorando control operativo.

## MVP recomendado (sí entregar hasta aquí)
1. Dashboard operativo para dispensario:
   - Fórmulas pendientes.
   - Citas agendadas en tiempo real.
   - Estado básico de stock.
2. Agente de voz saliente:
   - Autenticación por cédula (últimos 4).
   - Confirmación de disponibilidad.
   - Agendamiento de retiro en horario.
3. Flujo de cierre operativo:
   - Pedido pasa a “alistado para franja”.
   - Se marca “entregado” cuando se completa retiro.

## Qué dejar fuera del MVP (para no romper tiempo)
- Optimización avanzada de rutas de domicilio.
- Integraciones profundas con ERP/HIS legado.
- Segmentación predictiva con ML.
- Portal paciente web/app.
- Omnicanal (WhatsApp/SMS bidireccional complejo).

---

## 3) Preguntas de validación (para confirmar entendimiento del MVP)

Responde estas preguntas para cerrar alcance sin ambigüedad:

1. **Canal principal del MVP:**  
   ¿En esta entrega el cierre es solo **retiro sin fila**, o también habilitamos **domicilio** como opción real operativa?

2. **Criterio de segmentación inicial:**  
   ¿Qué regla manda primero: vencimiento próximo, criticidad clínica, edad, historial de no retiro, o una mezcla?

3. **SLA objetivo:**  
   ¿Qué promesa mínima queremos demostrar en demo/piloto? (ej. “paciente llamado en <24h”, “entrega agendada en <48h”).

4. **Unidad operativa de agenda:**  
   ¿Bloques fijos de 15 min para todos o capacidad variable por sede/farmacia?

5. **Definición de éxito MVP:**  
   ¿Qué 3 métricas validan product-market fit inicial?  
   Sugeridas: `% contacto efectivo`, `% retiro sin fila`, `% reducción de vencidos`.

6. **Alcance del actor empresa/distribuidora:**  
   ¿Necesitan desde ya un panel de configuración de segmentación o aceptan reglas fijas en backend para MVP?

7. **Frontera legal/compliance mínima:**  
   ¿Qué nivel de trazabilidad de llamadas y consentimiento debemos evidenciar desde el día 1?

---

## 4) ¿Es buena idea entregar hasta este MVP?

Sí, **es una buena estrategia** por 3 razones:
- Reduce riesgo técnico: demuestra valor en el tramo más doloroso (última milla operativa de retiro).
- Mide valor rápido: llamadas + agenda + alistamiento ya generan impacto visible.
- Habilita venta B2B temprana: el pagador (dispensario/IPS/EPS) ve ahorro operativo antes de pedir extras.

Riesgo principal si ampliamos demasiado ahora: construir “plataforma completa” sin validar adopción del flujo núcleo.

---

## 5) Propuesta de valor por actor

## Para dispensario / distribuidora (pagador principal)
- Menos filas y menos congestión en ventanilla.
- Alistamiento por horario (operación predecible).
- Menor pérdida por medicamentos vencidos.
- Menos riesgo de tutela por falla de oportunidad.

## Para paciente (beneficiario directo)
- Llamada proactiva en vez de desplazamiento incierto.
- Confirmación de qué sí está listo antes de salir.
- Turno de retiro definido (menos espera, menos fricción).
- Menor riesgo de interrupción terapéutica.

## Para IPS/EPS (comprador institucional potencial)
- Trazabilidad del proceso de entrega.
- Indicadores operativos y de acceso oportuno.
- Menor costo asociado a reclamos/tutelas/eventos evitables.

---

## 6) Extras recomendados después del MVP (priorizados)

## Fase 1 (inmediata post-MVP)
- Confirmaciones por WhatsApp/SMS del turno.
- Reprogramación simple (“no puedo esa hora” autoservicio).
- Cierre de llamada con outcome estructurado y auditoría.

## Fase 2
- Domicilio para pendientes con promesa de entrega.
- Reglas avanzadas de priorización por riesgo.
- Multi-sede / multi-dispensario.

## Fase 3
- Portal paciente (tracking de estado).
- Modelos predictivos de no retiro y desabastecimiento.
- Integración profunda con sistemas institucionales.

---

## 7) Viabilidad real de terminar esto en 10 horas

## Evaluación general
**Sí es posible en 10 horas**, si el alcance se mantiene estricto al MVP núcleo.

## Condiciones para lograrlo
- Reutilizar stack actual (dashboard + tools + realtime + agente de voz).
- Cerrar el debate de “domicilio sí/no” en los primeros 30 minutos.
- Congelar features no esenciales.
- Priorizar demo robusta sobre perfección visual/técnica.

## Plan compacto de 10 horas
- **Hora 0-1:** cierre de alcance + reglas de segmentación mínimas.
- **Hora 1-4:** flujo completo llamada -> autenticación -> agendamiento -> dashboard.
- **Hora 4-6:** estado operativo de alistamiento y entrega.
- **Hora 6-8:** pruebas de casos borde (cédula errónea, stock parcial, no disponibilidad).
- **Hora 8-9:** polish de copy y estabilidad demo.
- **Hora 9-10:** rehearsal completo + video backup.

## Riesgos que pueden romper la ventana
- Cambios de alcance de último minuto (especialmente domicilios full).
- Dependencias externas inestables (telefonía/latencia).
- Falta de definición de reglas de priorización.

---

## 8) ¿Se necesita dashboard para la empresa de medicamentos y segmentación?

## Recomendación
Sí, **se necesita**, pero en dos niveles:

1. **Para MVP (mínimo viable):**  
   No construir un “mega dashboard” adicional.  
   Usar un módulo simple dentro del dashboard actual con:
   - Prioridad por regla fija (ej. vence pronto > crónico > resto).
   - Filtros básicos por estado y franja.
   - Conteo de pacientes priorizados.

2. **Post-MVP (producto escalable):**  
   Sí construir un tablero específico de “Campañas y Segmentación” para la empresa/distribuidora:
   - Editor de reglas.
   - Simulación de impacto.
   - A/B de estrategias de contacto.
   - Métricas por cohorte.

Conclusión: para llegar en tiempo, el MVP debe resolver la operación; la segmentación avanzada debe venir justo después.

