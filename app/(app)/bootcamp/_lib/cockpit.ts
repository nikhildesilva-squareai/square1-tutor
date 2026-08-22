// ═══════════════════════════════════════════════════════════════════════════════
// The one server-side loader behind every S4 surface (/bootcamp/home,
// /bootcamp/standing, /bootcamp/contract).
//
// It lives here rather than in lib/bootcamp/ on purpose: everything in
// lib/bootcamp/ is import-free so `node --test` can run it without a bundler.
// This file talks to Supabase, so it would break that rule. It therefore holds
// NO domain logic of its own — it fetches rows and hands them to the pure
// functions in @/lib/bootcamp and @/lib/schedule. If a calculation appears
// below, it is in the wrong file.
//
// `_lib` is a private folder: Next.js excludes underscore-prefixed folders from
// routing, so nothing here is reachable as a URL.
//
// Reads are STUDENT-FACING and go through @/lib/supabase/server, so RLS
// (migration 021) scopes them to the caller's own rows. The one exception is
// squad membership — see loadSquad().
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deriveGateStatuses,
  evaluateGate,
  weightedAttendancePct,
  resolveViewerTimeZone,
  modulesUnlockedBy,
  remediationSteps,
  type GateStatus,
  type GateCheck,
  type RemediationStep,
  type AttendanceStatus,
} from "@/lib/bootcamp";
import {
  loadGateSpine,
  loadGateEvidence,
  checkGateEligibility,
} from "@/lib/bootcamp-gate-service";
import { weekDueDate } from "@/lib/schedule";
import type {
  Bootcamp,
  BootcampCohort,
  BootcampEnrollment,
  BootcampSquad,
} from "@/types/database";

/** Minutes before `starts_at` that the personal join link appears. */
export const JOIN_WINDOW_MIN = 10;

// ─── Enrolment context ───────────────────────────────────────────────────────

export interface EnrolmentContext {
  studentId: string;
  enrolment: BootcampEnrollment;
  cohort: BootcampCohort;
  bootcamp: Bootcamp;
  /** Cohort start as an instant, the anchor every deadline is measured from. */
  cohortStart: Date;
  /** The zone the student's own clock is in — never the cohort band's. */
  viewerTimeZone: string;
}

/** Which enrolment to show when a student has been in more than one cohort.
 *  Lower sorts first. */
const STATUS_RANK: Record<string, number> = {
  active: 0, suspended: 1, deferred: 2, graduated: 3, withdrawn: 4,
};

/**
 * The viewer's bootcamp enrolment, with its cohort and bootcamp, in one query.
 *
 * Returns null when the viewer has no enrolment at all — callers redirect to the
 * public /bootcamp page rather than 404, because a null here is the normal state
 * of someone who is mid-application.
 */
export async function loadEnrolmentContext(): Promise<EnrolmentContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: studentRow } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!studentRow) return null;
  const studentId = (studentRow as { id: string }).id;

  // The FK is NAMED, and it has to be. bootcamp_enrollments points at
  // bootcamp_cohorts twice — `cohort_id` and `deferred_to_cohort_id` (migration
  // 021) — so the bare embed `cohort:bootcamp_cohorts(...)` is ambiguous and
  // PostgREST refuses it outright with PGRST201, returning NO ROWS. Every
  // enrolled student was therefore treated as having no enrolment and bounced to
  // the public /bootcamp page from all four cockpit routes.
  const { data: rows, error } = await supabase
    .from("bootcamp_enrollments")
    .select(
      "*, cohort:bootcamp_cohorts!bootcamp_enrollments_cohort_id_fkey(*, bootcamp:bootcamps(*))",
    )
    .eq("student_id", studentId);

  // A read error here is indistinguishable from "not enrolled" at the call site,
  // and the call site's response to "not enrolled" is to redirect away. Log it,
  // or the next schema-shaped failure is silent again.
  if (error) console.error("[bootcamp/cockpit] enrolment load failed:", error);

  const enrolments = (rows ?? []) as unknown as (BootcampEnrollment & {
    cohort: (BootcampCohort & { bootcamp: Bootcamp | null }) | null;
  })[];
  if (enrolments.length === 0) return null;

  const chosen = [...enrolments].sort((a, b) => {
    const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (r !== 0) return r;
    return b.created_at.localeCompare(a.created_at);
  })[0];

  // A null embed means the cohort is still a draft (RLS hides those from
  // students). Nobody should be enrolled in one; treat it as "no enrolment"
  // rather than render a page with holes in it.
  const cohort = chosen.cohort;
  if (!cohort || !cohort.bootcamp) return null;

  const { bootcamp, ...cohortOnly } = cohort;

  return {
    studentId,
    enrolment: chosen,
    cohort: cohortOnly as BootcampCohort,
    bootcamp,
    // Midday UTC, not midnight: a date-only column parsed as UTC midnight can
    // land on the previous calendar day west of Greenwich.
    cohortStart: new Date(cohort.starts_on + "T12:00:00Z"),
    viewerTimeZone: resolveViewerTimeZone(chosen.timezone, cohort.timezone),
  };
}

