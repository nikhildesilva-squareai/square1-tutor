// ═══════════════════════════════════════════════════════════════════════════════
// Standing, attendance weighting and seat counting — pure, no DB, no I/O.
//
// Standing exists to answer ST-39: "let me know I'm slipping BEFORE it's
// terminal, with a concrete way back". At 50 students one instructor cannot
// notice everyone, so the computation runs nightly and produces two things:
//
//   • a plain-language line for the student  — never a score, never a rank
//   • a risk-ranked call list for the desk   — 5 people to contact, with reasons
//
// The automation exists to PROMPT A HUMAN, not to replace one. Nothing here
// suspends, fails or removes anybody.
//
// House style follows lib/srs.ts: injectable `now` for deterministic tests.
//
// This module has NO imports on purpose. Week arithmetic stays in lib/schedule.ts
// and the CALLER passes the resolved due date in — so there is no second
// implementation of "which week is it", and this file runs under `node --test`
// with no bundler and no path alias (same rule lib/competitions/metrics.ts follows).
// ═══════════════════════════════════════════════════════════════════════════════

export type Standing = "good" | "at_risk" | "probation";

/** Days behind the expected pace before standing degrades. Chosen so a single
 *  bad week does not flag someone — that would train instructors to ignore it. */
const AT_RISK_DAYS_BEHIND = 7;
const PROBATION_DAYS_BEHIND = 21;

/** Weighted attendance floors. Below the first is a signal; below the second,
 *  the student is functionally not in the programme. */
const AT_RISK_ATTENDANCE_PCT = 60;
const PROBATION_ATTENDANCE_PCT = 35;

/** Silence is the strongest single churn predictor we have. */
const AT_RISK_INACTIVE_DAYS = 7;
const PROBATION_INACTIVE_DAYS = 14;

const DAY_MS = 86_400_000;

export interface StandingInputs {
  /** Due date of the next unpassed gate, resolved by the caller via
   *  lib/schedule.ts (weekDueDate + scaleWeek). Null when nothing is outstanding. */
  nextGateDueAt: Date | string | null;
  nextGateTitle: string | null;
  /** Weighted %: live attendance 1.0, watched recording 0.5. */
  attendancePct: number;
  daysSinceLastActivity: number;
  missedOneToOnes: number;
}

export interface StandingResult {
  standing: Standing;
  /** Plain language, shown to the student. Never a score or a rank. */
  label: string;
  /** Machine-readable drivers, for the desk call list. */
  reasons: string[];
  /** 0–100. Desk-only — never rendered to the student. */
  riskScore: number;
  daysBehind: number;
}

/**
 * Compute a student's standing.
 *
 * `daysBehind` is measured against the due date of their next unpassed gate.
 * Resolve that date with lib/schedule.ts before calling — this module stays
 * import-free so it is trivially testable.
 */
