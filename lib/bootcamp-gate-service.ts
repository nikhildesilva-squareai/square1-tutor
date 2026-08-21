// ═══════════════════════════════════════════════════════════════════════════════
// S7 — the server side of a gate: eligibility, evidence, and the result write.
//
// This file sits OUTSIDE lib/bootcamp/ deliberately. Everything in lib/bootcamp/
// is import-free so `node --test` can run it with no bundler; this file talks to
// Supabase, so it would break that rule. It therefore holds no rules of its own:
// every decision below is made by a pure function in @/lib/bootcamp and this
// code only fetches the rows those functions need.
//
// TWO INVARIANTS, both inherited from migration 021 and the 2026-07-29 audit:
//
//   1. EVERY write to bootcamp_gate_results goes through the SERVICE ROLE.
//      `authenticated` holds no INSERT or UPDATE privilege on a single column of
//      that table, and 77 integrity tests assert it stays that way. A student who
//      could write status='passed' has minted a credential we sell to employers.
//
//   2. `bootcamp_gates.requires` is read here and NEVER returned to a client.
//      It is the withheld threshold set — an answer key. Callers get the
//      EVALUATION (met / unmet), never the numbers.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BOOTCAMP_PASS_BAR,
  MAX_ATTEMPTS,
  canResubmit,
  deriveGateStatuses,
  weightedAttendancePct,
  type AttendanceStatus,
  type GateEvidence,
  type GateRequirements,
  type GateStatus,
} from "@/lib/bootcamp";
import type { BootcampGateResult } from "@/types/database";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Admin = SupabaseClient<any, any, any>;

/** A gate row as the SERVER sees it — `requires` included. Never serialise this
 *  to a client component or a JSON response. */
export interface ServerGate {
  id: string;
  bootcamp_id: string;
  order_index: number;
  week: number;
  title: string;
  summary_md: string;
  unlocks_module_ids: string[];
  requires: GateRequirements;
}

export interface GateSpine {
  /** Every gate on the bootcamp, in order, with thresholds. Server-only. */
  gates: ServerGate[];
  /** The student's result rows, keyed by gate id. */
  results: Map<string, BootcampGateResult>;
  /** Status per gate after the strictly-linear unlock rule is applied. */
  statuses: Record<string, GateStatus>;
}

/**
 * The whole gate spine for one enrolment, in two queries.
 *
 * Read under the SERVICE ROLE because `requires` carries no grant to
 * `authenticated` — selecting it as the student would fail outright, which is
 * the schema doing its job.
 */
export async function loadGateSpine(
  admin: Admin,
  bootcampId: string,
  enrolmentId: string,
): Promise<GateSpine> {
  const [{ data: gateRows }, { data: resultRows }] = await Promise.all([
    admin
      .from("bootcamp_gates")
      .select("id, bootcamp_id, order_index, week, title, summary_md, unlocks_module_ids, requires")
      .eq("bootcamp_id", bootcampId)
      .order("order_index", { ascending: true }),
    admin
      .from("bootcamp_gate_results")
      .select("*")
      .eq("bootcamp_enrollment_id", enrolmentId),
  ]);

  const gates = ((gateRows ?? []) as ServerGate[]).map((g) => ({
    ...g,
    requires: (g.requires ?? {}) as GateRequirements,
    unlocks_module_ids: g.unlocks_module_ids ?? [],
  }));
  const results = new Map(
    ((resultRows ?? []) as BootcampGateResult[]).map((r) => [r.gate_id, r]),
  );

  const statuses = deriveGateStatuses(
    gates.map((g) => g.id),
    Object.fromEntries([...results].map(([id, r]) => [id, r.status])),
  );

  return { gates, results, statuses };
}

// ─── Eligibility ─────────────────────────────────────────────────────────────

export interface Eligibility {
  allowed: boolean;
  /** Shown verbatim to the student when refused. */
  reason?: string;
  /** Attempts left under MAX_ATTEMPTS. */
  attemptsRemaining: number;
  /** End of the 7-day resubmission window, when one is running. */
  deadline?: Date;
}

/**
 * May this student submit to this gate right now?
 *
 * Three independent refusals, in the order that produces the most useful
 * message: the gate is not open yet, it is already cleared, or the attempt
 * budget / 7-day window is exhausted. The last one is delegated to canResubmit —
 * writing an attempt-count check by hand here would be a second, untested
 * implementation of the rule.
 */
export function checkGateEligibility(
  spine: GateSpine,
  gateId: string,
  now: Date = new Date(),
): Eligibility {
  const result = spine.results.get(gateId) ?? null;
  const status = spine.statuses[gateId] ?? "locked";
  const attempts = result?.attempts ?? 0;

  const budget = canResubmit(attempts, result?.decided_at ?? null, now);
  const left = attemptsRemaining(attempts);

  if (status === "locked") {
    return {
      allowed: false,
      reason:
        "This gate is locked. Gates open in order — clear the one before it first.",
      attemptsRemaining: 0,
    };
  }
  if (status === "passed" || status === "waived") {
    return {
      allowed: false,
      reason: "You have already cleared this gate.",
      attemptsRemaining: 0,
    };
  }
  if (status === "submitted") {
    return {
      allowed: false,
      reason:
        "Your submission is with a reviewer. You will get written feedback in your thread before you resubmit.",
      attemptsRemaining: left,
    };
  }
  if (!budget.allowed) {
    return {
      allowed: false,
      reason:
        budget.reason === "Resubmission window has closed"
          ? "The 7-day resubmission window for this gate has closed. Talk to your mentor in your 1-1."
          : "You have used both attempts at this gate. Talk to your mentor in your 1-1.",
      attemptsRemaining: 0,
      deadline: budget.deadline,
    };
  }

  return { allowed: true, attemptsRemaining: left, deadline: budget.deadline };
}

