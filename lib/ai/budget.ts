import { createClient } from "@/lib/supabase/server";
import { generate, providerFor } from "./providers";

// ═══════════════════════════════════════════════════════════════════════════════
// AI Budget Guardrail — wallet-based spend control
//
// How it works:
// 1. When a student pays, $AI_ALLOCATION is ring-fenced into their ai_wallet
// 2. Every AI call checks the wallet balance before proceeding
// 3. If balance is exhausted, BudgetExceededError is thrown
// 4. After each call, spend is logged in both api_usage (tracking) and
//    ai_wallets (balance)
// 5. Monthly sweep returns any unspent balance to the pool
//
// Pricing: Claude Sonnet 4.5
//   Input:  $3  / million tokens
//   Output: $15 / million tokens
// ═══════════════════════════════════════════════════════════════════════════════

/** Amount ring-fenced per student per month from their subscription */
export const AI_ALLOCATION_USD = 1.2;

/** Fallback budget for students without a wallet (free tier / dev testing) */
const FALLBACK_BUDGET_USD = 1.2;

// Per-token pricing by model
const PRICING = {
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
} as const;

const MODEL_SONNET = "claude-sonnet-4-6";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

// Open-model ids — used when a feature is routed to the "oss" provider via env.
// Global fallbacks:  OSS_AI_MODEL / OSS_AI_MODEL_CHEAP
// Per-feature:       OSS_AI_MODEL_GRADING / OSS_AI_MODEL_TUTOR / OSS_AI_MODEL_FLASHCARDS etc.
//                    OSS_AI_MODEL_CHEAP_GRADING / OSS_AI_MODEL_CHEAP_TUTOR etc.
// Inert until AI_PROVIDER(_FEATURE)=oss is set.
const OSS_MODEL = process.env.OSS_AI_MODEL ?? "oss-model";
const OSS_MODEL_CHEAP = process.env.OSS_AI_MODEL_CHEAP ?? OSS_MODEL;

function ossModelFor(feature?: string): string {
  const perFeature = feature && process.env[`OSS_AI_MODEL_${feature.toUpperCase()}`];
  return perFeature || OSS_MODEL;
}

function ossModelCheapFor(feature?: string): string {
  const perFeature = feature && process.env[`OSS_AI_MODEL_CHEAP_${feature.toUpperCase()}`];
  return perFeature || OSS_MODEL_CHEAP;
}

// Once a student's wallet is spent we DON'T cut them off — we degrade to the
// cheaper Haiku model so the tutor keeps working. We only hard-stop past an
// absolute ceiling so cost can never run unbounded.
const HARD_CEILING_MULTIPLIER = 2;

// ─── Platform-wide monthly ceiling ───────────────────────────────────────────
// Per-student wallets can't see aggregate cost: 10k students × small amounts,
// or a bot-signup swarm, each stays under its own wallet while the total runs
// away. This is the guardrail on the whole card: past the soft ceiling EVERY
// call degrades to the cheap tier and the founder is alerted; past 2× the
// platform hard-stops AI features entirely.
const PLATFORM_AI_BUDGET_USD = Number(process.env.PLATFORM_AI_BUDGET_USD ?? 100);

/** Total platform AI spend this month (all students), via a DB-side SUM. */
async function getPlatformSpend(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_month_ai_spend", { p_month: getMonthKey() });
    if (error) {
      console.error("[budget] get_month_ai_spend:", error);
      return 0; // fail-open: never block AI on a monitoring query failure
    }
    return Number(data ?? 0);
  } catch (err) {
    console.error("[budget] platform spend check failed:", err);
    return 0;
  }
}

// Alert the founder when the platform ceiling is crossed. Deduped per
// serverless instance per month+tier — a burst may send a handful of emails
// across instances, which is acceptable for a budget alarm.
const platformAlertsSent = new Set<string>();
function alertPlatformBudget(spent: number, hardStop: boolean): void {
  const key = `${getMonthKey()}:${hardStop ? "hard" : "soft"}`;
  if (platformAlertsSent.has(key)) return;
  platformAlertsSent.add(key);
  const msg = `[budget] PLATFORM AI ${hardStop ? "HARD-STOP" : "soft ceiling"}: $${spent.toFixed(2)} of $${PLATFORM_AI_BUDGET_USD} this month`;
  console.error(msg);
  // Fire-and-forget email — never let alerting break an AI call.
  void (async () => {
    try {
      const { getResend } = await import("@/lib/email/resend");
      const to = process.env.LEAD_NOTIFY_EMAIL ?? "nikhil.desilva@square1ai.com";
      await getResend().emails.send({
        from: "Square 1 AI <tech@square1ai.com>",
        to,
        subject: hardStop
          ? `🛑 Platform AI budget HARD-STOP at $${spent.toFixed(2)}`
          : `⚠️ Platform AI budget soft ceiling crossed ($${spent.toFixed(2)} / $${PLATFORM_AI_BUDGET_USD})`,
        text: `${msg}\n\n${hardStop
          ? "AI features are now stopped platform-wide until the month resets or PLATFORM_AI_BUDGET_USD is raised."
          : "All AI calls are now degraded to the cheap model tier. Hard stop at 2× the ceiling."}\n\nAdjust via the PLATFORM_AI_BUDGET_USD env var in Vercel.`,
      });
    } catch (err) {
      console.error("[budget] platform alert email failed:", err);
    }
  })();
}

