// Instructor-desk data layer (S10).
//
// One loader for the roster, the at-risk call list, the health dashboard and the
// CSV export, so those four surfaces can never disagree about the same student.
// Everything here is service-role read; the caller has already checked the
// session (getUser + isAdminEmail) before it runs.
//
// The arithmetic lives in @/lib/bootcamp and @/lib/schedule — this file only
// fetches rows and hands them to those pure functions. If a number is computed
// twice in this codebase, one of the copies is wrong.
//
// HONESTY RULE (the load-bearing one): a metric with no rows behind it returns
// `null`, never 0. `0%` and "no data yet" look identical on a dashboard and mean
// opposite things — one is a crisis, the other is a Tuesday. Every `| null`
// below is that distinction made unignorable at the type level.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeStanding,
  standingLabel,
  weightedAttendancePct,
  type AttendanceStatus,
  type StandingResult,
} from "@/lib/bootcamp";
import { currentWeek, weekDueDate } from "@/lib/schedule";
import type { BootcampCohort, BootcampEnrollmentStatus } from "@/types/database";

const DAY_MS = 86_400_000;

/** Reviewer service level for a gate submission, in hours. */
export const REVIEW_SLA_HOURS = 72;

/** Above this, the gate is not filtering anybody — the bar is decorative. */
export const GATE_ONE_CEILING_PCT = 85;
/** Below this, admissions is letting in people the programme cannot serve. */
export const GATE_ONE_FLOOR_PCT = 40;

export const INTERVENTION_ACTION = "student.intervention_flagged";

export type CohortWithBootcamp = BootcampCohort & {
  bootcamp: { id: string; slug: string; title: string } | null;
};

export interface DeskGateResultRow {
  enrollmentId: string;
  gateId: string;
  gateTitle: string;
  gateOrder: number;
  gateWeek: number;
  status: string;
  attempts: number;
  rubricPct: number | null;
  autoScore: number | null;
  objectivePassed: boolean | null;
  ciPassed: boolean | null;
  submittedAt: string | null;
  decidedAt: string | null;
  /** submitted → decided, in hours. Null unless both timestamps exist. */
  turnaroundHours: number | null;
}

export interface DeskInterventionFlag {
  by: string;
  at: string;
  reason: string | null;
}

export interface DeskRosterRow {
  enrollmentId: string;
  studentId: string;
  name: string;
  email: string;
  status: BootcampEnrollmentStatus;
  /** Standing as stored by the nightly sweep — kept so a drift is visible. */
  storedStanding: string;
  /** Standing as computed right now from the same inputs the student sees. */
  standing: StandingResult;
  /** Null when the cohort has held no sessions — NOT 0, and NOT 100. */
  attendancePct: number | null;
  sessionsAttendable: number;
  currentGateTitle: string | null;
  currentGateStatus: string;
  currentGateDueAt: Date | null;
  lastActivityAt: string | null;
  /** Measured from enrolment when the student has never completed a lesson. */
  daysSinceLastActivity: number;
  hasActivity: boolean;
  missedOneToOnes: number;
  flag: DeskInterventionFlag | null;
}

export interface GateOneHealth {
  gateTitle: string | null;
  decided: number;
  firstAttemptPasses: number;
  /** Null when no Gate 1 has been decided yet. */
  pct: number | null;
  verdict: "no-data" | "too-easy" | "too-hard" | "healthy";
}

export interface SlaHealth {
  reviewed: number;
  /** Null when nothing has been both submitted and decided. */
  medianHours: number | null;
  withinTarget: number;
  awaitingReview: number;
  /** Submitted, undecided, already older than the SLA. */
  breachedAndOpen: number;
}

export interface InstructorLoadHealth {
  sessionsHeld: number;
  /** Null when no session has ended yet. */
  sessionHoursPerWeek: number | null;
  sessionHours: number;
  weeksElapsed: number;
  reviewsDecided: number;
}

export interface AttendanceTrendPoint {
  week: number;
  pct: number;
  sessions: number;
  records: number;
}

export interface RetentionHealth {
  /** False until the cohort has actually reached week 4. */
  knowable: boolean;
  weekNow: number;
  everEnrolled: number;
  stillIn: number;
  pct: number | null;
}

export interface CohortHealth {
  gateOne: GateOneHealth;
  sla: SlaHealth;
  load: InstructorLoadHealth;
  attendanceTrend: AttendanceTrendPoint[];
  retention: RetentionHealth;
}

