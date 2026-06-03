import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// ═══════════════════════════════════════════════════════════════════════════════
// API Cost Guardrail — limits Claude API spend to $MONTHLY_BUDGET per student
//
// How it works:
// 1. Before each API call, check if the student has exceeded their monthly budget
// 2. If exceeded, throw a BudgetExceededError instead of calling the API
// 3. After each successful call, log the token usage + estimated cost
// 4. Cost calculation uses Claude Sonnet 4.5 pricing:
//    Input:  $3  / million tokens
//    Output: $15 / million tokens
// ═══════════════════════════════════════════════════════════════════════════════

const MONTHLY_BUDGET_USD = 2.00; // $2 per student per month

// Claude Sonnet 4.5 pricing (per token, not per million)
const INPUT_COST_PER_TOKEN  = 3  / 1_000_000; // $0.000003
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000; // $0.000015

const MODEL = "claude-sonnet-4-5";

export class BudgetExceededError extends Error {
  constructor(spent: number) {
    super(
      `Monthly AI budget exceeded ($${spent.toFixed(2)} / $${MONTHLY_BUDGET_USD.toFixed(2)}). ` +
      `Your budget resets at the start of next month.`
    );
    this.name = "BudgetExceededError";
  }
}

// Get current month key: "2026-06"
function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Calculate cost from token counts
function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * INPUT_COST_PER_TOKEN) + (outputTokens * OUTPUT_COST_PER_TOKEN);
}

// ─── Check budget before making an API call ──────────────────────────────────
export async function checkBudget(studentId: string): Promise<{ ok: boolean; spent: number; remaining: number }> {
  const supabase = await createClient();
  const monthKey = getMonthKey();

  const { data } = await supabase
    .from("api_usage")
    .select("estimated_cost")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  const spent = Number(data?.estimated_cost ?? 0);
  const remaining = Math.max(0, MONTHLY_BUDGET_USD - spent);

  return {
    ok: spent < MONTHLY_BUDGET_USD,
    spent,
    remaining,
  };
}

// ─── Log usage after a successful API call ───────────────────────────────────
async function logUsage(
  studentId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const supabase = await createClient();
  const monthKey = getMonthKey();
  const cost = calculateCost(inputTokens, outputTokens);

  // Upsert: increment counters if row exists, create if not
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
        total_calls:    existing.total_calls + 1,
        input_tokens:   existing.input_tokens + inputTokens,
        output_tokens:  existing.output_tokens + outputTokens,
        estimated_cost: Number(existing.estimated_cost) + cost,
        updated_at:     new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("api_usage")
      .insert({
        student_id:     studentId,
        month_key:      monthKey,
        total_calls:    1,
        input_tokens:   inputTokens,
        output_tokens:  outputTokens,
        estimated_cost: cost,
      });
  }
}

// ─── The main function: budget-checked AI call ───────────────────────────────
// Use this instead of calling Anthropic directly.
// It checks the budget, makes the call, logs usage, and returns the response.
export async function callAI(
  studentId: string,
  params: {
    system?: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
  },
): Promise<{ text: string; inputTokens: number; outputTokens: number; cost: number }> {
  // 1. Check budget
  const budget = await checkBudget(studentId);
  if (!budget.ok) {
    throw new BudgetExceededError(budget.spent);
  }

  // 2. Make the API call
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: params.max_tokens ?? 1024,
    temperature: params.temperature ?? 0,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
  });

  // 3. Extract usage
  const inputTokens  = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cost = calculateCost(inputTokens, outputTokens);

  // 4. Log usage (non-blocking — don't let logging failures break the response)
  logUsage(studentId, inputTokens, outputTokens).catch((err) => {
    console.error("[budget] Failed to log usage:", err);
  });

  // 5. Return
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return { text, inputTokens, outputTokens, cost };
}

// ─── Convenience: get a student's current month usage summary ────────────────
export async function getUsageSummary(studentId: string) {
  const supabase = await createClient();
  const monthKey = getMonthKey();

  const { data } = await supabase
    .from("api_usage")
    .select("*")
    .eq("student_id", studentId)
    .eq("month_key", monthKey)
    .maybeSingle();

  return {
    monthKey,
    totalCalls:   data?.total_calls ?? 0,
    inputTokens:  data?.input_tokens ?? 0,
    outputTokens: data?.output_tokens ?? 0,
    estimatedCost: Number(data?.estimated_cost ?? 0),
    budget:        MONTHLY_BUDGET_USD,
    remaining:     Math.max(0, MONTHLY_BUDGET_USD - Number(data?.estimated_cost ?? 0)),
    percentUsed:   Math.min(100, (Number(data?.estimated_cost ?? 0) / MONTHLY_BUDGET_USD) * 100),
  };
}