export class BudgetExceededError extends Error {
  constructor(spent: number, budget: number) {
    super(
      `Monthly AI budget exceeded ($${spent.toFixed(2)} / $${budget.toFixed(2)}). ` +
        `Your budget resets at the start of next month.`
    );
    this.name = "BudgetExceededError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Current month key: "2026-06" */
function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Calculate cost from token counts. Claude models use the PRICING table; open
 *  models use optional env rates (OSS_AI_PRICE_*_PER_MTOK), else 0 (self-host). */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = (PRICING as Record<string, { input: number; output: number }>)[model];
  if (p) return inputTokens * p.input + outputTokens * p.output;
  const inRate = Number(process.env.OSS_AI_PRICE_IN_PER_MTOK ?? 0) / 1_000_000;
  const outRate = Number(process.env.OSS_AI_PRICE_OUT_PER_MTOK ?? 0) / 1_000_000;
  return inputTokens * inRate + outputTokens * outRate;
}

// ─── Wallet management ───────────────────────────────────────────────────────

/**
 * Allocate AI budget for a student. Call this when payment is received.
 * If a wallet already exists for the month, it tops up the allocation.
 */
export async function allocateWallet(
  studentId: string,
  amount: number = AI_ALLOCATION_USD,
  fundedBy: string = "system",
  paymentId?: string
): Promise<void> {
  const supabase = await createClient();
  const monthKey = getMonthKey();

  const { data: existing } = await supabase
    .from("ai_wallets")
    .select("id, allocated_amount")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("ai_wallets")
      .update({
        allocated_amount: Number(existing.allocated_amount) + amount,
        funded_by: fundedBy,
        payment_id: paymentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("ai_wallets").insert({
      student_id: studentId,
      month_key: monthKey,
      allocated_amount: amount,
      spent_amount: 0,
      funded_by: fundedBy,
      payment_id: paymentId ?? null,
    });
  }
}

/**
 * Get the student's wallet balance for the current month.
 * If no wallet exists, returns the fallback budget (for dev/free-tier).
 */
async function getWalletBalance(
  studentId: string
): Promise<{ budget: number; spent: number; remaining: number; hasWallet: boolean }> {
  const supabase = await createClient();
  const monthKey = getMonthKey();

  const { data: wallet } = await supabase
    .from("ai_wallets")
    .select("allocated_amount, spent_amount")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (wallet) {
    const budget = Number(wallet.allocated_amount);
    const spent = Number(wallet.spent_amount);
    return {
      budget,
      spent,
      remaining: Math.max(0, budget - spent),
      hasWallet: true,
    };
  }

  // No wallet — use fallback budget, check api_usage for spend
  const { data: usage } = await supabase
    .from("api_usage")
    .select("estimated_cost")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  const spent = Number(usage?.estimated_cost ?? 0);
  return {
    budget: FALLBACK_BUDGET_USD,
    spent,
    remaining: Math.max(0, FALLBACK_BUDGET_USD - spent),
    hasWallet: false,
  };
}

// ─── Budget check ────────────────────────────────────────────────────────────

export async function checkBudget(
  studentId: string
): Promise<{ ok: boolean; spent: number; remaining: number; budget: number }> {
  const { budget, spent, remaining } = await getWalletBalance(studentId);
  return {
    ok: spent < budget,
    spent,
    remaining,
    budget,
  };
}

// ─── Usage logging ───────────────────────────────────────────────────────────

async function logUsage(
  studentId: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
): Promise<void> {
  const supabase = await createClient();
  const monthKey = getMonthKey();

  // Atomic upsert-and-increment of both api_usage and (if present) ai_wallets.
  // Done in one SQL function so concurrent AI calls (e.g. parallel assessment
  // grading) can't lose each other's cost increments via read-modify-write.
  const { error } = await supabase.rpc("log_ai_usage", {
    p_student: studentId,
    p_month: monthKey,
    p_input: inputTokens,
    p_output: outputTokens,
    p_cost: cost,
  });

  if (error) console.error("[budget] log_ai_usage:", error);
}

// ─── Main function: budget-checked AI call ───────────────────────────────────

/**
 * Use this for ALL Anthropic API calls. It:
 * 1. Checks the student's wallet/budget before calling
 * 2. Makes the API call
 * 3. Logs usage to both api_usage and ai_wallets
 * 4. Returns the response with cost data
 */
export async function callAI(
  studentId: string,
  params: {
    system?: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
    /** Routing label (e.g. "grading" | "tutor" | "flashcards") for per-feature
     *  provider selection via AI_PROVIDER_<FEATURE>. Optional. */
    feature?: string;
  }
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
  provider: string;
  degraded: boolean;
}> {
  // 1. Check budgets (student wallet + platform ceiling) and decide the degrade tier
  const [budgetCheck, platformSpent] = await Promise.all([
    checkBudget(studentId),
    getPlatformSpend(),
  ]);

  // Platform hard stop: past 2× the global ceiling, no AI runs for anyone.
  if (platformSpent >= PLATFORM_AI_BUDGET_USD * HARD_CEILING_MULTIPLIER) {
    alertPlatformBudget(platformSpent, true);
    throw new BudgetExceededError(platformSpent, PLATFORM_AI_BUDGET_USD * HARD_CEILING_MULTIPLIER);
  }
  const platformOver = platformSpent >= PLATFORM_AI_BUDGET_USD;
  if (platformOver) alertPlatformBudget(platformSpent, false);

  const overBudget = !budgetCheck.ok || platformOver; // degrade tier: student wallet spent OR platform soft ceiling

  // Only hard-stop past the absolute ceiling — otherwise degrade gracefully.
  if (!budgetCheck.ok && budgetCheck.spent >= budgetCheck.budget * HARD_CEILING_MULTIPLIER) {
    throw new BudgetExceededError(budgetCheck.spent, budgetCheck.budget * HARD_CEILING_MULTIPLIER);
  }

  // 2. Pick provider (per-feature env) + model (primary, or cheaper degrade tier).
  let provider = providerFor(params.feature);
  let model =
    provider === "oss"
      ? (overBudget ? ossModelCheapFor(params.feature) : ossModelFor(params.feature))
      : (overBudget ? MODEL_HAIKU : MODEL_SONNET);

  const gen = {
    system: params.system,
    messages: params.messages,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
  };

  // 3. Call the provider. The SDK/endpoint rides out transient 429/529s with
  // backoff. If an open endpoint fails, fall back to Claude (default on) so
  // high-stakes calls (grading) still complete.
  let result;
  try {
    result = await generate(provider, { model, ...gen });
  } catch (err) {
    const fallback = (process.env.AI_OSS_FALLBACK ?? "claude").toLowerCase();
    if (provider === "oss" && fallback === "claude") {
      console.error("[ai] OSS provider failed — falling back to Claude:", err);
      provider = "anthropic";
      model = overBudget ? MODEL_HAIKU : MODEL_SONNET;
      result = await generate("anthropic", { model, ...gen });
    } else {
      throw err;
    }
  }

  // 4. Cost (priced by the model actually used) + non-blocking usage log
  const { text, inputTokens, outputTokens } = result;
  const cost = calculateCost(model, inputTokens, outputTokens);
  logUsage(studentId, inputTokens, outputTokens, cost).catch((err) => {
    console.error("[budget] Failed to log usage:", err);
  });

  // 5. Return
  return { text, inputTokens, outputTokens, cost, model, provider, degraded: overBudget };
}

// ─── Usage summary (for dashboards) ─────────────────────────────────────────

export async function getUsageSummary(studentId: string) {
  const { budget, spent, remaining, hasWallet } =
    await getWalletBalance(studentId);
  const monthKey = getMonthKey();

  const supabase = await createClient();
  const { data } = await supabase
    .from("api_usage")
    .select("*")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  return {
    monthKey,
    totalCalls: data?.total_calls ?? 0,
    inputTokens: data?.input_tokens ?? 0,
    outputTokens: data?.output_tokens ?? 0,
    estimatedCost: spent,
    budget,
    remaining,
    percentUsed: Math.min(100, (spent / budget) * 100),
    hasWallet,
  };
}

// ─── Sweep: return unused budget to pool ─────────────────────────────────────

/**
 * Sweep all wallets from a given month. Returns total amount swept.
 * Call this from a cron job at the start of each month for the previous month.
 */
export async function sweepMonth(
  monthKey: string
): Promise<{ swept: number; count: number }> {
  const supabase = await createClient();

  // Find all un-swept wallets for the month
  const { data: wallets } = await supabase
    .from("ai_wallets")
    .select("id, allocated_amount, spent_amount")
    .eq("month_key", monthKey)
    .is("swept_at", null);

  if (!wallets || wallets.length === 0) {
    return { swept: 0, count: 0 };
  }

  let totalSwept = 0;

  for (const w of wallets) {
    const leftover = Math.max(
      0,
      Number(w.allocated_amount) - Number(w.spent_amount)
    );
    totalSwept += leftover;

    await supabase
      .from("ai_wallets")
      .update({
        swept_amount: leftover,
        swept_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", w.id);
  }

  return { swept: totalSwept, count: wallets.length };
}