// ─── Next live session ───────────────────────────────────────────────────────

export interface NextSession {
  id: string;
  week: number;
  kind: string;
  title: string;
  startsAt: Date;
  durationMin: number;
  /** THE STUDENT'S OWN link, from bootcamp_session_registrants. Null until Zoom
   *  registration has run — and null is rendered as "your link will appear
   *  before the session", never as a shared fallback. */
  joinUrl: string | null;
  /** True inside [starts_at − 10 min, starts_at + duration]. */
  joinOpen: boolean;
  /** The session has already started and has not finished. */
  live: boolean;
}

/**
 * The next session that has not started yet, plus this student's personal link.
 *
 * `zoom_join_url` (the shared meeting link) and `zoom_start_url` (the host key)
 * are never selected here. One shared link makes attendance unattributable,
 * which collapses the gate model — see migration 021 and PRD S5.
 */
export async function loadNextSession(
  ctx: EnrolmentContext,
  now: Date = new Date(),
): Promise<NextSession | null> {
  const supabase = await createClient();

  // Look back by the longest session a row is allowed to be (the duration CHECK
  // in migration 021 caps it at 480 minutes) so a class that is ALREADY RUNNING
  // is still the "next" session. Filtering on `starts_at > now()` alone would
  // drop the live class the moment it began, and take the student's join link
  // with it — exactly when they most need it.
  const MAX_SESSION_MIN = 480;
  const { data } = await supabase
    .from("bootcamp_sessions")
    .select("id, week, kind, title, starts_at, duration_min, status")
    .eq("cohort_id", ctx.cohort.id)
    .in("status", ["scheduled", "live"])
    .gt("starts_at", new Date(now.getTime() - MAX_SESSION_MIN * 60_000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  const candidates = (data ?? []) as {
    id: string; week: number; kind: string; title: string;
    starts_at: string; duration_min: number;
  }[];
  // The first session that has not finished: the one in progress if there is
  // one, otherwise the next one due.
  const session = candidates.find(
    (s) => new Date(s.starts_at).getTime() + s.duration_min * 60_000 >= now.getTime(),
  );
  if (!session) return null;

  const { data: registrant } = await supabase
    .from("bootcamp_session_registrants")
    .select("join_url")
    .eq("session_id", session.id)
    .eq("bootcamp_enrollment_id", ctx.enrolment.id)
    .maybeSingle();

  const startsAt = new Date(session.starts_at);
  const opensAt = startsAt.getTime() - JOIN_WINDOW_MIN * 60_000;
  const closesAt = startsAt.getTime() + session.duration_min * 60_000;

  return {
    id: session.id,
    week: session.week,
    kind: session.kind,
    title: session.title,
    startsAt,
    durationMin: session.duration_min,
    joinUrl: (registrant as { join_url: string } | null)?.join_url ?? null,
    joinOpen: now.getTime() >= opensAt && now.getTime() <= closesAt,
    live: now.getTime() >= startsAt.getTime() && now.getTime() <= closesAt,
  };
}

// ─── Gates ───────────────────────────────────────────────────────────────────

export interface GateRow {
  id: string;
  orderIndex: number;
  week: number;
  title: string;
  status: GateStatus;
  /** End of the gate's week, measured from the cohort start. */
  dueAt: Date;
  decidedAt: Date | null;
}

/**
 * The gate rail: every gate for this bootcamp with the status the student is
 * actually in.
 *
 * `bootcamp_gates.requires` is deliberately not selected — the thresholds are
 * effectively answer keys and carry no grant to `authenticated` (migration 021).
 * Statuses come from deriveGateStatuses so the strictly-linear unlock rule has
 * exactly one implementation.
 */
export async function loadGates(ctx: EnrolmentContext): Promise<GateRow[]> {
  const supabase = await createClient();

  const [{ data: gateRows }, { data: resultRows }] = await Promise.all([
    supabase
      .from("bootcamp_gates")
      .select("id, order_index, week, title")
      .eq("bootcamp_id", ctx.bootcamp.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("bootcamp_gate_results")
      .select("gate_id, status, decided_at")
      .eq("bootcamp_enrollment_id", ctx.enrolment.id),
  ]);

  const gates = (gateRows ?? []) as {
    id: string; order_index: number; week: number; title: string;
  }[];
  const results = (resultRows ?? []) as {
    gate_id: string; status: GateStatus; decided_at: string | null;
  }[];

  const byGate = new Map(results.map((r) => [r.gate_id, r]));
  const statuses = deriveGateStatuses(
    gates.map((g) => g.id),
    Object.fromEntries(results.map((r) => [r.gate_id, r.status])),
  );

  return gates.map((g) => {
    const decided = byGate.get(g.id)?.decided_at ?? null;
    return {
      id: g.id,
      orderIndex: g.order_index,
      week: g.week,
      title: g.title,
      status: statuses[g.id] ?? "locked",
      dueAt: weekDueDate(ctx.cohortStart, g.week),
      decidedAt: decided ? new Date(decided) : null,
    };
  });
}

/** The gate the student is working towards: the first not already cleared. */
export function nextOpenGate(gates: GateRow[]): GateRow | null {
  return gates.find((g) => g.status !== "passed" && g.status !== "waived") ?? null;
}

// ─── Standing inputs ─────────────────────────────────────────────────────────

export interface StandingSignals {
  attendancePct: number;
  daysSinceLastActivity: number;
  missedOneToOnes: number;
  sessionsCounted: number;
}

/**
 * The three observed signals computeStanding needs. Every one is measured from
 * something the student cannot write: webhook attendance, lesson completions.
 */
export async function loadStandingSignals(
  ctx: EnrolmentContext,
  now: Date = new Date(),
): Promise<StandingSignals> {
  const supabase = await createClient();

  const [{ data: attendanceRows }, { data: sessionRows }, { data: lastCompletion }] =
    await Promise.all([
      supabase
        .from("bootcamp_attendance")
        .select("session_id, status")
        .eq("bootcamp_enrollment_id", ctx.enrolment.id),
      supabase
        .from("bootcamp_sessions")
        .select("id, kind")
        .eq("cohort_id", ctx.cohort.id),
      supabase
        .from("lesson_completions")
        .select("completed_at")
        .eq("student_id", ctx.studentId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const attendance = (attendanceRows ?? []) as {
    session_id: string; status: AttendanceStatus;
  }[];
  const kindBySession = new Map(
    ((sessionRows ?? []) as { id: string; kind: string }[]).map((s) => [s.id, s.kind]),
  );

  const missedOneToOnes = attendance.filter(
    (a) => kindBySession.get(a.session_id) === "one_to_one" && a.status === "absent",
  ).length;

  const lastAt = (lastCompletion as { completed_at: string } | null)?.completed_at;
  const since = lastAt ? new Date(lastAt) : ctx.cohortStart;
  const daysSinceLastActivity = Math.max(
    0,
    Math.floor((now.getTime() - since.getTime()) / 86_400_000),
  );

  return {
    attendancePct: weightedAttendancePct(attendance),
    daysSinceLastActivity,
    missedOneToOnes,
    sessionsCounted: attendance.length,
  };
}

// ─── Squad ───────────────────────────────────────────────────────────────────

export interface SquadMate {
  name: string;
  isViewer: boolean;
}

export interface SquadCard {
  squad: BootcampSquad;
  mates: SquadMate[];
}

/**
 * The student's squad and who is in it (ST-11 — know who to talk to on day one).
 *
 * The squad row itself is readable under RLS by any member of the cohort. The
 * MEMBER LIST is not: bootcamp_enrollments is scoped to your own row, correctly,
 * so the roster needs the service role. It is narrowed to the viewer's own
 * squad_id and returns names only — no status, no standing, no payment.
 */
export async function loadSquad(ctx: EnrolmentContext): Promise<SquadCard | null> {
  if (!ctx.enrolment.squad_id) return null;

  const supabase = await createClient();
  const { data: squadRow } = await supabase
    .from("bootcamp_squads")
    .select("*")
    .eq("id", ctx.enrolment.squad_id)
    .maybeSingle();
  if (!squadRow) return null;

  let mates: SquadMate[] = [];
  try {
    const admin = createAdminClient();
    const { data: memberRows } = await admin
      .from("bootcamp_enrollments")
      .select("student_id, student:students(name)")
      .eq("squad_id", ctx.enrolment.squad_id)
      .in("status", ["active", "suspended"]);

    mates = ((memberRows ?? []) as unknown as {
      student_id: string; student: { name: string | null } | null;
    }[]).map((m) => ({
      name: m.student_id === ctx.studentId ? "You" : (m.student?.name ?? "Squad member"),
      isViewer: m.student_id === ctx.studentId,
    }));
  } catch {
    // A missing service-role key must not take the whole cockpit down.
    mates = [];
  }

  return { squad: squadRow as BootcampSquad, mates };
}

// ─── One gate, in detail (S7) ────────────────────────────────────────────────

export interface GateProject {
  id: string;
  title: string;
  /** Public rubric — the same criteria the project page already shows. */
  rubric: { criterion: string; weight?: number; description?: string }[];
  /** Public instructions for the objective check; null when there is none. */
  submitFormat: string | null;
  /** True when the objective gate is CI-based, so there is no output to paste. */
  ciMode: boolean;
  starterRepoUrl: string | null;
  /** The student's latest submission for this project, if any. */
  submissionId: string | null;
  scorePct: number | null;
}

export interface ThreadMessage {
  id: string;
  authorKind: "ai" | "instructor" | "student";
  bodyMd: string;
  createdAt: Date;
}

export interface GateDetail {
  id: string;
  orderIndex: number;
  week: number;
  title: string;
  summaryMd: string;
  status: GateStatus;
  dueAt: Date;
  /** How many modules clearing this gate opens. 0 when it gates no modules. */
  unlocksModules: number;
  attempts: number;
  attemptsRemaining: number;
  canSubmitNow: boolean;
  blockedReason: string | null;
  resubmitDeadline: Date | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  /** The reviewer's written reasons. The whole point of a fail (ST-34). */
  reviewerNotesMd: string | null;
  rubricPct: number | null;
  objectivePassed: boolean | null;
  ciPassed: boolean | null;
  /** Per-requirement checks. Thresholds never appear — see gates.ts. */
  checks: GateCheck[];
  unmet: string[];
  autoEligible: boolean;
  /** Requirements this codebase cannot measure yet, named honestly. */
  unmeasurable: string[];
  remediation: RemediationStep[];
  projects: GateProject[];
  thread: ThreadMessage[];
  submissionId: string | null;
}

/**
 * Everything /bootcamp/gates/[gateId] renders, for the viewer's own enrolment.
 *
 * Reads split deliberately between two clients:
 *   • SERVICE ROLE for the gate spine, because `bootcamp_gates.requires` holds
 *     the thresholds and carries no grant to `authenticated`. The numbers are
 *     used to compute met/unmet here on the server and are never returned.
 *   • The STUDENT's client for the feedback thread, so RLS policy
 *     s1_owns_submission is the thing that decides they may read it. Fetching
 *     the thread with the service role would work and would prove nothing.
 *
 * Returns null when the gate belongs to another bootcamp — the caller 404s.
 */
export async function loadGateDetail(
  ctx: EnrolmentContext,
  gateId: string,
  now: Date = new Date(),
): Promise<GateDetail | null> {
  const admin = createAdminClient();
  const spine = await loadGateSpine(admin, ctx.bootcamp.id, ctx.enrolment.id);
  const gate = spine.gates.find((g) => g.id === gateId);
  if (!gate) return null;

  const result = spine.results.get(gate.id) ?? null;
  const status = spine.statuses[gate.id] ?? "locked";

  const [{ evidence, gaps }, projects] = await Promise.all([
    loadGateEvidence(admin, {
      studentId: ctx.studentId,
      enrolmentId: ctx.enrolment.id,
      courseId: ctx.bootcamp.course_id,
      gate,
      spine,
    }),
    loadGateProjects(admin, ctx.studentId, gate.requires.project_ids ?? []),
  ]);

  const evaluation = evaluateGate(gate.requires, evidence);
  const eligibility = checkGateEligibility(spine, gate.id, now);

  // The thread hangs off the SUBMISSION, so it only exists once something has
  // been submitted. Prefer the submission the gate result points at; fall back
  // to the gate project's own submission so a student who submitted before the
  // gate was bound still sees their history.
  const submissionId =
    result?.submission_id ?? projects.find((p) => p.submissionId)?.submissionId ?? null;

  return {
    id: gate.id,
    orderIndex: gate.order_index,
    week: gate.week,
    title: gate.title,
    summaryMd: gate.summary_md,
    status,
    dueAt: weekDueDate(ctx.cohortStart, gate.week),
    unlocksModules: modulesUnlockedBy({
      id: gate.id,
      title: gate.title,
      cleared: status === "passed" || status === "waived",
      moduleIds: gate.unlocks_module_ids ?? [],
    }),
    attempts: result?.attempts ?? 0,
    attemptsRemaining: eligibility.attemptsRemaining,
    canSubmitNow: eligibility.allowed,
    blockedReason: eligibility.reason ?? null,
    resubmitDeadline: eligibility.deadline ?? null,
    submittedAt: result?.submitted_at ? new Date(result.submitted_at) : null,
    decidedAt: result?.decided_at ? new Date(result.decided_at) : null,
    reviewerNotesMd: result?.reviewer_notes_md ?? null,
    rubricPct:
      result?.rubric_pct !== null && result?.rubric_pct !== undefined
        ? Number(result.rubric_pct)
        : null,
    objectivePassed: result?.objective_passed ?? null,
    ciPassed: result?.ci_passed ?? null,
    checks: evaluation.checks,
    unmet: evaluation.unmet,
    autoEligible: evaluation.autoEligible,
    unmeasurable: gaps.unmeasurable,
    remediation: remediationSteps(evaluation.unmet),
    projects,
    thread: submissionId ? await loadThread(submissionId) : [],
    submissionId,
  };
}

/** The gate's projects, with the viewer's latest submission on each. */
async function loadGateProjects(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string,
  projectIds: string[],
): Promise<GateProject[]> {
  if (projectIds.length === 0) return [];

  const [{ data: projectRows }, { data: submissionRows }] = await Promise.all([
    admin
      .from("projects")
      .select("id, title, order_index, rubric, grading, starter_repo_url")
      .in("id", projectIds)
      .order("order_index", { ascending: true }),
    admin
      .from("project_submissions")
      .select("id, project_id, score, max_score")
      .eq("student_id", studentId)
      .in("project_id", projectIds),
  ]);

  const submissions = new Map(
    ((submissionRows ?? []) as {
      id: string; project_id: string; score: number | null; max_score: number;
    }[]).map((s) => [s.project_id, s]),
  );

  return ((projectRows ?? []) as {
    id: string; title: string;
    rubric: { criterion: string; weight?: number; description?: string }[] | null;
    grading: { submit_format?: string; metric?: string } | null;
    starter_repo_url: string | null;
  }[]).map((p) => {
    const sub = submissions.get(p.id) ?? null;
    return {
      id: p.id,
      title: p.title,
      rubric: Array.isArray(p.rubric) ? p.rubric : [],
      // `submit_format` is the PUBLIC instruction ("paste your findings table").
      // The answer key it is checked against lives in grading.expected and is
      // never selected here.
      submitFormat: p.grading?.submit_format ?? null,
      ciMode: p.grading?.metric === "ci_actions",
      starterRepoUrl: p.starter_repo_url ?? null,
      submissionId: sub?.id ?? null,
      scorePct:
        sub && sub.score !== null && sub.max_score > 0
          ? (sub.score / sub.max_score) * 100
          : null,
    };
  });
}

/**
 * The private feedback thread for one submission.
 *
 * Read as the STUDENT on purpose: submission_comments' policy is
 * `s1_owns_submission(submission_id)`, so a student who somehow reached another
 * student's submission id gets an empty list from Postgres rather than a leak
 * this code would have to remember to prevent.
 */
export async function loadThread(submissionId: string): Promise<ThreadMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submission_comments")
    .select("id, author_kind, body_md, created_at")
    .eq("submission_id", submissionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return ((data ?? []) as {
    id: string; author_kind: "ai" | "instructor" | "student";
    body_md: string; created_at: string;
  }[]).map((c) => ({
    id: c.id,
    authorKind: c.author_kind,
    bodyMd: c.body_md,
    createdAt: new Date(c.created_at),
  }));
}
