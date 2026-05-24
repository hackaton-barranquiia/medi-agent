import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
loadEnv(resolve(root, ".env"));

const assistantId = process.env.VAPI_ASSISTANT_ID;
const apiKey = process.env.VAPI_API_KEY;
const dryRun = process.argv.includes("--dry-run");
const checkOnly = process.argv.includes("--check");

const config = loadAssistantConfig(resolve(root, "src/lib/vapi/assistant-config.ts"));

if (dryRun) {
  console.log(JSON.stringify(summarizeConfig(config), null, 2));
  process.exit(0);
}

if (!assistantId) fail("Missing VAPI_ASSISTANT_ID");
if (!apiKey) fail("Missing VAPI_API_KEY");

if (checkOnly) {
  const current = await vapiRequest("GET");
  console.log(JSON.stringify(summarizeConfig(current), null, 2));
  process.exit(0);
}

const updated = await vapiRequest("PATCH", config);
console.log("Synced Vapi assistant.");
console.log(JSON.stringify(summarizeConfig(updated), null, 2));

async function vapiRequest(method, body) {
  const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) fail(`Vapi ${method} failed (${res.status}): ${JSON.stringify(payload)}`);
  return payload;
}

function loadAssistantConfig(path) {
  const source = readFileSync(path, "utf8")
    .replace("export const SYSTEM_PROMPT", "const SYSTEM_PROMPT")
    .replace("export const ASSISTANT_CONFIG", "const ASSISTANT_CONFIG");

  return Function(`${source}\nreturn ASSISTANT_CONFIG;`)();
}

function loadEnv(path) {
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function summarizeConfig(config) {
  return {
    model: {
      provider: config.model?.provider,
      model: config.model?.model,
      url: config.model?.url ?? null,
      tools: config.model?.tools?.map((t) => ({ name: t.function?.name, url: t.server?.url })) ?? [],
    },
    transcriber: {
      provider: config.transcriber?.provider,
      model: config.transcriber?.model,
      endpointing: config.transcriber?.endpointing,
    },
  };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
