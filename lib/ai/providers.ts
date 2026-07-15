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
  // Abort a stalled request so it becomes a *retryable* error instead of hanging
  // forever — some networks / undici versions hang indefinitely on a dead
  // keep-alive socket (curl to the same endpoint returns in ~1s). The retry loop
  // below then recovers on a fresh connection. Env-tunable.
  const timeoutMs = Number(process.env.OSS_AI_TIMEOUT_MS ?? 60_000);

  // OpenAI chat-completions shape: system goes in as the first message.
  const messages = [
    ...(p.system ? [{ role: "system", content: p.system }] : []),
    ...p.messages,
  ];

  // Escape hatch for environments where undici's global fetch hangs (observed on
  // Node 24 on some networks) even though node:https / curl to the same endpoint
  // return in ~1s. OFF by default, so the production path is unchanged; set
  // OSS_AI_HTTP=node to route through node:https instead (used by the calibration
  // harness locally).
  if (process.env.OSS_AI_HTTP === "node") {
    return genOSSViaNodeHttps(p, base, apiKey, messages, timeoutMs);
  }

  // Ride out transient 429/5xx with backoff, mirroring the Anthropic SDK's
  // maxRetries — essential when AI_OSS_FALLBACK=none, or every rate-limit
  // blip becomes a user-facing grading failure. Honours Retry-After.
  const MAX_ATTEMPTS = 5;
  let res: Response | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      res = await fetch(`${base.replace(/\/+$/, "")}/chat/completions`, {
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
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Network-level failure (DNS drop, reset connection) — retryable too.
      res = undefined;
      if (attempt === MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 30_000)));
      continue;
    }
    if (res.ok) break;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) break;
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 60_000)
      : Math.min(1000 * 2 ** attempt, 30_000) + Math.random() * 500;
    await res.text().catch(() => "");
    await new Promise((r) => setTimeout(r, waitMs));
  }

  if (!res || !res.ok) {
    const body = res ? await res.text().catch(() => "") : "";
    throw new Error(`OSS AI endpoint ${res?.status ?? "unreachable"}: ${body.slice(0, 300)}`);
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

/**
 * node:https transport for the OSS endpoint — used only when OSS_AI_HTTP=node.
 * Same request/response contract as genOSS's fetch path (with backoff on
 * 429/5xx and network errors), but bypasses undici. Kept self-contained so the
 * default fetch path is completely untouched.
 */
async function genOSSViaNodeHttps(
  p: GenParams,
  base: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  timeoutMs: number,
): Promise<GenResult> {
  const { request } = await import("node:https");
  const u = new URL(`${base.replace(/\/+$/, "")}/chat/completions`);
  const bodyStr = JSON.stringify({
    model: p.model,
    messages,
    max_tokens: p.max_tokens ?? 1024,
    temperature: p.temperature ?? 0,
  });

  const post = () =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = request(
        {
          hostname: u.hostname,
          port: u.port || 443,
          path: u.pathname + u.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr),
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          timeout: timeoutMs,
        },
        (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (c) => {
            data += c;
          });
          res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
        },
      );
      req.on("timeout", () => req.destroy(new Error("node:https request timeout")));
      req.on("error", reject);
      req.write(bodyStr);
      req.end();
    });

  const MAX_ATTEMPTS = 5;
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { status, body } = await post();
      if (status >= 200 && status < 300) {
        const data = JSON.parse(body);
        const text: string = data?.choices?.[0]?.message?.content ?? "";
        const usage = data?.usage ?? {};
        return {
          text,
          inputTokens: Number(usage.prompt_tokens ?? 0),
          outputTokens: Number(usage.completion_tokens ?? 0),
        };
      }
      lastErr = `${status}: ${body.slice(0, 300)}`;
      if (!(status === 429 || status >= 500) || attempt === MAX_ATTEMPTS) break;
    } catch (err) {
      lastErr = String(err);
      if (attempt === MAX_ATTEMPTS) throw err;
    }
    await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 30_000)));
  }
  throw new Error(`OSS AI (node:https) failed: ${lastErr}`);
}

/** Generate a completion via the chosen provider. */
export async function generate(provider: Provider, p: GenParams): Promise<GenResult> {
  return provider === "oss" ? genOSS(p) : genAnthropic(p);
}
