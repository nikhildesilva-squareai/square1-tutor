import { createAdminClient } from "@/lib/supabase/admin";
import { computeStreak } from "@/lib/streaks";
import { getOrgStats } from "@/lib/org-stats";
import {
  sendStreakReminder,
  sendWeeklyDigest,
  sendAssessmentNudge,
  sendInviteReminder,
  sendManagerDigest,
} from "@/lib/email/resend";

/**
 * Lifecycle email jobs, run by /api/cron/daily.
 *
 * These MUST use the service-role client: cron requests carry no user session,
 * so the cookie-based client returns zero rows under RLS and the jobs silently
 * send nothing (the bug that left these emails dark).
 *
 * Every job: respects students.email_opt_out, dedupes via email_log, and caps
 * batch size to stay inside Resend rate limits and serverless time budgets.
 */

const BATCH_CAP = 200;

export interface JobResult {
  sent: number;
  skipped: number;
  errors: string[];
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function logSend(supabase: AdminClient, studentId: string, emailType: string) {
  await supabase.from("email_log").insert({ student_id: studentId, email_type: emailType });
}

/** Student ids that already received `emailType` since `sinceIso`. */
async function recentlySent(
  supabase: AdminClient,
  emailType: string,
  sinceIso: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("email_log")
    .select("student_id")
    .eq("email_type", emailType)
    .gte("sent_at", sinceIso);
  return new Set((data ?? []).map((r) => r.student_id));
}

/* ─── Daily streak reminder ──────────────────────────────────────────────── */
export async function runStreakReminders(): Promise<JobResult> {
  const supabase = createAdminClient();
  const result: JobResult = { sent: 0, skipped: 0, errors: [] };

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`
      student_id,
      students!inner(id, name, email, email_opt_out),
      current_lesson:lessons!student_enrollments_current_lesson_id_fkey(title)
    `)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return result;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const studentIds = [...new Set(enrollments.map((e) => e.student_id as string))];

  const [{ data: todayCompletions }, alreadyEmailed] = await Promise.all([
    supabase
      .from("lesson_completions")
      .select("student_id")
      .in("student_id", studentIds)
      .gte("completed_at", todayStart.toISOString()),
    recentlySent(supabase, "streak_reminder", todayStart.toISOString()),
  ]);

  const alreadyStudied = new Set((todayCompletions ?? []).map((c) => c.student_id));
  const seen = new Set<string>();

