// Runnable with the repo's built-in runner: `npm run test:bootcamp`
// (node --test, no test framework dependency — matches __tests__/competitions/).
//
// Every expected value here is hand-derived from the RULES in docs/bootcamp-prd.md,
// not from running this implementation. A test that asserts whatever the code
// currently returns proves nothing.
//
// What these guard, in priority order:
//   1. Strict linear progression — skipping a gate is the anti-story that makes
//      the certificate worthless.
//   2. ST-30 — a squad member with no authored PRs cannot pass on the team's score.
//   3. Threshold secrecy — a student who can read the pass bar knows exactly how
//      little to do. Labels state direction, never the number.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateGate,
  canResubmit,
  deriveGateStatuses,
  BOOTCAMP_PASS_BAR,
  MAX_ATTEMPTS,
  RESUBMIT_WINDOW_DAYS,
  type GateRequirements,
  type GateEvidence,
  type GateStatus,
} from "../../lib/bootcamp/gates.ts";

// A gate that exercises every requirement kind at once.
const FULL: GateRequirements = {
  lessons_pct: 90,
  project_ids: ["p1"],
  min_score: 75,
  peer_reviews: 2,
  attendance_pct: 70,
  min_authored_prs: 1,
  viva: false,
  human_signoff: true,
};

const PASSING: GateEvidence = {
  lessonsCompletePct: 95,
  passedProjectIds: ["p1"],
  rubricPct: 88,
  objectivePassed: true,
  ciPassed: true,
  peerReviewsGiven: 2,
  attendancePct: 80,
  authoredPrCount: 3,
  vivaRecorded: false,
};

describe("constants", () => {
  test("the bootcamp bar is stricter than both self-paced bars (60 / 70)", () => {
    assert.equal(BOOTCAMP_PASS_BAR, 75);
    assert.ok(BOOTCAMP_PASS_BAR > 70, "must exceed the self-paced solo bar");
  });

  test("resubmission is bounded — failure is recoverable, not infinite", () => {
    assert.equal(MAX_ATTEMPTS, 2);
    assert.equal(RESUBMIT_WINDOW_DAYS, 7);
  });
});

describe("evaluateGate", () => {
  test("evidence meeting every requirement is auto-eligible and submittable", () => {
    const r = evaluateGate(FULL, PASSING);
    assert.deepEqual(r.unmet, []);
    assert.equal(r.autoEligible, true);
    assert.equal(r.canSubmit, true);
  });

  test("autoEligible is NOT a pass — it only means a human may now sign off", () => {
    // Guards the integrity rule: passing is a decision, never a computation.
    const r = evaluateGate(FULL, PASSING);
    assert.ok(!("passed" in r), "evaluateGate must not emit a pass verdict");
    assert.ok(FULL.human_signoff, "this gate still requires human sign-off");
  });

  test("ST-30: zero authored PRs blocks a squad gate even with a strong team score", () => {
    const carried = { ...PASSING, authoredPrCount: 0 };
    const r = evaluateGate(FULL, carried);
    assert.equal(r.autoEligible, false);
    assert.ok(r.unmet.includes("authored_prs"));
  });

  test("rubric one point under the bar fails", () => {
    // 74 vs a bar of 75 — hand-checked boundary, not a round number.
    const r = evaluateGate(FULL, { ...PASSING, rubricPct: 74 });
    assert.ok(r.unmet.includes("rubric"));
  });

  test("rubric exactly at the bar passes", () => {
    const r = evaluateGate(FULL, { ...PASSING, rubricPct: 75 });
    assert.ok(!r.unmet.includes("rubric"));
  });

  test("min_score overrides the default bar", () => {
    const lenient = evaluateGate({ ...FULL, min_score: 60 }, { ...PASSING, rubricPct: 65 });
    assert.ok(!lenient.unmet.includes("rubric"));
    const strict = evaluateGate({ ...FULL, min_score: 90 }, { ...PASSING, rubricPct: 88 });
    assert.ok(strict.unmet.includes("rubric"));
  });

  test("failing the objective answer-key check blocks the gate", () => {
    const r = evaluateGate(FULL, { ...PASSING, objectivePassed: false });
    assert.ok(r.unmet.includes("objective"));
    assert.equal(r.canSubmit, false);
  });

  test("failing CI contract tests blocks the gate", () => {
    const r = evaluateGate(FULL, { ...PASSING, ciPassed: false });
    assert.ok(r.unmet.includes("ci"));
  });

  test("partial peer reviews fail; the label shows progress", () => {
    const r = evaluateGate(FULL, { ...PASSING, peerReviewsGiven: 1 });
    assert.ok(r.unmet.includes("peer_reviews"));
    const label = r.checks.find((c) => c.key === "peer_reviews")!.label;
    assert.ok(label.includes("1 of 2"), `progress not shown: ${label}`);
  });

  test("attendance below the requirement blocks the gate", () => {
    const r = evaluateGate(FULL, { ...PASSING, attendancePct: 69 });
    assert.ok(r.unmet.includes("attendance"));
  });

  test("a pending viva does NOT block submission — staff schedule it, not the student", () => {
    const r = evaluateGate({ ...FULL, viva: true }, PASSING);
    assert.equal(r.canSubmit, true, "student must be able to submit the work that earns the viva");
    assert.equal(r.autoEligible, false, "but the gate is not clear until the viva exists");
    assert.deepEqual(r.unmet, ["viva"]);
  });

  test("checks are omitted, not failed, when a requirement is absent", () => {
    const minimal = evaluateGate({ lessons_pct: 50 }, { ...PASSING, rubricPct: null, objectivePassed: null, ciPassed: null });
    assert.deepEqual(minimal.checks.map((c) => c.key), ["lessons"]);
    assert.equal(minimal.autoEligible, true);
  });

  test("multi-project gates report how many of the set are passing", () => {
    const r = evaluateGate(
      { ...FULL, project_ids: ["p1", "p2", "p3"] },
      { ...PASSING, passedProjectIds: ["p1", "p3"] },
    );
    assert.ok(r.unmet.includes("projects"));
    const label = r.checks.find((c) => c.key === "projects")!.label;
    assert.ok(label.includes("2 of 3"), `progress not shown: ${label}`);
  });

  test("labels never leak a numeric threshold", () => {
    // The pass bar, lesson % and attendance % must not appear in student-facing
    // copy. Progress counters like "1 of 2" are fine — they reveal effort, not
    // the bar.
    const r = evaluateGate(FULL, { ...PASSING, rubricPct: 40, attendancePct: 10, lessonsCompletePct: 5 });
    for (const c of r.checks) {
      assert.ok(!/\b75\b|\b90\b|\b70\b/.test(c.label), `threshold leaked in: "${c.label}"`);
    }
  });
});

