# MediAgent — Plan de Optimización de Latencia en Vapi

> Basado en: https://futureagi.com/blog/how-to-optimize-vapi-latency-2026/  
> Contexto: pipeline GPT-4o + Deepgram nova-3 + ElevenLabs eleven_flash_v2_5  
> Estado actual: ~11s percibidos entre que el usuario habla y el bot responde con resultado

---

## 1. Lo que aprendí del blog

### El pipeline de latencia tiene 4 etapas en serie:

```
Usuario termina de hablar
  → STT end-of-turn detection  (~50-700ms según config)
  → LLM TTFT (primer token)    (~150-500ms según modelo)
  → Tool calls (si aplica)     (~500-2000ms por tool)
  → TTS first audio            (~80-200ms con flash/turbo)
─────────────────────────────────────────────────────────
  Target: 470-550ms p95 en turnos sin tools
          700-800ms p95 en turnos con tools
  Baseline Vapi default: 900-1200ms
  Nuestro estado actual:  ~3500ms (sin filler) / ~11000ms (con filler)
```

### Causa raíz confirmada de nuestro problema:
Cuando el bot dice "Un momento" en texto dentro del system prompt, Vapi:
1. Genera el texto filler + la tool call juntos en el stream del LLM
2. Envía el filler a TTS → espera a que termine el audio (~6s)
3. DESPUÉS ejecuta la tool call

**El blog lo nombra explícitamente como el anti-patrón #1.** La solución es usar `messages` a nivel de tool en el JSON de Vapi — así el filler se reproduce EN PARALELO con la ejecución de la tool.

---

## 2. Los 5 cambios de mayor impacto para nosotros

| # | Técnica | Ganancia esperada | Complejidad |
|---|---------|------------------|-------------|
| 1 | **Tool `messages` (request-start)** | **~6s** (elimina el gap filler→tool) | Baja — solo JSON |
| 2 | **Prefix cache: mover `{{customer.number}}` al final** | 100-300ms por turno | Baja — solo reorden |
| 3 | **`startSpeakingPlan` / `stopSpeakingPlan`** | 100-400ms en detección | Baja — solo JSON |
| 4 | **`eotTimeoutMs: 500`** en transcriber Vapi-level | 200-400ms en endpointing | Baja — solo JSON |
| 5 | **gpt-4o-mini** en lugar de gpt-4o | 100-300ms TTFT | Media — riesgo de accuracy |

---

## 3. Experimentos en orden

### Experimento A — Tool `messages` paralelo ⭐ MÁS IMPACTO

**Qué cambia:** Agregar `messages` + `timeoutSeconds` a cada tool en el JSON del asistente.  
**Por qué funciona:** Vapi reproduce el audio del `request-start` y ejecuta el HTTP simultáneamente. Ya no hay espera de TTS antes de la llamada.

```json
// Antes (lo que tenemos ahora):
{
  "type": "function",
  "function": { "name": "verify_cc", ... },
  "server": { "url": "https://..." }
}

// Después:
{
  "type": "function",
  "function": { "name": "verify_cc", ... },
  "messages": [
    { "type": "request-start", "content": "Un momento." },
    { "type": "request-response-delayed", "content": "Ya casi." }
  ],
  "server": {
    "url": "https://...",
    "timeoutSeconds": 8
  }
}
```

**Métrica de éxito:** `BOT → TOOL_CALLS` pasa de ~6s a <0.5s.  
**Latencia esperada post-cambio:** ~4-5s totales (vs 11s actual).

---

### Experimento B — Prefix cache: mover número al final

**Qué cambia:** Mover `NUMERO DEL CLIENTE: {{customer.number}}` a la última línea del system prompt.  
**Por qué funciona:** OpenAI cachea el prefix de tokens idénticos. Si el número está en la línea 2, solo los primeros ~10 tokens se cachean. Si está al final, el 95% del prompt se cachea → ahorra 100-300ms en LLM TTFT desde el turno 2 en adelante.

