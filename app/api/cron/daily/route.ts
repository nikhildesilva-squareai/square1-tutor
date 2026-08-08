import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runStreakReminders, runWeeklyDigest, runActivationNudges, runInviteReminders, runManagerDigests, runLeadFollowups } from "@/lib/email/jobs";
import { checkAllIncompleteEnrollments } from "@/lib/enrollment-completion";
import { ingestNews } from "@/lib/newsroom-pipeline";
import { sweepMonth } from "@/lib/ai/budget";
import { runSeoHealth, recordSeoHealth } from "@/lib/seo-health";
import { sendSeoHealthAlert } from "@/lib/email/resend";

export const maxDuration = 60;

/**
 * GET /api/cron/daily — single daily lifecycle cron (07:00 UTC).
 *
 * Consolidates every daily job into one cron entry. Because they share one
 * invocation they also share ONE runtime budget, and that is the thing this
 * route is built around.
 *
 * WHY IT IS SHAPED LIKE THIS
 * The jobs used to run sequentially in declaration order, with the funnel
 * emails fifth — behind a live-HTTP SEO sweep and a full enrollment scan. When
 * the 60s ran out the function was killed mid-flight, so the activation nudge
 * simply never sent and NOTHING was logged: the per-job try/catch catches
 * errors, but a platform timeout is not an error it can see. Silent loss of the
 * one email that gets a stalled signup to their first lesson.
 *
 * Three rules now hold:
 *  1. ORDER BY WHAT IT COSTS TO LOSE. The funnel emails run first, together.
 *     Housekeeping, then detect-only monitoring, then the newsroom drafts run
 *     on whatever is left. Losing a day of newsroom drafts costs nothing;
 *     losing a day of activation nudges costs students.
 *  2. NOTHING IS SILENT. Every job is capped, timed, and recorded. A job that
 *     is skipped for lack of budget says so in the response and the log, so a
 *     starved tail shows up as `skipped` rather than as an absence.
 *  3. THE RESPONSE ALWAYS RETURNS. The work is kept inside a budget below
 *     maxDuration so the handler serialises its own result instead of being
 *     killed — the log is the only evidence this ran at all.
 *
 * Note the cap is wall-clock, not cancellation: a job that blows its cap is
 * abandoned, not aborted, and may still finish in the background. That is fine
 * for these (idempotent, one-send-per-row guards) and is the trade that keeps
 * one slow dependency from starving everything after it.
 *
 * Protected by CRON_SECRET. Vercel cron sends it automatically as a Bearer
 * header when the env var is set on the project.
 */

/** Wall-clock budget for the work, leaving headroom to serialise the response. */
const TOTAL_BUDGET_MS = 52_000;

/** Per-job caps. A job may not exceed its cap or the remaining budget. */
const CAP = {
  activationNudges: 15_000,
  leadFollowups: 15_000,
  streakReminders: 15_000,
  inviteReminders: 10_000,
  weeklyDigest: 15_000,
  managerDigests: 15_000,
  enrollmentCompletion: 12_000,
  walletSweep: 10_000,
  seoHealth: 12_000,
} as const;

/** Newsroom is last and takes what is left; below this it is not worth starting. */
const NEWSROOM_MIN_MS = 8_000;