describe("deriveGateStatuses — strict linear progression", () => {
  const GATES = ["g1", "g2", "g3", "g4"];

  test("only the first gate is open at the start", () => {
    const s = deriveGateStatuses(GATES, {});
    assert.equal(s.g1, "open");
    assert.equal(s.g2, "locked");
    assert.equal(s.g4, "locked");
  });

  test("passing a gate opens exactly the next one", () => {
    const s = deriveGateStatuses(GATES, { g1: "passed" });
    assert.equal(s.g2, "open");
    assert.equal(s.g3, "locked", "passing one gate must not open two");
  });

  test("a FAILED gate does not unlock the next — this is the whole point", () => {
    const s = deriveGateStatuses(GATES, { g1: "failed" });
    assert.equal(s.g2, "locked");
  });

  test("a SUBMITTED gate does not unlock the next — awaiting review is not a pass", () => {
    const s = deriveGateStatuses(GATES, { g1: "submitted" });
    assert.equal(s.g2, "locked");
  });

  test("a WAIVED gate unlocks the next, like a pass", () => {
    const s = deriveGateStatuses(GATES, { g1: "waived" });
    assert.equal(s.g2, "open");
  });

  test("consecutive passes cascade", () => {
    const s = deriveGateStatuses(GATES, { g1: "passed", g2: "passed", g3: "passed" });
    assert.equal(s.g4, "open");
  });

  test("an existing non-locked status is preserved rather than recomputed", () => {
    // Documents deliberate behaviour: a gate already decided is never
    // retroactively re-locked by a later change upstream.
    const s = deriveGateStatuses(GATES, { g1: "failed", g3: "passed" });
    assert.equal(s.g3, "passed");
    assert.equal(s.g4, "open", "a passed g3 still opens g4");
  });

  test("an empty gate list yields an empty map", () => {
    assert.deepEqual(deriveGateStatuses([], {}), {} as Record<string, GateStatus>);
  });
});

describe("canResubmit", () => {
  const decided = "2026-10-01T00:00:00Z";

  test("a first failure may be resubmitted", () => {
    assert.equal(canResubmit(1, decided, new Date("2026-10-03T00:00:00Z")).allowed, true);
  });

  test("the attempt cap is hard", () => {
    const r = canResubmit(MAX_ATTEMPTS, decided, new Date("2026-10-02T00:00:00Z"));
    assert.equal(r.allowed, false);
    assert.equal(r.reason, "No attempts remaining");
  });

  test("exactly on the 7-day deadline is still allowed", () => {
    // 1 Oct + 7 days = 8 Oct. Boundary is inclusive.
    assert.equal(canResubmit(1, decided, new Date("2026-10-08T00:00:00Z")).allowed, true);
  });

  test("one second past the deadline is refused", () => {
    const r = canResubmit(1, decided, new Date("2026-10-08T00:00:01Z"));
    assert.equal(r.allowed, false);
    assert.equal(r.reason, "Resubmission window has closed");
  });

  test("with no decision recorded there is no window yet", () => {
    const r = canResubmit(0, null, new Date("2027-01-01T00:00:00Z"));
    assert.equal(r.allowed, true);
    assert.equal(r.deadline, undefined);
  });

  test("the returned deadline is exactly RESUBMIT_WINDOW_DAYS after the decision", () => {
    const r = canResubmit(1, decided, new Date("2026-10-02T00:00:00Z"));
    assert.equal(r.deadline?.toISOString(), "2026-10-08T00:00:00.000Z");
  });
});