```
// Antes — {{customer.number}} en línea 2 (destruye el cache):
"Eres MediAgent...
NUMERO DEL CLIENTE: {{customer.number}}  ← aquí mata el cache
FLUJO:..."

// Después — al final:
"Eres MediAgent...
FLUJO:...
REGLAS:...
NUMERO DEL CLIENTE: {{customer.number}}"  ← cache funciona para todo lo anterior
```

**Métrica de éxito:** Turno 2+ debería ser 100-300ms más rápido que turno 1.

---

### Experimento C — `startSpeakingPlan` y `stopSpeakingPlan`

**Qué cambia:** Agregar config de VAD al assistant para que Vapi detecte fin de turno más rápido.

```json
{
  "startSpeakingPlan": {
    "waitSeconds": 0.3,
    "smartEndpointingPlan": { "provider": "vapi" }
  },
  "stopSpeakingPlan": {
    "numWords": 0,
    "voiceSeconds": 0.2,
    "backoffSeconds": 1.0
  }
}
```

**Por qué funciona:** `numWords: 0` = VAD puro (más rápido). `waitSeconds: 0.3` = el bot empieza a hablar 300ms después de detectar turno completo (default es más alto).  
**Riesgo:** Puede cortar al usuario si habla lento. Ajustar si hay problema.  
**Métrica de éxito:** `USER → BOT` pasa de ~3-4s a ~2-3s.

---

### Experimento D — `eotTimeoutMs` en Vapi

**Qué cambia:** Agregar `eotTimeoutMs: 500` en el transcriber.  
**Por qué funciona:** El blog menciona que el default de Vapi para end-of-turn timeout es 1000ms+. Bajarlo a 500ms ahorra 400-500ms en la detección de cuando el usuario terminó de hablar. Diferente al `endpointing: 50` de Deepgram (que ya tenemos bien).

```json
{
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-3",
    "language": "es",
    "smartFormat": false,
    "endpointing": 50,
    "eotTimeoutMs": 500
  }
}
```

**Métrica de éxito:** Reducción de 200-400ms en `USER → BOT` latency.

---

### Experimento E — gpt-4o-mini (si A+B+C+D no son suficientes)

**Qué cambia:** Cambiar el modelo a gpt-4o-mini.  
**Por qué funciona:** TTFT ~2x más rápido que gpt-4o. Para un flujo estructurado con pocos pasos, mini debería seguir el flujo correctamente.  
**Riesgo:** Menos robusto ante respuestas inesperadas del usuario. Probar solo si el flujo del demo es predecible.  
**Métrica de éxito:** `USER → BOT` cae de ~3s a ~1.5s.  
**Rollback:** Un PATCH de 10 segundos vuelve a gpt-4o.

---

## 4. Protocolo de prueba

Para cada experimento:
1. Aplicar el cambio (PATCH al asistente Vapi)
2. Hacer 2 llamadas de prueba con el flujo completo
3. Revisar logs: medir `USER → BOT` y `BOT → TOOL_CALLS` 
4. Comparar contra baseline y decidir si se queda

**Baseline actual (referencia):**
- `USER → BOT` (turno cedula): **4.07s**
- `BOT → TOOL_CALLS` (filler bloqueante): **6.26s**
- Latencia percibida total: **~11s**

**Target para demo:**
- `USER → BOT`: < 2s
- `BOT → TOOL_CALLS`: < 0.5s  
- Latencia percibida total: **< 5s**

---

## 5. Lo que NO haremos

- **Semantic cache**: requiere Future AGI gateway, overkill para hackathon
- **Regional routing**: single region, ganancia marginal (~60ms)
- **GPT-4o Realtime / Gemini Live**: sin voz colombiana disponible (decisión tomada)
- **Inline LLM evaluation**: no tenemos, bien

---

## 6. Orden de ejecución

```
A (tool messages)  →  medir  →  B (prefix cache)  →  medir  →  C (VAD plan)  →  medir
                                                                      ↓
                                                              ¿target alcanzado?
                                                             Sí → listo
                                                             No → D (eotTimeout) → E (mini)
```
