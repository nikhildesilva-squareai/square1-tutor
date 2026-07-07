-- Migration: Platform AI-spend helper for the global budget guardrail
-- Description: get_month_ai_spend(month) sums api_usage.estimated_cost in the
--   database so the platform-wide ceiling check in lib/ai/budget.ts callAI()
--   costs one cheap RPC per AI call. Applied 2026-07-07.

CREATE OR REPLACE FUNCTION public.get_month_ai_spend(p_month TEXT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(estimated_cost), 0)::numeric
  FROM api_usage
  WHERE month_key = p_month;
$$;

CREATE INDEX IF NOT EXISTS idx_api_usage_month_key ON api_usage(month_key);
