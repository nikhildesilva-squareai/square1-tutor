// ═══════════════════════════════════════════════════════════════════════════════
// Gate REVIEW — the reviewer's side of the gate. Pure, no DB, no I/O.
//
// lib/bootcamp/gates.ts answers "has this student met the bar". This file
// answers the three questions that come after:
//
//   1. HOW LONG has this submission been waiting, and is that a breach?
//      The 72h SLA is the promise that separates a paid cohort from a
//      self-paced course with a Discord. It is measured, not asserted.
//   2. WHAT DID THE STUDENT ACTUALLY WRITE? A gate submission is a repo made
//      from a starter template. Diffing the submitted tree against the starter
//      tree is the highest-signal artifact a reviewer has for spotting work
//      that is not the student's — a repo with zero modified starter files is
//      a fork, not a project.
//   3. WHAT DOES A FAILED STUDENT DO NEXT? A score is not feedback. Every
//      unmet check maps to a named, actionable step.
//
// Plus the module-unlock rule: a module named by an uncleared gate is locked.
// Progression is a derived fact about gate outcomes, never a row a student can
// write — same reasoning as bootcamp_gate_results being service-role only.
//
// IMPORT-FREE ON PURPOSE (house rule for lib/bootcamp/*): `node --test` runs
// these files directly with no bundler, so nothing here may import anything —
// not even a type from a sibling. Where a gate status is needed the caller
// passes a boolean it has already derived.
// ═══════════════════════════════════════════════════════════════════════════════

/** The review promise: a submission gets a human decision inside 72 hours.
 *  PRD S7 acceptance — "median submit→reviewed tracked against a 72h SLA". */
export const REVIEW_SLA_HOURS = 72;

/** Two thirds of the way through the window: still fine, but it is now the
 *  thing you should pick up next rather than the thing you can leave. */
export const REVIEW_DUE_SOON_HOURS = 48;

const HOUR_MS = 3_600_000;

export type SlaState = "fresh" | "due_soon" | "breached";

/** Hours a submission has been sitting unreviewed. Never negative: a clock skew
 *  that puts submitted_at in the future must not read as "reviewed early". */
export function hoursWaiting(
  submittedAt: Date | string | null,
  now: Date = new Date(),
): number {
  if (!submittedAt) return 0;
  const at = typeof submittedAt === "string" ? new Date(submittedAt) : submittedAt;
  const ms = now.getTime() - at.getTime();
  return ms <= 0 ? 0 : ms / HOUR_MS;
}

export function slaState(hours: number): SlaState {
  if (hours >= REVIEW_SLA_HOURS) return "breached";
  if (hours >= REVIEW_DUE_SOON_HOURS) return "due_soon";
  return "fresh";
}

/**
 * Queue order: longest wait first, so the SLA is what decides what a reviewer
 * opens next rather than whatever happens to be at the top of the page.
 *
 * Rows with no submitted_at sort LAST — an unsubmitted row has not started its
 * clock, and floating it above a student who has been waiting three days would
 * invert the whole point of the ordering.
 */
export function byLongestWaiting(
  a: { submittedAt: Date | string | null },
  b: { submittedAt: Date | string | null },
): number {
  const at = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
  const bt = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
  return at - bt;
}

/** Median of a sample. Null on an empty sample — reporting 0h median review
 *  time because nothing has been submitted yet is a lie the desk would act on. */
