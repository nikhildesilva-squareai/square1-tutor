// ═══════════════════════════════════════════════════════════════════════════════
// Gate evaluation — pure, no DB, no I/O.
//
// A gate is the compulsory checkpoint a bootcamp student must clear before the
// next block of the programme unlocks. Six per bootcamp. This module decides
// whether the evidence we hold about a student MEETS a gate's requirements; it
// never decides that a gate is passed — that is a human sign-off, written under
// the service role, with an audit row (see migrations/021).
//
// Two hard rules encoded here:
//
//   1. AUTO-SCORE IS NOT A PASS. `evaluateGate` returns `autoEligible`, meaning
//      "everything measurable is satisfied, a human may now sign off". Passing is
//      a decision, not a computation. The 2026-07-29 audit lesson is that the
//      expensive failure mode is integrity, not confidentiality.
//   2. THRESHOLDS ARE INPUTS, NEVER DEFAULTS FROM THE CLIENT. `requires` is
//      service-role-read only (see the column grant in 021). This module takes it
//      as a parameter so it can be unit-tested, but nothing in the browser can
//      obtain it.
//
// House style follows lib/srs.ts: injectable `now` for deterministic tests.
// ═══════════════════════════════════════════════════════════════════════════════

/** The bootcamp rubric bar. Deliberately above the self-paced bars (60 with an
 *  objective gate, 70 solo) — people are paying for a harder standard. */
export const BOOTCAMP_PASS_BAR = 75;

/** Resubmission budget after a fail. Bounded so failure is recoverable but not
 *  infinite: an unlimited retry loop makes the bar meaningless. */
export const MAX_ATTEMPTS = 2;
export const RESUBMIT_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;

export type GateStatus =
  | "locked"
  | "open"
  | "submitted"
  | "passed"
  | "failed"
  | "waived";

/** Shape of `bootcamp_gates.requires`. Every field is optional: a gate declares
 *  only the conditions it actually cares about. */
export interface GateRequirements {
  /** % of the gate's lessons that must be complete. */
  lessons_pct?: number;
  /** Projects that must have a passing submission. */
  project_ids?: string[];
  /** Minimum rubric % — defaults to BOOTCAMP_PASS_BAR when absent. */
  min_score?: number;
  /** Peer reviews the student must have GIVEN (reviewing is graded work). */
  peer_reviews?: number;
  /** Weighted attendance % required (live 1.0, watched recording 0.5). */
  attendance_pct?: number;
  /** Squad gates: the student must have authored at least this many PRs.
   *  Guards ST-30 — nobody passes on a teammate's work. */
  min_authored_prs?: number;
  /** Does this gate require a recorded viva? */
  viva?: boolean;
  /** Almost always true. Present so a formative gate can be automated. */
  human_signoff?: boolean;
}

/** What we know about one student, for one gate. All figures are computed
 *  server-side from graded artifacts — nothing here is self-reported. */
export interface GateEvidence {
  lessonsCompletePct: number;
  passedProjectIds: string[];
  rubricPct: number | null;
  objectivePassed: boolean | null;
  ciPassed: boolean | null;
  peerReviewsGiven: number;
  attendancePct: number;
  authoredPrCount: number;
  vivaRecorded: boolean;
}

export interface GateCheck {
  key: string;
  /** Shown to the student. Never leaks the threshold when unmet — see below. */
  label: string;
  met: boolean;
}

export interface GateEvaluation {
  checks: GateCheck[];
  /** Everything the student controls is done — they may submit for review. */
  canSubmit: boolean;
  /** Every measurable condition is satisfied. A human may now sign off.
   *  NOT a pass. */
  autoEligible: boolean;
  /** Still-unmet check keys, for the "what to do next" panel (ST-34). */
  unmet: string[];
}

/**
 * Evaluate a student's evidence against a gate's requirements.
 *
 * Labels describe the SHAPE of what is missing, not the exact threshold — a
 * student who can read "needs 70% attendance" knows precisely how much class to
 * skip. The desk sees exact numbers; the student sees direction.
 */