export async function GET(request: Request) {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const remaining = () => TOTAL_BUDGET_MS - (Date.now() - startedAt);

  const now = new Date();
  const isSunday = now.getUTCDay() === 0;
  const isMonday = now.getUTCDay() === 1;
  const isFirstOfMonth = now.getUTCDate() === 1;

  const results: Record<string, unknown> = {};
  const skipped: string[] = [];

  /**
   * Run one job under the smaller of its own cap and the budget left.
   * Records the outcome either way — including "skipped", which is the whole
   * point: a starved job must be visible, not absent.
   */
  async function job<T>(name: string, capMs: number, fn: () => Promise<T>): Promise<void> {
    const left = remaining();
    if (left <= 0) {
      skipped.push(name);
      results[name] = { skipped: "no runtime budget left" };
      return;
    }
    const cap = Math.min(capMs, left);
    const t0 = Date.now();
    try {
      const value = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`exceeded ${cap}ms cap`)), cap)),
      ]);
      results[name] = { ...(value as object), ms: Date.now() - t0 };
    } catch (err) {
      results[name] = {
        error: err instanceof Error ? err.message : "failed",
        ms: Date.now() - t0,
      };
    }
  }

  // ── 1. Funnel-critical email, first and in parallel ──────────────────────
  // These four are independent of each other and of everything below, so they
  // run together rather than queueing behind one another. Each is internally
  // sequential, so this is at most four concurrent sends — well inside the
  // provider's limits at current volumes.
  //
  // activationNudges is the front-line "come start your first lesson" email for
  // signups stalled at 0 lessons, and leadFollowups the day-1 "your report is
  // waiting". Both are one-and-done per row: a missed day is a permanently lost
  // send, not a delayed one. That is why they lead.
  await Promise.all([
    job("activationNudges", CAP.activationNudges, runActivationNudges),
    job("leadFollowups", CAP.leadFollowups, runLeadFollowups),
    job("streakReminders", CAP.streakReminders, runStreakReminders),
    job("inviteReminders", CAP.inviteReminders, runInviteReminders),
  ]);

  // ── 2. Day-specific digests ──────────────────────────────────────────────
  if (isSunday) await job("weeklyDigest", CAP.weeklyDigest, runWeeklyDigest);
  if (isMonday) await job("managerDigests", CAP.managerDigests, runManagerDigests);

  // ── 3. Housekeeping ──────────────────────────────────────────────────────
  // Fallback for the on-demand completion triggers; a day's delay is harmless
  // because the on-demand path catches almost everything first.
  await job("enrollmentCompletion", CAP.enrollmentCompletion, async () => ({
    completedCount: await checkAllIncompleteEnrollments(createAdminClient()),
  }));

  // Monthly wallet sweep (1st of the month). Sweeps the PREVIOUS month, so the
  // hour it fires is immaterial. /api/cron/sweep-wallets remains for manual runs.
  if (isFirstOfMonth) {
    await job("walletSweep", CAP.walletSweep, async () => {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
      const { swept, count } = await sweepMonth(monthKey);
      return { monthKey, walletsSwept: count, totalRecovered: swept };
    });
  }

  // ── 4. Detect-only monitoring ────────────────────────────────────────────
  // Checks the live site over HTTP, not the repo. Nothing here edits the site,
  // and it emails only on NEW breakage, so a quiet inbox means healthy rather
  // than ignored. Demoted below the email jobs: a missed day of monitoring is
  // recoverable tomorrow, a missed one-and-done send is not.
  await job("seoHealth", CAP.seoHealth, async () => {
    const health = await runSeoHealth();
    let alerted = false;
    if (health.regressions.length > 0) {
      try {
        await sendSeoHealthAlert({
          regressions: health.regressions,
          failures: health.failures,
          metrics: health.metrics,
        });
        alerted = true;
      } catch (err) {
        console.error("[cron/daily] seo alert send failed:", err);
      }
    }
    await recordSeoHealth(health, alerted);
    return {
      ok: health.ok,
      failures: health.failures,
      regressions: health.regressions,
      metrics: health.metrics,
      alerted,
    };
  });

  // ── 5. Newsroom drafts — last, on whatever is left ───────────────────────
  // Drafts only; nothing publishes without a human click on the desk. It is the
  // heaviest job and the cheapest to lose, so it takes the remainder rather than
  // a reserved slice, and is skipped outright when there is not enough left to
  // draft anything useful.
  const newsroomBudget = remaining() - 2_000;
  if (newsroomBudget >= NEWSROOM_MIN_MS) {
    await job("newsroom", newsroomBudget, () => ingestNews(newsroomBudget));
  } else {
    skipped.push("newsroom");
    results.newsroom = { skipped: `only ${Math.max(0, newsroomBudget)}ms left` };
  }

  const elapsedMs = Date.now() - startedAt;
  const summary = { ok: true, isSunday, isMonday, elapsedMs, skipped, results };

  // Single structured line: per-job timings plus anything starved. If `skipped`
  // is ever non-empty the budget needs re-cutting — that is the signal.
  console.log("[cron/daily]", JSON.stringify(summary));
  if (skipped.length > 0) {
    console.warn("[cron/daily] starved of runtime budget:", skipped.join(", "));
  }

  return NextResponse.json(summary);
}
