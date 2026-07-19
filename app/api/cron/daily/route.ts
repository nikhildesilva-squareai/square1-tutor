import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runStreakReminders, runWeeklyDigest, runActivationNudges, runInviteReminders, runManagerDigests } from "@/lib/email/jobs";
import { checkAllIncompleteEnrollments } from "@/lib/enrollment-completion";

export const maxDuration = 60;

/**
 * GET /api/cron/daily — single daily lifecycle cron (07:00 UTC).
 *
 * Consolidates all daily jobs into one cron entry (Vercel Hobby allows few):
 *  - enrollment completion  → every day, marks any enrollments that now meet
 *                              completion criteria (lessons + projects + assessment)
 *  - streak reminders       → every day, students with an active enrollment who
 *                              haven't studied today
 *  - activation nudges      → every day, signups >24h old with 0 lessons done —
 *                              "come start your first lesson" (once ever)
 *  - weekly digest          → Sundays only
 *
 * Protected by CRON_SECRET. Vercel cron sends it automatically as a Bearer
 * header when the env var is set on the project.
 */
export async function GET(request: Request) {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSunday = new Date().getUTCDay() === 0;
  const isMonday = new Date().getUTCDay() === 1;
  const results: Record<string, unknown> = {};

  // ── Check incomplete enrollments for completion (fallback for on-demand triggers) ──
  try {
    const admin = createAdminClient();
    const completedCount = await checkAllIncompleteEnrollments(admin);
    results.enrollmentCompletion = { completedCount };
  } catch (err) {
    results.enrollmentCompletion = { error: err instanceof Error ? err.message : "failed" };
  }

  try {
    results.streakReminders = await runStreakReminders();
  } catch (err) {
    results.streakReminders = { error: err instanceof Error ? err.message : "failed" };
  }

  // Activation nudge — the front-line "come start your first lesson" email for
  // signups stalled at 0 lessons. Replaces the old assessment-first nudge; it
  // also skips anyone already sent that one, so there's no double-send.
  try {
    results.activationNudges = await runActivationNudges();
  } catch (err) {
    results.activationNudges = { error: err instanceof Error ? err.message : "failed" };
  }

  // B2B: one reminder per team invite still pending after 3 days
  try {
    results.inviteReminders = await runInviteReminders();
  } catch (err) {
    results.inviteReminders = { error: err instanceof Error ? err.message : "failed" };
  }

  if (isSunday) {
    try {
      results.weeklyDigest = await runWeeklyDigest();
    } catch (err) {
      results.weeklyDigest = { error: err instanceof Error ? err.message : "failed" };
    }
  }

  // B2B: manager digest lands Monday (start-of-week planning read)
  if (isMonday) {
    try {
      results.managerDigests = await runManagerDigests();
    } catch (err) {
      results.managerDigests = { error: err instanceof Error ? err.message : "failed" };
    }
  }

  console.log("[cron/daily]", JSON.stringify(results));
  return NextResponse.json({ ok: true, isSunday, isMonday, results });
}
