// Vapi assistant configuration — source of truth for assistant ID c9b4cf72-90c3-4d5b-a57f-10bd6d4f7262
// Apply changes with `npm run sync:assistant` or update the Vapi dashboard manually.

export const SYSTEM_PROMPT = `INSTRUCCION CRITICA: Cuando necesites llamar una tool, NO generes ningun texto antes. Ejecuta la tool directamente como primera accion. Solo habla despues de recibir el resultado.

Eres MediAgent, asistente de voz del dispensario farmaceutico. Espanol, calidez, frases cortas.

FLUJO:
1. SALUDO: Confirma que hablas con la persona correcta.
2. AUTENTICACION: Pide los ultimos cuatro digitos de la cedula. Llama verify_cc con phone_e164={{customer.number}} y los digitos. Si valid=false pide que repita. Si falla dos veces, despidete.
3. CONTEXTO: Llama get_patient_context con phone_e164={{customer.number}}. Anuncia cuantos medicamentos tiene listos.
4. AGENDAMIENTO:
   - all_available=true: ofrece dos horarios de suggested_slots. Al confirmar llama schedule_appointment.
   - all_available=false: agenda disponibles, propone domicilio para pendientes con delivery_for_pending=true.
5. CIERRE: Confirma turno, hora y copago. Despidete.

Si tool falla: problema tecnico, llame al dispensario. Termina.

NUMERO DEL CLIENTE: {{customer.number}}`;

export const ASSISTANT_CONFIG = {
  silenceTimeoutSeconds: 30,
  voice: {
    provider: "11labs",
    voiceId: "86V9x9hrQds83qf7zaGn", // Marcela — acento colombiano
    model: "eleven_flash_v2_5",
    stability: 0.5,
    similarityBoost: 0.75,
    optimizeStreamingLatency: 4,
    useSpeakerBoost: true,
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-3",
    language: "es",
    smartFormat: false,
    endpointing: 50,
    eotTimeoutMs: 500,
    confidenceThreshold: 0.4,
  },
  startSpeakingPlan: {
    waitSeconds: 0.3,
    smartEndpointingPlan: { provider: "vapi" },
  },
  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 1.0,
  },
  model: {
    provider: "openai",
    model: "gpt-4.1",
    temperature: 0.1,
    maxTokens: 120,
    messages: [{ role: "system", content: SYSTEM_PROMPT }],
    tools: [
      {
        type: "function",
        function: {
          name: "verify_cc",
          description: "Verifica los ultimos 4 digitos de la cedula.",
          parameters: {
            type: "object",
            properties: {
              phone_e164: { type: "string" },
              last_4_cc: {
                type: "string",
                description: "4 digitos exactos, ej: 4729",
              },
            },
            required: ["phone_e164", "last_4_cc"],
          },
        },
        messages: [
          { type: "request-start", content: "Verificando." },
          { type: "request-response-delayed", content: "Ya casi." },
        ],
        server: {
          url: "https://turnos-agent-production.up.railway.app/api/tools/verify-cc",
          timeoutSeconds: 8,
        },
      },
      {
        type: "function",
        function: {
          name: "get_patient_context",
          description:
            "Obtiene formula, stock y horarios. Solo llamar despues de autenticar.",
          parameters: {
            type: "object",
            properties: { phone_e164: { type: "string" } },
            required: ["phone_e164"],
          },
        },
        messages: [
          { type: "request-start", content: "Consultando tu formula." },
          { type: "request-response-delayed", content: "Ya casi." },
        ],
        server: {
          url: "https://turnos-agent-production.up.railway.app/api/tools/get-patient-context",
          timeoutSeconds: 8,
        },
      },
      {
        type: "function",
        function: {
          name: "schedule_appointment",
          description: "Crea la cita de recogida.",
          parameters: {
            type: "object",
            properties: {
              prescription_id: { type: "string" },
              slot_start: { type: "string" },
              copay_cents: { type: "integer" },
              delivery_for_pending: { type: "boolean" },
              delivery_date: { type: "string" },
            },
            required: ["prescription_id", "slot_start", "copay_cents"],
          },
        },
        messages: [
          { type: "request-start", content: "Agendando tu cita." },
          { type: "request-response-delayed", content: "Ya casi." },
        ],
        server: {
          url: "https://turnos-agent-production.up.railway.app/api/tools/schedule-appointment",
          timeoutSeconds: 8,
        },
      },
    ],
  },
};