export function medianHours(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Starter diff ────────────────────────────────────────────────────────────

/** One file in a repo tree. `sha` is git's content hash, so the SAME sha in two
 *  different repositories means byte-identical content — which is what lets a
 *  diff be computed from two tree listings without downloading any files. */
export interface TreeEntry {
  path: string;
  sha: string;
}

export interface StarterDiff {
  /** Files the student added that the starter never had. Their actual work. */
  added: string[];
  /** Starter files whose content the student changed. */
  modified: string[];
  /** Starter files the student deleted. */
  removed: string[];
  /** Starter files returned byte-for-byte untouched. */
  untouched: string[];
  /** % of the starter's files the student touched at all (modified + removed). */
  touchedPct: number;
  /** Nothing in the starter was changed AND nothing new was added: this is a
   *  fork with a commit on it, not a submission. The single loudest signal in
   *  the queue — it is not proof of anything, it is a reason to look. */
  isUntouchedFork: boolean;
}

/**
 * Diff a submitted repo tree against the starter template it came from.
 *
 * Deliberately structural, not line-level: a reviewer needs "which files did
 * this person actually write" in one glance, and a 4,000-line unified diff is
 * not that. Line-level review is the AI reviewer's job and already happens in
 * lib/grading/project-review.ts.
 *
 * Lockfiles and other generated noise are excluded — an npm install rewrites
 * package-lock.json, and counting that as student work would make the "touched
 * nothing" signal useless.
 */
export function diffAgainstStarter(
  starter: TreeEntry[],
  submitted: TreeEntry[],
): StarterDiff {
  const starterMap = new Map<string, string>();
  for (const f of starter) {
    if (!isNoise(f.path)) starterMap.set(f.path, f.sha);
  }
  const submittedMap = new Map<string, string>();
  for (const f of submitted) {
    if (!isNoise(f.path)) submittedMap.set(f.path, f.sha);
  }

  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  const untouched: string[] = [];

  for (const [path, sha] of submittedMap) {
    const starterSha = starterMap.get(path);
    if (starterSha === undefined) added.push(path);
    else if (starterSha === sha) untouched.push(path);
    else modified.push(path);
  }
  for (const path of starterMap.keys()) {
    if (!submittedMap.has(path)) removed.push(path);
  }

  added.sort();
  modified.sort();
  removed.sort();
  untouched.sort();

  const starterCount = starterMap.size;
  const touched = modified.length + removed.length;
  // No starter to compare against means no percentage is meaningful. 0 would
  // read as "changed nothing", which is a different and much worse claim.
  const touchedPct = starterCount === 0 ? 0 : (touched / starterCount) * 100;

  return {
    added,
    modified,
    removed,
    untouched,
    touchedPct,
    isUntouchedFork: starterCount > 0 && touched === 0 && added.length === 0,
  };
}

/** Generated or vendored paths that say nothing about authorship. */
function isNoise(path: string): boolean {
  const lower = path.toLowerCase();
  const name = lower.split("/").pop() ?? "";
  if (
    lower.startsWith("node_modules/") ||
    lower.includes("/node_modules/") ||
    lower.startsWith(".git/") ||
    lower.startsWith("dist/") ||
    lower.startsWith("build/") ||
    lower.startsWith(".next/") ||
    lower.includes("__pycache__/")
  ) {
    return true;
  }
  return (
    name === "package-lock.json" ||
    name === "yarn.lock" ||
    name === "pnpm-lock.yaml" ||
    name === "poetry.lock" ||
    name === "cargo.lock" ||
    name === ".ds_store"
  );
}

// ─── Module unlocks ──────────────────────────────────────────────────────────

/** A gate, reduced to the only two facts unlocking cares about. `cleared` is
 *  derived by the caller from the gate status (passed OR waived). */
export interface GateUnlock {
  id: string;
  title: string;
  cleared: boolean;
  moduleIds: string[];
}

/**
 * Which gate, if any, is holding a module shut.
 *
 * A module is locked when an UNCLEARED gate names it. Modules no gate names are
 * always open — the spine gates the blocks it declares and nothing else, so a
 * bootcamp whose gates carry no unlocks_module_ids locks nothing rather than
 * locking everything.
 *
 * When two gates name the same module the EARLIER uncleared one wins, because
 * that is the one the student has to clear first and therefore the one to send
 * them to.
 */
export function gateLockingModule(
  orderedGates: GateUnlock[],
  moduleId: string,
): GateUnlock | null {
  for (const gate of orderedGates) {
    if (gate.cleared) continue;
    if (gate.moduleIds.includes(moduleId)) return gate;
  }
  return null;
}

/** Every module currently shut, across all uncleared gates. Deduplicated. */
export function lockedModuleIds(orderedGates: GateUnlock[]): string[] {
  const out = new Set<string>();
  for (const gate of orderedGates) {
    if (gate.cleared) continue;
    for (const id of gate.moduleIds) out.add(id);
  }
  return [...out];
}

/** How many modules clearing THIS gate would open — the concrete answer to
 *  "what do I get for passing", shown on the gate page. */
export function modulesUnlockedBy(gate: GateUnlock): number {
  return gate.cleared ? 0 : gate.moduleIds.length;
}

// ─── Remediation ─────────────────────────────────────────────────────────────

export interface RemediationStep {
  /** Matches the check `key` from evaluateGate. */
  key: string;
  title: string;
  detail: string;
}

/**
 * The "what do I do now" list for a student who has not cleared a gate.
 *
 * ST-34: a fail that returns a number and nothing else is the failure mode of
 * every automated grader — the student learns they are behind and not what to
 * do about it. Each step names an ACTION. None of them names a threshold: the
 * exact bar is a withheld answer key (see the header of gates.ts), and a
 * student who knows it optimises to it.
 */
export function remediationSteps(unmet: string[]): RemediationStep[] {
  const steps: RemediationStep[] = [];
  for (const key of unmet) {
    const step = REMEDIATION[key];
    if (step) steps.push({ key, ...step });
  }
  return steps;
}

const REMEDIATION: Record<string, { title: string; detail: string }> = {
  lessons: {
    title: "Finish the block's lessons",
    detail:
      "Some lessons in this block are still open. Work through them before you resubmit — the gate project assumes them.",
  },
  projects: {
    title: "Submit the gate project",
    detail:
      "This gate is anchored to a project. Submit it from this page; the review lands in your feedback thread.",
  },
  rubric: {
    title: "Raise the build against the rubric",
    detail:
      "Your review score is below the bootcamp bar. Read the per-criterion feedback in the thread — the lowest-scoring criterion is where the marks are.",
  },
  objective: {
    title: "Match the answer key",
    detail:
      "Your submitted output did not match the withheld key. This is a correctness failure, not a style one: re-run your tool and check the output format against the brief.",
  },
  ci: {
    title: "Get the contract tests green",
    detail:
      "The kit's unmodified contract tests are failing in GitHub Actions on your current HEAD. Fix them locally, push, and confirm the run is green before resubmitting.",
  },
  peer_reviews: {
    title: "Write your peer reviews",
    detail:
      "Reviewing is graded work on this programme. Complete the peer reviews assigned to you — reading someone else's code is the skill nobody teaches.",
  },
  attendance: {
    title: "Catch up on the live sessions",
    detail:
      "Your attendance is short for this block. Watching the recording counts for half a live session, so a missed week is recoverable — watch what you missed.",
  },
  authored_prs: {
    title: "Author your own pull requests",
    detail:
      "On a squad gate your individual contribution is audited from GitHub. Open and merge your own pull requests — nobody clears this gate on a teammate's work.",
  },
  viva: {
    title: "Sit your viva",
    detail:
      "This gate needs a recorded viva. It is scheduled by the teaching team, not by you — it will appear on your cohort calendar once your build is in.",
  },
};
