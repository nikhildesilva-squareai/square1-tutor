import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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
  "claude-sonnet-4-5": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
} as const;

const MODEL_SONNET = "claude-sonnet-4-5";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

// Once a student's wallet is spent we DON'T cut them off — we degrade to the
// cheaper Haiku model so the tutor keeps working. We only hard-stop past an
// absolute ceiling so cost can never run unbounded.
const HARD_CEILING_MULTIPLIER = 2;

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

/** Calculate cost from token counts for a given model */
function calculateCost(model: keyof typeof PRICING, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? PRICING[MODEL_SONNET];
  return inputTokens * p.input + outputTokens * p.output;
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

  // 1. Update api_usage (tracking table)
  const { data: existing } = await supabase
    .from("api_usage")
    .select("id, total_calls, input_tokens, output_tokens, estimated_cost")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("api_usage")
      .update({
        total_calls: existing.total_calls + 1,
        input_tokens: existing.input_tokens + inputTokens,
        output_tokens: existing.output_tokens + outputTokens,
        estimated_cost: Number(existing.estimated_cost) + cost,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("api_usage").insert({
      student_id: studentId,
      month_key: monthKey,
      total_calls: 1,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: cost,
    });
  }

  // 2. Update ai_wallets spent_amount (if wallet exists)
  const { data: wallet } = await supabase
    .from("ai_wallets")
    .select("id, spent_amount")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (wallet) {
    await supabase
      .from("ai_wallets")
      .update({
        spent_amount: Number(wallet.spent_amount) + cost,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);
  }
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
  }
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
  degraded: boolean;
}> {
  // 1. Check budget and decide the model
  const budgetCheck = await checkBudget(studentId);
  const overBudget = !budgetCheck.ok; // spent >= allocated

  // Only hard-stop past the absolute ceiling — otherwise degrade gracefully.
  if (overBudget && budgetCheck.spent >= budgetCheck.budget * HARD_CEILING_MULTIPLIER) {
    throw new BudgetExceededError(budgetCheck.spent, budgetCheck.budget * HARD_CEILING_MULTIPLIER);
  }

  const model = overBudget ? MODEL_HAIKU : MODEL_SONNET;

  // 2. Make the API call
  const client = new Anthropic();
  const response = await client.messages.create({
    model,
    max_tokens: params.max_tokens ?? 1024,
    temperature: params.temperature ?? 0,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
  });

  // 3. Extract usage + cost (priced by the model actually used)
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cost = calculateCost(model, inputTokens, outputTokens);

  // 4. Log usage (non-blocking)
  logUsage(studentId, inputTokens, outputTokens, cost).catch((err) => {
    console.error("[budget] Failed to log usage:", err);
  });

  // 5. Return
  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return { text, inputTokens, outputTokens, cost, model, degraded: overBudget };
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