export interface DeskCohort {
  cohort: CohortWithBootcamp;
  weekNow: number;
  rows: DeskRosterRow[];
  gateResults: DeskGateResultRow[];
  health: CohortHealth;
  /** Sessions that have actually happened. Zero means every attendance number
   *  on this cohort is "not yet", not "nobody turned up". */
  sessionsHeld: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
}

/** Worst first. The desk reads top-down and the top is who to call. */
const STANDING_RANK: Record<string, number> = { probation: 0, at_risk: 1, good: 2 };

export type RosterSort = "standing" | "name" | "attendance" | "activity";

export function sortRoster(rows: DeskRosterRow[], sort: RosterSort): DeskRosterRow[] {
  const out = [...rows];
  switch (sort) {
    case "name":
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "attendance":
      // Unknown attendance sorts last: it is not a low score, it is no score.
      out.sort((a, b) => (a.attendancePct ?? 999) - (b.attendancePct ?? 999));
      break;
    case "activity":
      out.sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);
      break;
    default:
      out.sort(
        (a, b) =>
          STANDING_RANK[a.standing.standing] - STANDING_RANK[b.standing.standing] ||
          b.standing.riskScore - a.standing.riskScore ||
          a.name.localeCompare(b.name),
      );
  }
  return out;
}

export function parseSort(value: string | string[] | undefined): RosterSort {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "name" || v === "attendance" || v === "activity" ? v : "standing";
}

// ─── loader ──────────────────────────────────────────────────────────────────

/**
 * Every open or running cohort, with its roster and health block.
 *
 * Deliberately loads the lot in one pass rather than per-cohort: at 50 students
 * a cohort this is six queries total, and a desk that renders the whole
 * programme on one screen is the point of the concierge scale.
 */
