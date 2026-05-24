import { NextRequest } from "next/server";

// Custom LLM proxy: eliminates filler text before tool calls.
//
// Strategy — "fast-start":
//   - Watch the first meaningful delta (after the role chunk).
//   - If the first delta has tool_calls → enter TOOL mode: skip any
//     filler text that appears later, emit tool call chunks immediately.
//   - If the first delta has content → enter PASSTHROUGH mode: stream
//     everything immediately (no buffering — avoids Vapi timeout).
//
// This works because GPT-4o signals its intent on the very first token:
// either a function call OR a text response, never both at once at t=0.
// When the model follows the system prompt ("no text before tools"),
// the first delta will be tool_calls and filler is eliminated entirely.
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[llm-proxy] turn, messages:", body.messages?.length);

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
      // "initial" = waiting for first meaningful delta
      // "passthrough" = conversational turn, stream everything
      // "tool" = tool call turn, skip text, emit tool chunks
      let mode: "initial" | "passthrough" | "tool" = "initial";

      const push = (s: string) => controller.enqueue(encoder.encode(s));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partial += decoder.decode(value, { stream: true });
          const lines = partial.split("\n");
          partial = lines.pop() ?? "";

          for (const line of lines) {
            if (line === "") continue; // SSE blank separator — we add our own

            if (!line.startsWith("data: ")) {
              push(line + "\n");
              continue;
            }

            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              console.log("[llm-proxy] done, mode:", mode);
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

            if (mode === "initial") {
              if (delta?.tool_calls) {
                // First meaningful delta is a tool call → suppress future text
                console.log("[llm-proxy] mode=tool (first delta is tool_call)");
                mode = "tool";
                push(line + "\n\n");
              } else if (delta?.content) {
                // First meaningful delta is text → passthrough everything
                console.log("[llm-proxy] mode=passthrough (first delta is content)");
                mode = "passthrough";
                push(line + "\n\n");
              } else {
                // Role chunk or empty — emit and stay in initial
                push(line + "\n\n");
              }
            } else if (mode === "passthrough") {
              // Conversational turn: stream everything as-is
              push(line + "\n\n");
            } else {
              // Tool call mode: emit tool_calls chunks, skip content
              if (delta?.content) {
                // Suppress filler text
              } else {
                push(line + "\n\n");
              }
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
