// ═══════════════════════════════════════════════════════════════════════════════
// Beginner placement.
//
// The problem this solves: the diagnostic scores SUBJECT knowledge (five
// questions on ML, CV, security…) and bands the learner Novice→Expert. It has
// never asked whether they can write code. So a total beginner and a working
// developer who simply doesn't know computer vision were routed identically,
// with nothing telling either of them where to start.
//
// Since 2026-07-28 the answer is inside the course rather than beside it: every
// technical track's Module 0 now opens with 18 lessons of programming from
// absolute zero (Python → data → functions and errors → environments → terminal
// and Git → NumPy arrays) before its domain refresher. So this no longer routes
// anyone to a different course — it tells them where in their OWN track to
// start, and lets the experienced skip ahead.
//
// HARD RULE — guidance, never a gate. Every caller must leave the learner free
// to start wherever they like. Nothing here may block enrolment or progress.
//
// Pure by design: no database, no React, no I/O — so it can be tested directly.
// ═══════════════════════════════════════════════════════════════════════════════

/** Auth-metadata key the answer is persisted under (mirrors onboarding_goal). */
export const CODING_EXPERIENCE_KEY = "coding_experience";

/** Lessons of programming-from-zero that now open every technical Module 0. */
export const PROGRAMMING_LESSON_COUNT = 18;

/** What the learner told us about their coding background. */
export type CodingExperience = "none" | "some" | "comfortable";

export interface StartGuidance {
  /** Whether to show guidance at all. False = nothing to say, go as normal. */
  show: boolean;
  /** Emphasis for the copy — never changes what the learner is allowed to do. */
  strength: "start-at-the-beginning" | "skim" | "none";
  headline: string;
  body: string;
  /** Label for the always-present alternative. */
  altLabel: string;
}

/**
 * Given what the learner said about their coding experience, tell them where in
 * their chosen track to begin.
 *
 * `trackTitle` is the course they are heading for, used only to make the copy
 * concrete. Omitting it is fine.
 */
export function guideStart(
  experience: CodingExperience,
  trackTitle?: string | null,
): StartGuidance {
  const track = trackTitle?.trim() || null;
  const named = track ? ` in ${track}` : "";

  if (experience === "none") {
    return {
      show: true,
      strength: "start-at-the-beginning",
      headline: "You are in the right place — start at Module 0",
      body:
        `Module 0${named} begins with ${PROGRAMMING_LESSON_COUNT} lessons of programming from nothing: your first program, variables, loops, functions, reading errors, the terminal, Git and arrays. No prior coding is assumed anywhere in it. Take lesson 1 and go in order.`,
      altLabel: "Browse the whole curriculum",
    };
  }

  if (experience === "some") {
    return {
      show: true,
      strength: "skim",
      headline: "Skim the opening, slow down where it gets unfamiliar",
      body:
        `Module 0${named} opens with programming fundamentals — Python, the terminal, Git and arrays — then moves into the domain foundations. Move quickly through what you already know; the later lessons on environments and arrays catch most people out.`,
      altLabel: "Browse the whole curriculum",
    };
  }

  return { show: false, strength: "none", headline: "", body: "", altLabel: "" };
}

/** Type guard for values arriving from storage or auth metadata. */
export function isCodingExperience(value: unknown): value is CodingExperience {
  return value === "none" || value === "some" || value === "comfortable";
}
