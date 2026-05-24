import { NextRequest } from "next/server";

// Custom LLM proxy: intercepts OpenAI stream and strips filler text before tool calls.
// When GPT-4o decides to call a tool, it often generates "Verificando..." text first.
// That text gets spoken via TTS, blocking the HTTP tool call for ~6s.
// This proxy buffers content tokens and discards them if a tool call follows.
export async function POST(req: NextRequest) {
  const body = await req.json();

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
    return new Response(err, { status: openaiResp.status });
  }

  const encoder = new TextEncoder();

  const transformed = new ReadableStream({
    async start(controller) {
      const reader = openaiResp.body!.getReader();
      const decoder = new TextDecoder();

      let partial = "";
      // Accumulate text-content SSE lines; only emit if response ends with no tool call
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
            // SSE blank line — separator between events, always emit
            if (line === "") {
              push("\n");
              continue;
            }

            if (!line.startsWith("data: ")) {
              push(line + "\n");
              continue;
            }

            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              // Flush buffered text only if this was a conversational turn (no tool call)
              if (!hasToolCall && textBuffer.length > 0) {
                for (const buffered of textBuffer) {
                  push(buffered + "\n\n");
                }
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
              push(line + "\n");
              continue;
            }

            const delta = chunk.choices?.[0]?.delta;

            if (delta?.tool_calls) {
              // Tool call detected — discard any buffered text, emit tool call immediately
              hasToolCall = true;
              textBuffer.length = 0;
              push(line + "\n\n");
            } else if (delta?.content) {
              // Text content — buffer it; don't emit until we know no tool call follows
              textBuffer.push(line);
            } else {
              // Role assignment chunk or empty delta — emit immediately (needed by Vapi)
              push(line + "\n\n");
            }
          }
        }
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