export function evaluateGate(
  requires: GateRequirements,
  evidence: GateEvidence,
): GateEvaluation {
  const checks: GateCheck[] = [];

  if (typeof requires.lessons_pct === "number") {
    checks.push({
      key: "lessons",
      label: "Course work for this block complete",
      met: evidence.lessonsCompletePct >= requires.lessons_pct,
    });
  }

  if (requires.project_ids?.length) {
    const passed = new Set(evidence.passedProjectIds);
    const done = requires.project_ids.filter((id) => passed.has(id)).length;
    checks.push({
      key: "projects",
      label:
        requires.project_ids.length === 1
          ? "Gate project submitted and passing"
          : `Gate projects passing (${done} of ${requires.project_ids.length})`,
      met: done === requires.project_ids.length,
    });
  }

  const bar = requires.min_score ?? BOOTCAMP_PASS_BAR;
  if (evidence.rubricPct !== null) {
    checks.push({
      key: "rubric",
      label: "Review score meets the bootcamp bar",
      met: evidence.rubricPct >= bar,
    });
  }

  if (evidence.objectivePassed !== null) {
    checks.push({
      key: "objective",
      label: "Output matches the withheld answer key",
      met: evidence.objectivePassed,
    });
  }

  if (evidence.ciPassed !== null) {
    checks.push({
      key: "ci",
      label: "Contract tests passing in CI",
      met: evidence.ciPassed,
    });
  }

  if (typeof requires.peer_reviews === "number") {
    checks.push({
      key: "peer_reviews",
      label: `Peer reviews given (${Math.min(
        evidence.peerReviewsGiven,
        requires.peer_reviews,
      )} of ${requires.peer_reviews})`,
      met: evidence.peerReviewsGiven >= requires.peer_reviews,
    });
  }

  if (typeof requires.attendance_pct === "number") {
    checks.push({
      key: "attendance",
      label: "Attendance requirement met",
      met: evidence.attendancePct >= requires.attendance_pct,
    });
  }

  // ST-30: on a squad gate, a member with no authored PRs cannot ride the
  // team's score. Individual contribution comes from the GitHub API, never
  // from self-report.
  if (typeof requires.min_authored_prs === "number") {
    checks.push({
      key: "authored_prs",
      label: `Pull requests you authored (${Math.min(
        evidence.authoredPrCount,
        requires.min_authored_prs,
      )} of ${requires.min_authored_prs})`,
      met: evidence.authoredPrCount >= requires.min_authored_prs,
    });
  }

  if (requires.viva) {
    checks.push({
      key: "viva",
      label: "Viva recorded",
      met: evidence.vivaRecorded,
    });
  }

  const unmet = checks.filter((c) => !c.met).map((c) => c.key);

  // A viva is scheduled by staff, so it must not block the student from
  // submitting the work that earns the viva.
  const blockingForSubmit = unmet.filter((k) => k !== "viva");

  return {
    checks,
    canSubmit: blockingForSubmit.length === 0,
    autoEligible: unmet.length === 0,
    unmet,
  };
}

/** Whether a failed gate can still be resubmitted. Bounded by attempts AND a
 *  window measured from the fail decision — an open-ended retry turns a
 *  deadline-driven programme into a self-paced one. */
export function canResubmit(
  attempts: number,
  decidedAt: Date | string | null,
  now: Date = new Date(),
): { allowed: boolean; reason?: string; deadline?: Date } {
  if (attempts >= MAX_ATTEMPTS) {
    return { allowed: false, reason: "No attempts remaining" };
  }
  if (!decidedAt) return { allowed: true };

  const decided = typeof decidedAt === "string" ? new Date(decidedAt) : decidedAt;
  const deadline = new Date(decided.getTime() + RESUBMIT_WINDOW_DAYS * DAY_MS);
  if (now.getTime() > deadline.getTime()) {
    return { allowed: false, reason: "Resubmission window has closed", deadline };
  }
  return { allowed: true, deadline };
}

/**
 * Which gates are open to a student, given the ordered gate list and their
 * results. Strictly linear: gate N opens only when gate N−1 is passed or waived.
 *
 * This is the compulsion in "strictly-gated". Skipping is the anti-story that
 * makes the certificate worthless (see bootcamp-user-stories.md §6).
 */
export function deriveGateStatuses(
  orderedGateIds: string[],
  results: Record<string, GateStatus | undefined>,
): Record<string, GateStatus> {
  const out: Record<string, GateStatus> = {};
  let previousCleared = true;

  for (const id of orderedGateIds) {
    const existing = results[id];
    if (existing && existing !== "locked") {
      out[id] = existing;
    } else {
      out[id] = previousCleared ? "open" : "locked";
    }
    previousCleared = out[id] === "passed" || out[id] === "waived";
  }
  return out;
}
