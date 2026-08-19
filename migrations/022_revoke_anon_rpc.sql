-- Migration: Revoke anon EXECUTE on state-changing and business-data RPCs
-- Description: Closes four functions that PostgREST exposes at /rest/v1/rpc/ to
--              unauthenticated callers. Surfaced by the Supabase linter
--              (0028_anon_security_definer_function_executable) while verifying
--              021_create_bootcamp_spine.sql.
-- Created: 2026-08-19
--
-- WHY THIS EXISTS. Postgres grants EXECUTE to PUBLIC on every new function by
-- default, and PUBLIC includes anon. A SECURITY DEFINER function therefore runs
-- with the owner's privileges for a caller who never signed in. Nothing here is
-- a data breach; two of them are cheap denial-of-resource:
--
--   • claim_free_trial_seat  — burns seats from the 100-seat free-trial pool.
--     An unauthenticated loop empties the funnel.
--   • log_ai_usage           — writes spend rows. Inflating them trips
--     PLATFORM_AI_BUDGET_USD, which degrades or hard-stops AI for paying
--     students (see lib/ai/budget.ts).
--
-- CALLER AUDIT — done before revoking, because a careless REVOKE breaks signup:
--
--   claim_free_trial_seat  app/api/free-access/enroll/route.ts:82 via admin.rpc()
--                          -> SERVICE ROLE, which bypasses grants entirely.
--                          Safe to revoke from anon AND authenticated.
--   log_ai_usage           lib/ai/budget.ts:258 via createClient() (session role)
--   get_month_ai_spend     lib/ai/budget.ts:70  via createClient() (session role)
--                          -> both need `authenticated`. Every route that calls
--                          callAI() checks getUser() first, so no legitimate
--                          anon caller exists. Revoke anon only.
--   dashboard_acquisition  no caller in this repo. `authenticated` is left in
--                          place because the separate square1-dashboard app may
--                          read it; revoking anon costs nothing either way.
--
-- DELIBERATELY NOT TOUCHED:
--   current_student_id, s1_student_id, current_community_profile_id — return
--     NULL without a session. Harmless.
--   is_community_member / _creator / _moderator, is_public_community,
--     s1_is_venture_member — membership predicates, false without a session.
--   search_curriculum, match_content — anon access may be intentional for public
--     search. Breaking a public surface to close a non-issue is a bad trade;
--     confirm the product intent before changing these.
--
-- RESIDUAL RISK NOT FIXED HERE (needs code, not grants):
--   log_ai_usage stays callable by any signed-in student, who could write spend
--   rows for an arbitrary p_student. The fix is to move the call in
--   lib/ai/budget.ts from createClient() to createAdminClient() and revoke
--   `authenticated` too. That is an application change with its own testing, so
--   it is not bundled into a grants-only migration.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).
-- Idempotent: REVOKE on an already-revoked privilege is a no-op.

-- ─────────────────────────────────────────────────────────────────────────────
-- Service-role only — no client role has any business calling this
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.claim_free_trial_seat(uuid, integer, text, text)
  FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Signed-in callers only — the app calls these with the user's session
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.log_ai_usage(uuid, text, integer, integer, numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_ai_usage(uuid, text, integer, integer, numeric)
  TO authenticated;

REVOKE ALL ON FUNCTION public.get_month_ai_spend(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_month_ai_spend(text) TO authenticated;

REVOKE ALL ON FUNCTION public.dashboard_acquisition() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_acquisition() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON FUNCTION public.claim_free_trial_seat(uuid, integer, text, text) IS
  'Service role only (022). Called from app/api/free-access/enroll via admin.rpc(). Anon EXECUTE let an unauthenticated caller drain the free-trial seat pool.';

COMMENT ON FUNCTION public.log_ai_usage(uuid, text, integer, integer, numeric) IS
  'Signed-in only (022). Writes AI spend, which feeds PLATFORM_AI_BUDGET_USD. Residual: any signed-in student may still write for an arbitrary p_student — fix by moving lib/ai/budget.ts to the admin client.';

COMMENT ON FUNCTION public.get_month_ai_spend(text) IS
  'Signed-in only (022). Returns total platform AI spend for a month — business data, not per-student data.';
