import { NextRequest } from "next/server";

// Custom LLM proxy: strips filler text before tool calls so Vapi executes
// tool HTTP requests immediately without waiting for TTS to finish.
export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("[llm-proxy] turn — messages:", body.messages?.length);

  const openaiResp = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, stream: true }),
    }
  );

  if (!openaiResp.ok) {
    const err = await openaiResp.text();
    console.error("[llm-proxy] OpenAI error:", openaiResp.status, err);
    return new Response(err, { status: openaiResp.status });
  }

  const encoder = new TextEncoder();

  const transformed = new ReadableStream({
    async start(controller) {
      const reader = openaiResp.body!.getReader();
      const decoder = new TextDecoder();

      let partial = "";
      // Buffer content lines + finish_reason lines; emit only if no tool call follows
      const textBuffer: string[] = [];
      let hasToolCall = false;

      const push = (s: string) => controller.enqueue(encoder.encode(s));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partial += decoder.decode(value, { stream: true });
          const lines = partial.split("\n");
          partial = lines.pop() ?? "";

          for (const line of lines) {
            // Skip blank lines — we add our own \n\n after each event
            if (line === "") continue;

            if (!line.startsWith("data: ")) {
              push(line + "\n");
              continue;
            }

            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              // Flush buffered text/finish_reason if no tool call
              if (!hasToolCall && textBuffer.length > 0) {
                console.log("[llm-proxy] conversational turn — flushing", textBuffer.length, "chunks");
                for (const buffered of textBuffer) {
                  push(buffered + "\n\n");
                }
              } else if (hasToolCall) {
                console.log("[llm-proxy] tool call turn — discarded filler text");
              }
              push("data: [DONE]\n\n");
              continue;
            }

            let chunk: {
              choices?: Array<{
                delta?: {
                  role?: string;
                  content?: string | null;
                  tool_calls?: unknown[];
                };
                finish_reason?: string | null;
              }>;
            };
            try {
              chunk = JSON.parse(data);
            } catch {
              push(line + "\n\n");
              continue;
            }

            const delta = chunk.choices?.[0]?.delta;
            const finishReason = chunk.choices?.[0]?.finish_reason;

            if (delta?.tool_calls) {
              // Tool call — discard any buffered text, emit tool call immediately
              console.log("[llm-proxy] tool_calls detected — discarding", textBuffer.length, "buffered text chunks");
              hasToolCall = true;
              textBuffer.length = 0;
              push(line + "\n\n");
            } else if (delta?.content) {
              // Buffer text — don't emit until we know no tool call follows
              textBuffer.push(line);
            } else if (finishReason && !hasToolCall) {
              // finish_reason for a text turn — buffer it so it emits AFTER content
              textBuffer.push(line);
            } else {
              // Role assignment chunk, or finish_reason:"tool_calls" — emit immediately
              push(line + "\n\n");
            }
          }
        }
      } catch (err) {
        console.error("[llm-proxy] stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(transformed, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