export async function loadDeskCohorts(now: Date = new Date()): Promise<DeskCohort[]> {
  const admin = createAdminClient();

  const { data: cohortRows } = await admin
    .from("bootcamp_cohorts")
    .select("*, bootcamp:bootcamps(id, slug, title)")
    .in("status", ["open", "running"])
    .order("starts_on");

  const cohorts = (cohortRows ?? []) as unknown as CohortWithBootcamp[];
  if (cohorts.length === 0) return [];

  const cohortIds = cohorts.map((c) => c.id);

  const { data: enrolRows } = await admin
    .from("bootcamp_enrollments")
    .select("id, cohort_id, student_id, status, standing, created_at, student:students(name, email)")
    .in("cohort_id", cohortIds);

  const enrolments = (enrolRows ?? []) as unknown as {
    id: string;
    cohort_id: string;
    student_id: string;
    status: BootcampEnrollmentStatus;
    standing: string;
    created_at: string;
    student: { name: string | null; email: string } | null;
  }[];

  const enrolmentIds = enrolments.map((e) => e.id);
  const studentIds = [...new Set(enrolments.map((e) => e.student_id))];
  const bootcampIds = [...new Set(cohorts.map((c) => c.bootcamp_id))];

  const guard = <T,>(ids: T[]) => (ids.length ? ids : ["__none__" as unknown as T]);

  const [
    { data: gateRows },
    { data: resultRows },
    { data: sessionRows },
    { data: attendanceRows },
    { data: completionRows },
    { data: flagRows },
  ] = await Promise.all([
    admin
      .from("bootcamp_gates")
      .select("id, bootcamp_id, order_index, week, title")
      .in("bootcamp_id", guard(bootcampIds))
      .order("order_index"),
    admin
      .from("bootcamp_gate_results")
      .select(
        "bootcamp_enrollment_id, gate_id, status, attempts, rubric_pct, auto_score, objective_passed, ci_passed, submitted_at, decided_at",
      )
      .in("bootcamp_enrollment_id", guard(enrolmentIds)),
    admin
      .from("bootcamp_sessions")
      .select("id, cohort_id, week, kind, starts_at, duration_min, status")
      .in("cohort_id", cohortIds),
    admin
      .from("bootcamp_attendance")
      .select("session_id, bootcamp_enrollment_id, status")
      .in("bootcamp_enrollment_id", guard(enrolmentIds)),
    admin
      .from("lesson_completions")
      .select("student_id, completed_at")
      .in("student_id", guard(studentIds)),
    admin
      .from("bootcamp_audit_log")
      .select("subject_id, actor_email, reason, created_at")
      .eq("action", INTERVENTION_ACTION)
      .eq("subject_table", "bootcamp_enrollments")
      .in("subject_id", guard(enrolmentIds))
      .order("created_at", { ascending: false }),
  ]);

  const gates = (gateRows ?? []) as {
    id: string; bootcamp_id: string; order_index: number; week: number; title: string;
  }[];
  const gateById = new Map(gates.map((g) => [g.id, g]));

  const results = (resultRows ?? []) as {
    bootcamp_enrollment_id: string; gate_id: string; status: string; attempts: number;
    rubric_pct: number | null; auto_score: number | null; objective_passed: boolean | null;
    ci_passed: boolean | null; submitted_at: string | null; decided_at: string | null;
  }[];

  const sessions = (sessionRows ?? []) as {
    id: string; cohort_id: string; week: number; kind: string;
    starts_at: string; duration_min: number; status: string;
  }[];
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const attendance = (attendanceRows ?? []) as {
    session_id: string; bootcamp_enrollment_id: string; status: AttendanceStatus;
  }[];

  // Last activity. There is no `last_login` column anywhere in this schema, so
  // the honest proxy is the last graded thing they did — a lesson completion.
  // Labelled "last activity" in the UI for exactly that reason: claiming a login
  // timestamp we do not record would be a fabricated number on a page whose
  // entire job is to not have any.
  const lastActivity = new Map<string, string>();
  for (const c of (completionRows ?? []) as { student_id: string; completed_at: string }[]) {
    const cur = lastActivity.get(c.student_id);
    if (!cur || c.completed_at > cur) lastActivity.set(c.student_id, c.completed_at);
  }

  // Newest flag per enrolment (query is already newest-first).
  const flags = new Map<string, DeskInterventionFlag>();
  for (const f of (flagRows ?? []) as {
    subject_id: string; actor_email: string | null; reason: string | null; created_at: string;
  }[]) {
    if (!flags.has(f.subject_id)) {
      flags.set(f.subject_id, {
        by: f.actor_email ?? "unknown",
        at: f.created_at,
        reason: f.reason,
      });
    }
  }

  const attendanceByEnrolment = new Map<string, { status: AttendanceStatus; session_id: string }[]>();
  for (const a of attendance) {
    const list = attendanceByEnrolment.get(a.bootcamp_enrollment_id) ?? [];
    list.push({ status: a.status, session_id: a.session_id });
    attendanceByEnrolment.set(a.bootcamp_enrollment_id, list);
  }

  const resultsByEnrolment = new Map<string, typeof results>();
  for (const r of results) {
    const list = resultsByEnrolment.get(r.bootcamp_enrollment_id) ?? [];
    list.push(r);
    resultsByEnrolment.set(r.bootcamp_enrollment_id, list);
  }

  return cohorts.map((cohort) => {
    const startsOn = new Date(cohort.starts_on);
    const weekNow = currentWeek(startsOn, now);

    const cohortGates = gates
      .filter((g) => g.bootcamp_id === cohort.bootcamp_id)
      .sort((a, b) => a.order_index - b.order_index);

    const cohortSessions = sessions.filter((s) => s.cohort_id === cohort.id);
    // "Held" means it actually happened. A scheduled session in three weeks is
    // not an attendance denominator.
    const heldSessions = cohortSessions.filter(
      (s) => s.status === "ended" || (s.status !== "cancelled" && new Date(s.starts_at) < now),
    );
    const heldSessionIds = new Set(heldSessions.map((s) => s.id));

    const mine = enrolments.filter((e) => e.cohort_id === cohort.id);

    const rows: DeskRosterRow[] = mine.map((e) => {
      const myResults = resultsByEnrolment.get(e.id) ?? [];
      const passedGateIds = new Set(
        myResults.filter((r) => r.status === "passed" || r.status === "waived").map((r) => r.gate_id),
      );

      // The next gate they still owe us, in programme order.
      const nextGate = cohortGates.find((g) => !passedGateIds.has(g.id)) ?? null;
      const nextResult = nextGate ? myResults.find((r) => r.gate_id === nextGate.id) : undefined;
      const nextGateDueAt = nextGate ? weekDueDate(startsOn, nextGate.week) : null;

      const myAttendance = (attendanceByEnrolment.get(e.id) ?? []).filter((a) =>
        heldSessionIds.has(a.session_id),
      );
      // Only count sessions that have happened. weightedAttendancePct returns
      // 100 for an empty set ("nothing scheduled yet is not a failure"), which is
      // right for the student and wrong for a desk table — so the desk shows
      // null and says so instead.
      const attendancePct =
        heldSessions.length === 0 ? null : weightedAttendancePct(myAttendance);

      const missedOneToOnes = myAttendance.filter((a) => {
        const s = sessionById.get(a.session_id);
        return s?.kind === "one_to_one" && a.status === "absent";
      }).length;

      const lastAt = lastActivity.get(e.student_id) ?? null;
      // No completions at all: measure from enrolment, not from epoch. A student
      // who joined yesterday and has done nothing is one day quiet, not infinitely.
      const daysSinceLastActivity = daysBetween(
        new Date(lastAt ?? e.created_at),
        now,
      );

      const standing = computeStanding(
        {
          nextGateDueAt,
          nextGateTitle: nextGate?.title ?? null,
          // computeStanding needs a number. With no sessions held, 100 is the
          // same "not a failure" default the student-facing path uses, so
          // attendance simply contributes nothing until there is data.
          attendancePct: attendancePct ?? 100,
          daysSinceLastActivity,
          missedOneToOnes,
        },
        now,
      );

      return {
        enrollmentId: e.id,
        studentId: e.student_id,
        name: e.student?.name?.trim() || "—",
        email: e.student?.email ?? "—",
        status: e.status,
        storedStanding: e.standing,
        standing: { ...standing, label: standingLabel(standing.standing, standing.reasons) },
        attendancePct,
        sessionsAttendable: heldSessions.length,
        currentGateTitle: nextGate?.title ?? null,
        currentGateStatus: nextGate ? (nextResult?.status ?? "not started") : "all gates cleared",
        currentGateDueAt: nextGateDueAt,
        lastActivityAt: lastAt,
        daysSinceLastActivity,
        hasActivity: lastAt !== null,
        missedOneToOnes,
        flag: flags.get(e.id) ?? null,
      };
    });

    const myEnrolmentIds = new Set(mine.map((e) => e.id));
    const gateResults: DeskGateResultRow[] = results
      .filter((r) => myEnrolmentIds.has(r.bootcamp_enrollment_id))
      .map((r) => {
        const g = gateById.get(r.gate_id);
        const turnaroundHours =
          r.submitted_at && r.decided_at
            ? (new Date(r.decided_at).getTime() - new Date(r.submitted_at).getTime()) / 3_600_000
            : null;
        return {
          enrollmentId: r.bootcamp_enrollment_id,
          gateId: r.gate_id,
          gateTitle: g?.title ?? "—",
          gateOrder: g?.order_index ?? 0,
          gateWeek: g?.week ?? 0,
          status: r.status,
          attempts: r.attempts,
          rubricPct: r.rubric_pct === null ? null : Number(r.rubric_pct),
          autoScore: r.auto_score === null ? null : Number(r.auto_score),
          objectivePassed: r.objective_passed,
          ciPassed: r.ci_passed,
          submittedAt: r.submitted_at,
          decidedAt: r.decided_at,
          turnaroundHours: turnaroundHours === null ? null : Math.max(0, turnaroundHours),
        };
      })
      .sort((a, b) => a.gateOrder - b.gateOrder);

    return {
      cohort,
      weekNow,
      rows,
      gateResults,
      sessionsHeld: heldSessions.length,
      health: buildHealth({
        rows,
        gateResults,
        firstGate: cohortGates[0] ?? null,
        heldSessions,
        attendance: attendance.filter((a) => myEnrolmentIds.has(a.bootcamp_enrollment_id)),
        sessionById,
        weekNow,
        now,
      }),
    };
  });
}