/** Attempts left, for display. Derived from the SAME constant canResubmit
 *  enforces, so the number on screen and the number enforced cannot disagree. */
export function attemptsRemaining(attempts: number): number {
  return Math.max(0, MAX_ATTEMPTS - attempts);
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export interface EvidenceGaps {
  /** Requirements this codebase cannot yet measure. Surfaced, never hidden:
   *  a check that silently reads 0 looks like a student failure. */
  unmeasurable: string[];
}

/**
 * Assemble everything evaluateGate needs about one student, from graded
 * artifacts only. Nothing here is self-reported.
 *
 * KNOWN GAPS (returned, not swallowed):
 *   • peer_reviews — there is no peer-review table in the schema at all, so
 *     `peerReviewsGiven` is 0 for everyone. Gates 2 and 3 require 2 (migration
 *     024), which means they can never be autoEligible until peer review is
 *     built. A human can still sign them off, which is the point of the model.
 *   • min_authored_prs — squad attribution needs a GitHub App that does not
 *     exist yet. See TODO(S7-github) below.
 */
export async function loadGateEvidence(
  admin: Admin,
  args: {
    studentId: string;
    enrolmentId: string;
    courseId: string;
    gate: ServerGate;
    spine: GateSpine;
  },
): Promise<{ evidence: GateEvidence; gaps: EvidenceGaps }> {
  const { studentId, enrolmentId, courseId, gate, spine } = args;
  const result = spine.results.get(gate.id) ?? null;
  const bar = gate.requires.min_score ?? BOOTCAMP_PASS_BAR;

  const [
    { data: moduleRows },
    { data: lessonRows },
    { data: completionRows },
    { data: submissionRows },
    { data: attendanceRows },
  ] = await Promise.all([
    admin.from("modules").select("id").eq("course_id", courseId),
    admin.from("lessons").select("id, module_id").eq("course_id", courseId),
    admin.from("lesson_completions").select("lesson_id").eq("student_id", studentId),
    admin
      .from("project_submissions")
      .select("project_id, score, max_score")
      .eq("student_id", studentId),
    admin
      .from("bootcamp_attendance")
      .select("status")
      .eq("bootcamp_enrollment_id", enrolmentId),
  ]);

  // "The gate's lessons" = the course work that is OPEN to the student right
  // now: everything except modules still shut behind this gate or a later one.
  // The schema has no lesson→gate mapping, so this is the honest reading of
  // "course work for this block" that the data supports.
  const lockedModules = new Set<string>();
  for (const g of spine.gates) {
    const st = spine.statuses[g.id];
    if (st === "passed" || st === "waived") continue;
    for (const m of g.unlocks_module_ids ?? []) lockedModules.add(m);
  }
  const allModuleIds = new Set(((moduleRows ?? []) as { id: string }[]).map((m) => m.id));
  const openModuleIds = new Set([...allModuleIds].filter((id) => !lockedModules.has(id)));

  const lessons = (lessonRows ?? []) as { id: string; module_id: string }[];
  const inScope = lessons.filter((l) => openModuleIds.has(l.module_id));
  const completed = new Set(
    ((completionRows ?? []) as { lesson_id: string }[]).map((c) => c.lesson_id),
  );
  const doneInScope = inScope.filter((l) => completed.has(l.id)).length;
  const lessonsCompletePct =
    inScope.length === 0 ? 0 : (doneInScope / inScope.length) * 100;

  // A project counts as passed when its rubric score clears the BOOTCAMP bar,
  // not the self-paced one — the same number evaluateGate will apply.
  const passedProjectIds = ((submissionRows ?? []) as {
    project_id: string; score: number | null; max_score: number;
  }[])
    .filter((s) => s.score !== null && s.max_score > 0 && (s.score / s.max_score) * 100 >= bar)
    .map((s) => s.project_id);

  const attendancePct = weightedAttendancePct(
    ((attendanceRows ?? []) as { status: AttendanceStatus }[]),
  );

  return {
    evidence: {
      lessonsCompletePct,
      passedProjectIds,
      rubricPct: result?.rubric_pct !== null && result?.rubric_pct !== undefined
        ? Number(result.rubric_pct)
        : null,
      objectivePassed: result?.objective_passed ?? null,
      ciPassed: result?.ci_passed ?? null,
      // No peer-review table exists in the schema. Reported as a gap rather
      // than quietly counted as a student shortfall.
      peerReviewsGiven: 0,
      attendancePct,
      // TODO(S7-github): squad PR attribution needs a GitHub App (repo-scoped
      // installation token + per-author PR listing) that has not been created.
      // Until it exists this is 0 for everyone and `min_authored_prs` gates read
      // unmet — which is the safe direction: it can only withhold a pass, never
      // grant one on a teammate's work (ST-30).
      authoredPrCount: 0,
      vivaRecorded: !!result?.viva_recording_url,
    },
    gaps: {
      unmeasurable: [
        ...(typeof gate.requires.peer_reviews === "number" ? ["peer_reviews"] : []),
        ...(typeof gate.requires.min_authored_prs === "number" ? ["authored_prs"] : []),
      ],
    },
  };
}

// ─── Writes (service role only) ──────────────────────────────────────────────

/**
 * Record a gate submission. SERVICE ROLE ONLY — see the header.
 *
 * `attempts` is incremented HERE and nowhere else, so the number canResubmit
 * enforces is the number this function wrote. status goes to 'submitted', never
 * to 'passed': a pass is a human decision, and the DB CHECK
 * bootcamp_gate_results_decision_attributed refuses a decided row without a
 * reviewer anyway.
 */
export async function recordGateSubmission(
  admin: Admin,
  args: {
    enrolmentId: string;
    gateId: string;
    submissionId: string;
    rubricPct: number;
    autoScore: number;
    objectivePassed: boolean | null;
    ciPassed: boolean | null;
    previousAttempts: number;
    hasExistingRow: boolean;
  },
): Promise<{ error: string | null; attempts: number }> {
  const nowIso = new Date().toISOString();
  const attempts = args.previousAttempts + 1;

  const payload = {
    bootcamp_enrollment_id: args.enrolmentId,
    gate_id: args.gateId,
    status: "submitted" as const,
    submission_id: args.submissionId,
    rubric_pct: args.rubricPct,
    auto_score: args.autoScore,
    objective_passed: args.objectivePassed,
    ci_passed: args.ciPassed,
    attempts,
    submitted_at: nowIso,
    // A resubmission re-opens the gate, so the previous decision must not keep
    // reading as current. Cleared together — the DB CHECK requires decided_at
    // and reviewer_id to move as a pair.
    decided_at: null,
    reviewer_id: null,
  };

  const { error } = args.hasExistingRow
    ? await admin
        .from("bootcamp_gate_results")
        .update(payload)
        .eq("bootcamp_enrollment_id", args.enrolmentId)
        .eq("gate_id", args.gateId)
    : await admin.from("bootcamp_gate_results").insert({ ...payload, opened_at: nowIso });

  return { error: error ? error.message : null, attempts };
}

/**
 * Post a message into a submission's private thread. SERVICE ROLE, because
 * author_kind 'ai' and 'instructor' are exactly what the migration-021 trigger
 * forces to 'student' on any authenticated insert. A student reply must NOT come
 * through here — it goes through the student's own client so that trigger stamps
 * the provenance.
 */
export async function postThreadMessage(
  admin: Admin,
  args: {
    submissionId: string;
    authorKind: "ai" | "instructor";
    authorId: string | null;
    bodyMd: string;
  },
): Promise<void> {
  const body = args.bodyMd.trim().slice(0, 20_000);
  if (!body) return;
  const { error } = await admin.from("submission_comments").insert({
    submission_id: args.submissionId,
    author_kind: args.authorKind,
    author_id: args.authorId,
    body_md: body,
  });
  if (error) {
    // A thread message failing must never fail the grading that produced it —
    // the score is the durable artifact, the thread is the conversation about it.
    console.error("[bootcamp-gate-service] thread insert:", error.message);
  }
}

/** The AI review, rendered as message #1 of the thread (ST-32 / IN-20). */
export function renderAiReviewMessage(args: {
  gateTitle: string;
  rubricPct: number;
  attempt: number;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  objectivePassed: boolean | null;
  ciPassed: boolean | null;
}): string {
  const lines: string[] = [];
  lines.push(`**Automated review — ${args.gateTitle} (attempt ${args.attempt})**`);
  lines.push("");
  lines.push(`Rubric score: **${Math.round(args.rubricPct)}%**`);
  if (args.objectivePassed !== null) {
    lines.push(
      `Answer-key check: **${args.objectivePassed ? "passed" : "did not match"}**`,
    );
  }
  if (args.ciPassed !== null) {
    lines.push(`Contract tests in CI: **${args.ciPassed ? "green" : "failing"}**`);
  }
  lines.push("");
  if (args.overallFeedback) {
    lines.push(args.overallFeedback);
    lines.push("");
  }
  if (args.strengths.length) {
    lines.push("**What works**");
    for (const s of args.strengths) lines.push(`- ${s}`);
    lines.push("");
  }
  if (args.improvements.length) {
    lines.push("**What to change**");
    for (const s of args.improvements) lines.push(`- ${s}`);
    lines.push("");
  }
  lines.push(
    "_This is an automated first pass, not a decision. A human reviewer signs this gate off — reply here if anything above reads wrong and they will see it._",
  );
  return lines.join("\n");
}
