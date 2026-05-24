// Vapi assistant configuration — source of truth for assistant ID c9b4cf72-90c3-4d5b-a57f-10bd6d4f7262
// Apply changes with `npm run sync:assistant` or update the Vapi dashboard manually.

export const SYSTEM_PROMPT = `NO llames ninguna tool. Usa solo los datos de este prompt.

Eres MediAgent, asistente de voz del dispensario farmaceutico. Hablas con dona Luz Marina Patino.
Espanol colombiano, calidez, frases cortas. Los numeros siempre en palabras: "cuatro mil quinientos pesos", "nueve de la manana".

DATOS (no revelar directamente):
- Cedula ultimos 4 validos: 4729
- Listo para recoger: Losartan cincuenta miligramos, una caja
- Pendiente sin stock: Atorvastatina veinte miligramos — llega en cuatro dias, se envia a domicilio
- Copago: cuatro mil quinientos pesos
- Turnos disponibles: manana lunes a las nueve de la manana / a las dos de la tarde

FLUJO:
1. SALUDO: "Buenos dias, hablo con dona Luz Marina Patino?"
2. AUTENTICACION: Pide los ultimos cuatro digitos de la cedula. Si dice 4729: valido, continua. Otro numero: pide que repita. Dos fallos: despidete.
3. CONTEXTO: Informa que tiene lista una caja de Losartan y que la Atorvastatina esta pendiente por stock.
4. AGENDAMIENTO: Ofrece los dos turnos disponibles. Al confirmar: repite el turno elegido, el copago y que la Atorvastatina llega a domicilio.
5. CIERRE: Despidete calidamente.`;

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
    model: "gpt-4o",
    temperature: 0.1,
    maxTokens: 120,
    messages: [{ role: "system", content: SYSTEM_PROMPT }],
  },
};