// ─── health ──────────────────────────────────────────────────────────────────

function buildHealth(input: {
  rows: DeskRosterRow[];
  gateResults: DeskGateResultRow[];
  firstGate: { id: string; title: string; week: number } | null;
  heldSessions: { id: string; week: number; duration_min: number; status: string }[];
  attendance: { session_id: string; bootcamp_enrollment_id: string; status: AttendanceStatus }[];
  sessionById: Map<string, { id: string; week: number; kind: string; duration_min: number }>;
  weekNow: number;
  now: Date;
}): CohortHealth {
  const { rows, gateResults, firstGate, heldSessions, attendance, sessionById, weekNow, now } = input;

  // ── Gate 1 first-attempt pass rate ────────────────────────────────────────
  // The single number that says whether the bar is real. First attempt means
  // exactly that: passed with attempts <= 1. Someone who failed and came back
  // is a success for the student and a miss for this metric, which is the point
  // — it measures the gate, not the eventual outcome.
  const gateOneResults = firstGate
    ? gateResults.filter((r) => r.gateId === firstGate.id)
    : [];
  const decided = gateOneResults.filter((r) => r.status === "passed" || r.status === "failed");
  const firstAttemptPasses = decided.filter(
    (r) => r.status === "passed" && r.attempts <= 1,
  ).length;
  const gateOnePct = decided.length === 0 ? null : (firstAttemptPasses / decided.length) * 100;

  const gateOne: GateOneHealth = {
    gateTitle: firstGate?.title ?? null,
    decided: decided.length,
    firstAttemptPasses,
    pct: gateOnePct,
    verdict:
      gateOnePct === null
        ? "no-data"
        : gateOnePct > GATE_ONE_CEILING_PCT
          ? "too-easy"
          : gateOnePct < GATE_ONE_FLOOR_PCT
            ? "too-hard"
            : "healthy",
  };

  // ── Reviewer SLA ──────────────────────────────────────────────────────────
  // Schema note: there is no `reviewed_at` column. The decision timestamp is
  // `decided_at`, which is the same event — a gate result is not reviewed until
  // it is decided, and the CHECK constraint in 021 refuses a decision without it.
  const turnarounds = gateResults
    .map((r) => r.turnaroundHours)
    .filter((h): h is number => h !== null);
  const openSubmissions = gateResults.filter(
    (r) => r.status === "submitted" && r.submittedAt !== null && r.decidedAt === null,
  );
  const sla: SlaHealth = {
    reviewed: turnarounds.length,
    medianHours: median(turnarounds),
    withinTarget: turnarounds.filter((h) => h <= REVIEW_SLA_HOURS).length,
    awaitingReview: openSubmissions.length,
    breachedAndOpen: openSubmissions.filter(
      (r) =>
        (now.getTime() - new Date(r.submittedAt as string).getTime()) / 3_600_000 >
        REVIEW_SLA_HOURS,
    ).length,
  };

  // ── Instructor hours ──────────────────────────────────────────────────────
  // Contact hours are real: a session that ran for 90 minutes cost 90 minutes.
  // Review time is NOT instrumented anywhere — we know how many reviews were
  // decided, not how long any of them took — so reviews are reported as a count
  // and never converted into hours by an invented per-review constant.
  const sessionMinutes = heldSessions.reduce((s, x) => s + (x.duration_min ?? 0), 0);
  const weeksElapsed = Math.max(1, weekNow);
  const load: InstructorLoadHealth = {
    sessionsHeld: heldSessions.length,
    sessionHours: sessionMinutes / 60,
    sessionHoursPerWeek:
      heldSessions.length === 0 ? null : sessionMinutes / 60 / weeksElapsed,
    weeksElapsed,
    reviewsDecided: gateResults.filter((r) => r.decidedAt !== null).length,
  };

  // ── Attendance trend ──────────────────────────────────────────────────────
  const byWeek = new Map<string, { statuses: AttendanceStatus[]; sessions: Set<string> }>();
  for (const a of attendance) {
    const s = sessionById.get(a.session_id);
    if (!s) continue;
    if (!heldSessions.some((h) => h.id === s.id)) continue;
    const key = String(s.week);
    const slot = byWeek.get(key) ?? { statuses: [], sessions: new Set<string>() };
    slot.statuses.push(a.status);
    slot.sessions.add(s.id);
    byWeek.set(key, slot);
  }
  const attendanceTrend: AttendanceTrendPoint[] = [...byWeek.entries()]
    .map(([week, slot]) => ({
      week: Number(week),
      pct: weightedAttendancePct(slot.statuses.map((status) => ({ status }))),
      sessions: slot.sessions.size,
      records: slot.statuses.length,
    }))
    .sort((a, b) => a.week - b.week);

  // ── Week-4 retention ──────────────────────────────────────────────────────
  // Not knowable before week 4. A cohort in week 2 reporting "100% retained" is
  // a number that will be quoted back at somebody later.
  const everEnrolled = rows.length;
  const stillIn = rows.filter(
    (r) => r.status === "active" || r.status === "graduated",
  ).length;
  const knowable = weekNow >= 4 && everEnrolled > 0;
  const retention: RetentionHealth = {
    knowable,
    weekNow,
    everEnrolled,
    stillIn,
    pct: knowable ? (stillIn / everEnrolled) * 100 : null,
  };

  return { gateOne, sla, load, attendanceTrend, retention };
}
