// Runnable with the repo's built-in runner: `node --test` (no test framework
// dependency — matches the rest of __tests__/bootcamp/).
//
// NOT YET REGISTERED in package.json's `test:bootcamp` script — that file is off
// limits to the agent that wrote this. Add
//   __tests__/bootcamp/review.test.ts
// to the `test:bootcamp` list to wire it in.
//
// Every expected value below is hand-derived from the RULE, not from running the
// implementation. A test that asserts whatever the code currently returns proves
// nothing.
//
// WHAT THESE GUARD, in priority order:
//
//   1. THE STARTER DIFF. This is the reviewer's only real defence against work
//      that is not the student's. If `isUntouchedFork` ever stops firing on a
//      pristine template, a plagiarised submission looks exactly like an honest
//      one on the queue page.
//   2. SLA ORDERING. The 72h promise is only a promise if the longest-waiting
//      submission is the one a reviewer opens next. A sort that floats an
//      unsubmitted row to the top silently ages a student out.
//   3. MODULE UNLOCKS. "Strictly gated" is the product claim. A module named by
//      an uncleared gate must be shut, and — just as important — a module no
//      gate names must be open, or a bootcamp whose gates carry no
//      unlocks_module_ids would lock the entire curriculum.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  REVIEW_SLA_HOURS,
  REVIEW_DUE_SOON_HOURS,
  hoursWaiting,
  slaState,
  byLongestWaiting,
  medianHours,
  diffAgainstStarter,
  gateLockingModule,
  lockedModuleIds,
  modulesUnlockedBy,
  remediationSteps,
  type TreeEntry,
  type GateUnlock,
} from "../../lib/bootcamp/review.ts";

