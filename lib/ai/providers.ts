import Anthropic from "@anthropic-ai/sdk";

// ═══════════════════════════════════════════════════════════════════════════════
// Provider adapter — run any AI feature on Anthropic (Claude) OR an
// OpenAI-compatible open-model endpoint (Vertex AI Model Garden / Gemma,
// Together, Groq, Fireworks, or a self-hosted vLLM server), chosen by env.
//
// Env (all optional — with nothing set, behaviour is identical to before: Claude):
//   AI_PROVIDER=oss|anthropic                  global default (default: anthropic)
//   AI_PROVIDER_GRADING / _TUTOR / _FLASHCARDS per-feature override (e.g. flip
//                                              grading to oss while Nova stays Claude)
//   OSS_AI_BASE_URL    OpenAI-compatible base, e.g. https://<endpoint>/v1
//   OSS_AI_API_KEY     bearer token for that endpoint
//   OSS_AI_MODEL       primary open model id, e.g. "google/gemma-3-27b-it"
//   OSS_AI_MODEL_CHEAP optional cheaper model for the over-budget degrade tier
//   AI_OSS_FALLBACK=claude|none  on OSS error, fall back to Claude (default: claude)
//
// The adapter keeps the same request/response shape regardless of provider, so
// callAR()/callers don't change. Secrets live ONLY in env — never in code.
// ═══════════════════════════════════════════════════════════════════════════════

export type ChatMsg = { role: "user" | "assistant"; content: string };
export type Provider = "anthropic" | "oss";

export interface GenParams {
  model: string;
  system?: string;
  messages: ChatMsg[];
  max_tokens?: number;
  temperature?: number;
}

export interface GenResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/** Pick the provider for a feature: per-feature env override > global > anthropic. */
export function providerFor(feature?: string): Provider {
  const perFeature = feature
    ? process.env[`AI_PROVIDER_${feature.toUpperCase()}`]
    : undefined;
  const choice = (perFeature ?? process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  return choice === "oss" ? "oss" : "anthropic";
}

async function genAnthropic(p: GenParams): Promise<GenResult> {
  const client = new Anthropic({ maxRetries: 5 });
  const r = await client.messages.create({
    model: p.model,
    max_tokens: p.max_tokens ?? 1024,
    temperature: p.temperature ?? 0,
    ...(p.system ? { system: p.system } : {}),
    messages: p.messages,
  });
  const text = r.content[0]?.type === "text" ? r.content[0].text : "";
  return { text, inputTokens: r.usage.input_tokens, outputTokens: r.usage.output_tokens };
}

async function genOSS(p: GenParams): Promise<GenResult> {
  const base = process.env.OSS_AI_BASE_URL;
  if (!base) throw new Error("OSS_AI_BASE_URL is not set");
  const apiKey = process.env.OSS_AI_API_KEY ?? "";

  // OpenAI chat-completions shape: system goes in as the first message.
  const messages = [
    ...(p.system ? [{ role: "system", content: p.system }] : []),
    ...p.messages,
  ];

  const res = await fetch(`${base.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: p.model,
      messages,
      max_tokens: p.max_tokens ?? 1024,
      temperature: p.temperature ?? 0,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OSS AI endpoint ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const usage = data?.usage ?? {};
  return {
    text,
    inputTokens: Number(usage.prompt_tokens ?? 0),
    outputTokens: Number(usage.completion_tokens ?? 0),
  };
}

/** Generate a completion via the chosen provider. */
export async function generate(provider: Provider, p: GenParams): Promise<GenResult> {
  return provider === "oss" ? genOSS(p) : genAnthropic(p);
}