  for (const enrollment of enrollments as unknown as Array<{
    student_id: string;
    students: { id: string; name: string | null; email: string; email_opt_out: boolean };
    current_lesson: { title: string } | null;
  }>) {
    if (result.sent >= BATCH_CAP) break;

    const sid = enrollment.student_id;
    if (seen.has(sid)) continue;
    seen.add(sid);

    const student = enrollment.students;
    if (!student?.email || student.email_opt_out || alreadyStudied.has(sid) || alreadyEmailed.has(sid)) {
      result.skipped++;
      continue;
    }

    const { data: completions } = await supabase
      .from("lesson_completions")
      .select("completed_at")
      .eq("student_id", sid)
      .order("completed_at", { ascending: false })
      .limit(60);

    const streak = computeStreak((completions ?? []).map((c) => c.completed_at as string));
    const name = student.name ?? student.email.split("@")[0];
    const lessonTitle = enrollment.current_lesson?.title ?? "Your next lesson";

    try {
      await sendStreakReminder(student.email, name, streak.current, lessonTitle);
      await logSend(supabase, sid, "streak_reminder");
      result.sent++;
    } catch (err) {
      result.errors.push(`${student.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return result;
}

/* ─── Weekly digest (Sundays) ────────────────────────────────────────────── */
export async function runWeeklyDigest(): Promise<JobResult> {
  const supabase = createAdminClient();
  const result: JobResult = { sent: 0, skipped: 0, errors: [] };

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("student_id, course:courses(total_lessons)")
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return result;

  const studentIds = [...new Set(enrollments.map((e) => e.student_id as string))];

  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: students }, alreadyEmailed] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, email, email_opt_out")
      .in("id", studentIds),
    recentlySent(supabase, "weekly_digest", sixDaysAgo),
  ]);

  if (!students) return result;

  for (const student of students) {
    if (result.sent >= BATCH_CAP) break;

    if (!student.email || student.email_opt_out || alreadyEmailed.has(student.id)) {
      result.skipped++;
      continue;
    }

    const [{ count: weekLessons }, { count: totalCompleted }, { count: projects }, { data: recentDays }] =
      await Promise.all([
        supabase
          .from("lesson_completions")
          .select("id", { count: "exact", head: true })
          .eq("student_id", student.id)
          .gte("completed_at", weekAgo),
        supabase
          .from("lesson_completions")
          .select("id", { count: "exact", head: true })
          .eq("student_id", student.id),
        supabase
          .from("project_submissions")
          .select("id", { count: "exact", head: true })
          .eq("student_id", student.id)
          .not("score", "is", null),
        supabase
          .from("lesson_completions")
          .select("completed_at")
          .eq("student_id", student.id)
          .order("completed_at", { ascending: false })
          .limit(60),
      ]);

    // Nothing to digest for students who have never completed a lesson —
    // the assessment nudge covers them instead.
    if (!totalCompleted) {
      result.skipped++;
      continue;
    }

    const totalLessons = (enrollments as unknown as Array<{
      student_id: string;
      course: { total_lessons: number } | null;
    }>)
      .filter((e) => e.student_id === student.id)
      .reduce((sum, e) => sum + (e.course?.total_lessons ?? 0), 0);

    const streak = computeStreak((recentDays ?? []).map((c) => c.completed_at as string));
    const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

    try {
      await sendWeeklyDigest(student.email, student.name ?? student.email.split("@")[0], {
        lessonsCompleted: weekLessons ?? 0,
        streak: streak.current,
        projectsDone: projects ?? 0,
        overallPct,
      });
      await logSend(supabase, student.id, "weekly_digest");
      result.sent++;
    } catch (err) {
      result.errors.push(`${student.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return result;
}

/* ─── Assessment nudge — signed up >24h ago, never enrolled ──────────────── */
export async function runAssessmentNudges(): Promise<JobResult> {
  const supabase = createAdminClient();
  const result: JobResult = { sent: 0, skipped: 0, errors: [] };

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // Don't email signups older than 14 days — avoids blasting the backlog the
  // first time this job runs, and stale signups need a different message anyway.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: students } = await supabase
    .from("students")
    .select("id, name, email, email_opt_out, created_at")
    .lt("created_at", dayAgo)
    .gt("created_at", fourteenDaysAgo);

  if (!students || students.length === 0) return result;

  const studentIds = students.map((s) => s.id);

  const [{ data: enrolled }, alreadyNudged] = await Promise.all([
    supabase
      .from("student_enrollments")
      .select("student_id")
      .in("student_id", studentIds),
    // One nudge per student, ever.
    recentlySent(supabase, "assessment_nudge", new Date(0).toISOString()),
  ]);

  const enrolledIds = new Set((enrolled ?? []).map((e) => e.student_id));

  for (const student of students) {
    if (result.sent >= BATCH_CAP) break;

    if (!student.email || student.email_opt_out || enrolledIds.has(student.id) || alreadyNudged.has(student.id)) {
      result.skipped++;
      continue;
    }

    try {
      await sendAssessmentNudge(student.email, student.name ?? student.email.split("@")[0]);
      await logSend(supabase, student.id, "assessment_nudge");
      result.sent++;
    } catch (err) {
      result.errors.push(`${student.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return result;
}

/* ─── B2B: invite reminder — one nudge per invite still pending after 3 days ── */
export async function runInviteReminders(): Promise<JobResult> {
  const supabase = createAdminClient();
  const result: JobResult = { sent: 0, skipped: 0, errors: [] };

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Pending invites, older than 3 days, never reminded. reminded_at (not
  // email_log) gates this job: invitees usually have no student row yet.
  const { data: invites } = await supabase
    .from("org_invites")
    .select("id, email, org:organizations(name, join_code)")
    .eq("status", "pending")
    .is("reminded_at", null)
    .lt("created_at", threeDaysAgo)
    .limit(BATCH_CAP);

  if (!invites || invites.length === 0) return result;

  for (const invite of invites as unknown as Array<{
    id: string;
    email: string;
    org: { name: string; join_code: string } | null;
  }>) {
    if (!invite.org || !invite.email) {
      result.skipped++;
      continue;
    }
    const inviteUrl = `https://square1-tutor.vercel.app/business/join?code=${invite.org.join_code}`;
    try {
      await sendInviteReminder(invite.email, invite.org.name, inviteUrl);
      await supabase.from("org_invites").update({ reminded_at: new Date().toISOString() }).eq("id", invite.id);
      result.sent++;
    } catch (err) {
      result.errors.push(`${invite.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return result;
}

/* ─── B2B: weekly manager digest (Mondays) ───────────────────────────────────
 * One email per org manager with the same rollup the dashboard shows. Skips
 * orgs with nothing to report (no members AND no pending invites). */
export async function runManagerDigests(): Promise<JobResult> {
  const supabase = createAdminClient();
  const result: JobResult = { sent: 0, skipped: 0, errors: [] };

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, join_code")
    .limit(50); // getOrgStats per org — cap to stay inside the cron time budget

  if (!orgs || orgs.length === 0) return result;

  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const alreadyEmailed = await recentlySent(supabase, "manager_digest", sixDaysAgo);

  for (const org of orgs) {
    if (result.sent >= BATCH_CAP) break;

    const { data: mgr } = await supabase
      .from("org_members")
      .select("student_id, students!inner(id, name, email, email_opt_out)")
      .eq("org_id", org.id)
      .eq("role", "manager")
      .maybeSingle();

    const manager = (mgr as unknown as {
      student_id: string;
      students: { id: string; name: string | null; email: string; email_opt_out: boolean };
    } | null)?.students;

    if (!manager?.email || manager.email_opt_out || alreadyEmailed.has(manager.id)) {
      result.skipped++;
      continue;
    }

    const stats = await getOrgStats(org.id);
    if (!stats || (stats.seatsUsed === 0 && stats.pendingCount === 0)) {
      result.skipped++;
      continue;
    }

    const inviteUrl = `https://square1-tutor.vercel.app/business/join?code=${org.join_code}`;
    try {
      await sendManagerDigest(manager.email, org.name, {
        seatsUsed: stats.seatsUsed,
        seats: stats.org.seats,
        pendingCount: stats.pendingCount,
        activeThisWeek: stats.activeThisWeek,
        avgCompletion: stats.avgCompletion,
        completedCount: stats.completedCount,
        deployedCount: stats.deployedCount,
        teamReadiness: stats.teamReadiness,
        topWeak: stats.topWeak,
      }, inviteUrl);
      await logSend(supabase, manager.id, "manager_digest");
      result.sent++;
    } catch (err) {
      result.errors.push(`${manager.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return result;
}