const NOW = new Date("2026-09-10T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

// ═══════════════════════════════════════════════════════════════════════════════
describe("SLA clock", () => {
  test("hours waiting is measured from submitted_at", () => {
    assert.equal(hoursWaiting(hoursAgo(30), NOW), 30);
  });

  test("nothing submitted has not started waiting", () => {
    assert.equal(hoursWaiting(null, NOW), 0);
  });

  test("a submitted_at in the future reads as zero, never negative", () => {
    // Clock skew between the app server and Postgres must not produce a row
    // that appears to have been reviewed before it was sent.
    const future = new Date(NOW.getTime() + 3_600_000).toISOString();
    assert.equal(hoursWaiting(future, NOW), 0);
  });

  test("the three SLA bands sit exactly on their boundaries", () => {
    assert.equal(slaState(0), "fresh");
    assert.equal(slaState(REVIEW_DUE_SOON_HOURS - 0.1), "fresh");
    assert.equal(slaState(REVIEW_DUE_SOON_HOURS), "due_soon");
    assert.equal(slaState(REVIEW_SLA_HOURS - 0.1), "due_soon");
    // 72h exactly is a breach, not the last fresh hour: the promise is "inside
    // 72 hours", so arriving AT 72 has already missed it.
    assert.equal(slaState(REVIEW_SLA_HOURS), "breached");
    assert.equal(slaState(200), "breached");
  });

  test("the SLA constant is 72 hours", () => {
    // Hardcoded on purpose. The number is a customer promise on the sales page,
    // so changing it should break a test and force a deliberate decision.
    assert.equal(REVIEW_SLA_HOURS, 72);
  });
});

describe("queue ordering", () => {
  test("longest waiting sorts first", () => {
    const rows = [
      { id: "recent", submittedAt: hoursAgo(2) },
      { id: "ancient", submittedAt: hoursAgo(90) },
      { id: "middling", submittedAt: hoursAgo(40) },
    ];
    const order = [...rows].sort(byLongestWaiting).map((r) => r.id);
    assert.deepEqual(order, ["ancient", "middling", "recent"]);
  });

  test("rows with no submitted_at sort LAST, never first", () => {
    // The failure mode this exists to prevent: treating null as epoch-zero,
    // which would park unsubmitted rows permanently at the top of the queue and
    // bury the student who has actually been waiting three days.
    const rows = [
      { id: "unsubmitted", submittedAt: null },
      { id: "waiting", submittedAt: hoursAgo(80) },
    ];
    const order = [...rows].sort(byLongestWaiting).map((r) => r.id);
    assert.deepEqual(order, ["waiting", "unsubmitted"]);
  });
});

describe("median wait", () => {
  test("odd sample takes the middle value", () => {
    assert.equal(medianHours([10, 1, 5]), 5);
  });

  test("even sample averages the two middles", () => {
    assert.equal(medianHours([1, 3, 5, 11]), 4);
  });

  test("an empty queue has NO median, not a median of zero", () => {
    // "0h median review time" on an empty queue reads as excellent performance.
    // It is the absence of data and must be rendered as such.
    assert.equal(medianHours([]), null);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe("diff against the starter", () => {
  // A blob SHA is a hash of the file's CONTENT, so identical SHAs across two
  // different repositories mean byte-identical files. That is the whole basis of
  // this comparison.
  const starter: TreeEntry[] = [
    { path: "README.md", sha: "aaa" },
    { path: "src/main.py", sha: "bbb" },
    { path: "tests/test_contract.py", sha: "ccc" },
    { path: "package-lock.json", sha: "lock1" },
  ];

  test("added, modified, removed and untouched are separated correctly", () => {
    const submitted: TreeEntry[] = [
      { path: "README.md", sha: "aaa" },            // untouched
      { path: "src/main.py", sha: "CHANGED" },      // modified
      { path: "src/model.py", sha: "new1" },        // added
      // tests/test_contract.py deleted
      { path: "package-lock.json", sha: "lock2" },  // noise — must be ignored
    ];
    const d = diffAgainstStarter(starter, submitted);

    assert.deepEqual(d.added, ["src/model.py"]);
    assert.deepEqual(d.modified, ["src/main.py"]);
    assert.deepEqual(d.removed, ["tests/test_contract.py"]);
    assert.deepEqual(d.untouched, ["README.md"]);
  });

  test("a lockfile rewrite is not student work", () => {
    // npm install rewrites package-lock.json on any machine. Counting that as a
    // modified file would make the untouched-fork signal fire almost never,
    // which is the same as not having it.
    const submitted: TreeEntry[] = [
      { path: "README.md", sha: "aaa" },
      { path: "src/main.py", sha: "bbb" },
      { path: "tests/test_contract.py", sha: "ccc" },
      { path: "package-lock.json", sha: "REGENERATED" },
    ];
    const d = diffAgainstStarter(starter, submitted);
    assert.deepEqual(d.modified, []);
    assert.equal(d.isUntouchedFork, true);
  });

  test("node_modules is ignored entirely", () => {
    const submitted: TreeEntry[] = [
      ...starter,
      { path: "node_modules/left-pad/index.js", sha: "vendored" },
    ];
    const d = diffAgainstStarter(starter, submitted);
    assert.deepEqual(d.added, []);
    assert.equal(d.isUntouchedFork, true);
  });

  test("an untouched template with nothing added is flagged", () => {
    // THE HIGHEST-VALUE ASSERTION IN THIS FILE. This is what a fork-and-commit
    // submission looks like, and the reviewer has to be told to open it.
    const d = diffAgainstStarter(starter, starter);
    assert.equal(d.isUntouchedFork, true);
    assert.equal(d.modified.length, 0);
    assert.equal(d.added.length, 0);
    assert.equal(d.touchedPct, 0);
  });

  test("adding new files alone clears the fork flag", () => {
    // Plenty of honest submissions never edit a starter file — they add their
    // own. That is work, and flagging it would train reviewers to ignore the
    // warning.
    const submitted: TreeEntry[] = [...starter, { path: "src/solution.py", sha: "mine" }];
    const d = diffAgainstStarter(starter, submitted);
    assert.equal(d.isUntouchedFork, false);
  });

  test("touchedPct is measured against the starter, not the submission", () => {
    // 3 non-noise starter files; 1 modified and 1 deleted = 2 touched.
    const submitted: TreeEntry[] = [
      { path: "README.md", sha: "aaa" },
      { path: "src/main.py", sha: "CHANGED" },
      { path: "package-lock.json", sha: "lock1" },
    ];
    const d = diffAgainstStarter(starter, submitted);
    assert.equal(Math.round(d.touchedPct), 67);
  });

  test("no starter to compare against is not 'changed nothing'", () => {
    const d = diffAgainstStarter([], [{ path: "a.py", sha: "x" }]);
    assert.equal(d.isUntouchedFork, false);
    assert.deepEqual(d.added, ["a.py"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe("module unlocks", () => {
  const gates: GateUnlock[] = [
    { id: "g1", title: "Foundations", cleared: true,  moduleIds: ["m2", "m3"] },
    { id: "g2", title: "Core craft",  cleared: false, moduleIds: ["m4", "m5"] },
    { id: "g3", title: "Squad build", cleared: false, moduleIds: ["m6"] },
  ];

  test("a module behind a cleared gate is open", () => {
    assert.equal(gateLockingModule(gates, "m2"), null);
  });

  test("a module behind an uncleared gate names that gate", () => {
    assert.equal(gateLockingModule(gates, "m4")?.id, "g2");
  });

  test("a module no gate claims is open", () => {
    // The load-bearing case: migration 024 seeds every gate with an EMPTY
    // unlocks_module_ids, so if unclaimed meant locked the whole curriculum
    // would be unreachable on day one.
    assert.equal(gateLockingModule(gates, "m1"), null);
  });

  test("with no gates at all, nothing is locked", () => {
    assert.equal(gateLockingModule([], "m4"), null);
    assert.deepEqual(lockedModuleIds([]), []);
  });

  test("when two gates claim a module the EARLIER uncleared one wins", () => {
    // The student has to clear that one first, so it is the one to send them to.
    const overlapping: GateUnlock[] = [
      { id: "g2", title: "Core craft",  cleared: false, moduleIds: ["mX"] },
      { id: "g3", title: "Squad build", cleared: false, moduleIds: ["mX"] },
    ];
    assert.equal(gateLockingModule(overlapping, "mX")?.id, "g2");
  });

  test("locked ids are the union across uncleared gates, deduplicated", () => {
    const locked = lockedModuleIds([
      ...gates,
      { id: "g4", title: "Capstone", cleared: false, moduleIds: ["m6", "m7"] },
    ]);
    assert.deepEqual([...locked].sort(), ["m4", "m5", "m6", "m7"]);
  });

  test("a cleared gate unlocks nothing further", () => {
    assert.equal(modulesUnlockedBy(gates[0]), 0);
    assert.equal(modulesUnlockedBy(gates[1]), 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe("remediation", () => {
  test("every unmet check produces a named step", () => {
    const steps = remediationSteps(["rubric", "attendance"]);
    assert.equal(steps.length, 2);
    assert.deepEqual(steps.map((s) => s.key), ["rubric", "attendance"]);
    for (const s of steps) {
      assert.ok(s.title.length > 0);
      assert.ok(s.detail.length > 0);
    }
  });

  test("steps keep the order of the unmet list", () => {
    const steps = remediationSteps(["ci", "lessons"]);
    assert.deepEqual(steps.map((s) => s.key), ["ci", "lessons"]);
  });

  test("no unmet checks means no remediation", () => {
    assert.deepEqual(remediationSteps([]), []);
  });

  test("an unknown key is dropped rather than rendered blank", () => {
    assert.deepEqual(remediationSteps(["not_a_check"]), []);
  });

  test("every check key evaluateGate can emit has a step", () => {
    // The contract between gates.ts and this file. If someone adds a new
    // requirement to evaluateGate and forgets the remediation copy, the student
    // gets a failed check with no instruction — exactly the score-and-silence
    // failure this whole section exists to prevent.
    const emitted = [
      "lessons", "projects", "rubric", "objective", "ci",
      "peer_reviews", "attendance", "authored_prs", "viva",
    ];
    assert.equal(remediationSteps(emitted).length, emitted.length);
  });

  test("no remediation step leaks a threshold number", () => {
    // Labels state DIRECTION, never the bar. A student who reads "needs 70%
    // attendance" knows precisely how much class they can skip.
    for (const step of remediationSteps([
      "lessons", "projects", "rubric", "objective", "ci",
      "peer_reviews", "attendance", "authored_prs", "viva",
    ])) {
      assert.ok(
        !/\d+\s*%/.test(step.detail),
        `remediation for "${step.key}" leaks a percentage: ${step.detail}`,
      );
    }
  });
});