export function computeStanding(
  input: StandingInputs,
  now: Date = new Date(),
): StandingResult {
  let daysBehind = 0;
  if (input.nextGateDueAt !== null) {
    const due =
      typeof input.nextGateDueAt === "string"
        ? new Date(input.nextGateDueAt)
        : input.nextGateDueAt;
    daysBehind = Math.max(0, Math.ceil((now.getTime() - due.getTime()) / DAY_MS));
  }

  const reasons: string[] = [];
  let standing: Standing = "good";

  const escalate = (next: Standing) => {
    if (next === "probation") standing = "probation";
    else if (next === "at_risk" && standing === "good") standing = "at_risk";
  };

  if (daysBehind >= PROBATION_DAYS_BEHIND) {
    escalate("probation");
    reasons.push(`${daysBehind} days past the ${input.nextGateTitle ?? "next gate"} deadline`);
  } else if (daysBehind >= AT_RISK_DAYS_BEHIND) {
    escalate("at_risk");
    reasons.push(`${daysBehind} days behind on ${input.nextGateTitle ?? "the next gate"}`);
  }

  if (input.attendancePct < PROBATION_ATTENDANCE_PCT) {
    escalate("probation");
    reasons.push(`Attendance ${Math.round(input.attendancePct)}%`);
  } else if (input.attendancePct < AT_RISK_ATTENDANCE_PCT) {
    escalate("at_risk");
    reasons.push(`Attendance ${Math.round(input.attendancePct)}%`);
  }

  if (input.daysSinceLastActivity >= PROBATION_INACTIVE_DAYS) {
    escalate("probation");
    reasons.push(`No activity for ${input.daysSinceLastActivity} days`);
  } else if (input.daysSinceLastActivity >= AT_RISK_INACTIVE_DAYS) {
    escalate("at_risk");
    reasons.push(`No activity for ${input.daysSinceLastActivity} days`);
  }

  if (input.missedOneToOnes >= 2) {
    escalate("at_risk");
    reasons.push(`Missed ${input.missedOneToOnes} one-to-ones`);
  }

  // Desk-only ranking. Weighted toward the signals that actually precede
  // dropout rather than the ones that are easiest to measure.
  const riskScore = Math.min(
    100,
    Math.round(
      Math.min(daysBehind, 30) * 1.6 +
        Math.max(0, 100 - input.attendancePct) * 0.35 +
        Math.min(input.daysSinceLastActivity, 21) * 1.8 +
        input.missedOneToOnes * 6,
    ),
  );

  return { standing, label: standingLabel(standing, reasons), reasons, riskScore, daysBehind };
}

/**
 * The student-facing line. Plain arithmetic stated plainly — never a judgement,
 * never a grade, never a comparison to peers. "You're 9 days behind on Gate 2"
 * is actionable; "Risk: 74" is just frightening.
 */
export function standingLabel(standing: Standing, reasons: string[]): string {
  if (standing === "good") return "On track";
  const lead = reasons[0] ?? "Behind schedule";
  return standing === "probation" ? `Needs attention — ${lead}` : lead;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "excused"
  | "watched_recording";

/**
 * How much a session counts.
 *
 * `watched_recording` at 0.5 is the mechanism that lets a student outside the
 * cohort's timezone band still graduate (ST-24). It is only ever written when
 * ≥80% was watched AND a paired async artifact exists — otherwise it is a
 * checkbox, not attendance.
 */
export function attendanceWeight(status: AttendanceStatus): number {
  switch (status) {
    case "present":
      return 1;
    case "late":
      return 0.75;
    case "excused":
      return 1;
    case "watched_recording":
      return 0.5;
    case "absent":
      return 0;
  }
}

/** Presence classification from webhook minutes. */
export function presenceStatus(
  minutesPresent: number,
  durationMin: number,
): AttendanceStatus {
  if (durationMin <= 0) return "absent";
  const pct = (minutesPresent / durationMin) * 100;
  if (pct >= 70) return "present";
  if (pct >= 30) return "late";
  return "absent";
}

/** Weighted attendance % across a set of sessions. */
export function weightedAttendancePct(
  records: { status: AttendanceStatus }[],
): number {
  if (records.length === 0) return 100; // nothing scheduled yet is not a failure
  const earned = records.reduce((s, r) => s + attendanceWeight(r.status), 0);
  return (earned / records.length) * 100;
}

// ─── Seats ───────────────────────────────────────────────────────────────────

/**
 * Seats remaining. Deliberately a one-line pure function with no configurable
 * offset, so there is nowhere in the codebase to inflate scarcity.
 *
 * This is the honest-numbers rule (AD-08) expressed as a type signature: the
 * only inputs are the real cap and the real accepted count.
 */
export function seatsRemaining(seats: number, acceptedCount: number): number {
  return Math.max(0, seats - acceptedCount);
}

export function isCohortFull(seats: number, acceptedCount: number): boolean {
  return seatsRemaining(seats, acceptedCount) === 0;
}
