// ═══════════════════════════════════════════════════════════════════════════════
// Beginner on-ramp routing.
//
// The problem this solves: the diagnostic scores SUBJECT knowledge (five questions
// on ML, CV, security…) and bands the learner Novice→Expert. It has never asked
// whether they can write code. So a total beginner and a working developer who
// simply doesn't know computer vision are routed identically — both into a
// technical track whose "Module 0 — Foundations" quietly assumes prior coding
// (the CV one opens at `import numpy as np` with array slicing). The beginner
// discovers the gap by failing.
//
// A single self-report answer fixes what inference cannot: not knowing a subject
// and not being able to program are different things, and only the learner knows
// which applies.
//
// HARD RULE — this is a recommendation, never a gate. Every caller must render a
// visible way to continue into the chosen track regardless of the answer. Nothing
// here may block enrolment. Activation is the platform's weakest metric; a door
// that tells a new signup they aren't ready would cost more than it saves.
//
// Pure by design: no database, no React, no I/O — so it can be tested directly.
// ═══════════════════════════════════════════════════════════════════════════════

/** Slug of the beginner programming on-ramp course. */
export const ON_RAMP_SLUG = "programming-from-zero";

/** Auth-metadata key the answer is persisted under (mirrors onboarding_goal). */
export const CODING_EXPERIENCE_KEY = "coding_experience";

/** What the learner told us about their coding background. */
export type CodingExperience = "none" | "some" | "comfortable";

export interface OnRampRecommendation {
  /** Whether to surface the on-ramp. False = straight through, as today. */
  recommend: boolean;
  /** Slug to send them to when recommending, else null. */
  courseSlug: string | null;
  /** How strongly to put it — drives copy emphasis, never behaviour. */
  strength: "start-here" | "refresher" | "none";
  headline: string;
  body: string;
  /** Label for the always-present escape hatch. */
  skipLabel: string;
}

/**
 * Given what the learner said about their coding experience, decide whether to
 * recommend the on-ramp.
 *
 * `intendedTrackTitle` is the track they were heading for, used only to make the
 * copy concrete ("…before Computer Vision"). Omitting it is fine.
 */
export function recommendOnRamp(
  experience: CodingExperience,
  intendedTrackTitle?: string | null,
): OnRampRecommendation {
  const track = intendedTrackTitle?.trim() || null;
  const before = track ? ` before ${track}` : "";

  if (experience === "none") {
    return {
      recommend: true,
      courseSlug: ON_RAMP_SLUG,
      strength: "start-here",
      headline: "Start with Programming from Zero",
      body:
        `Every technical track opens with foundations that assume you can already read Python, use a terminal and commit with Git. This course teaches exactly those things from nothing — it is the missing first step${before}.`,
      skipLabel: track ? `Skip ahead to ${track}` : "Skip ahead and dive in",
    };
  }

  if (experience === "some") {
    return {
      recommend: true,
      courseSlug: ON_RAMP_SLUG,
      strength: "refresher",
      headline: "A quick refresher might save you time",
      body:
        `You said you have written a little code. Programming from Zero covers Python, the terminal, Git and arrays — skim the weeks you already know and slow down on the ones you do not${before ? `, then pick up${before}` : ""}.`,
      skipLabel: track ? `Go straight to ${track}` : "Go straight to a career track",
    };
  }

  return {
    recommend: false,
    courseSlug: null,
    strength: "none",
    headline: "",
    body: "",
    skipLabel: "",
  };
}

/** Type guard for values arriving from storage or auth metadata. */
export function isCodingExperience(value: unknown): value is CodingExperience {
  return value === "none" || value === "some" || value === "comfortable";
}
