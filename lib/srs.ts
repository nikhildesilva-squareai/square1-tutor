// ─── Spaced repetition (SM-2-lite) ──────────────────────────────────────────
// Lightweight take on the SuperMemo-2 algorithm. Three self-grades map to a
// quality signal; we adjust an ease factor and grow the interval from it.
//
//   hard  → relearn tomorrow, ease drops, streak resets
//   good  → standard step, ease unchanged
//   easy  → longer step, ease rises
//
// State lives on the study_notes row: ease_factor, interval_days, review_count
// (the success streak), next_review_at, last_reviewed_at.

export type Grade = "hard" | "good" | "easy";

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
}

export interface SrsResult extends SrsState {
  nextReviewAt: string;      // ISO timestamp
}

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 86_400_000;

/**
 * Compute the next schedule for a card given the learner's self-grade.
 * `now` is injectable for deterministic tests; defaults to wall clock.
 */
export function schedule(prev: SrsState, grade: Grade, now: number = Date.now()): SrsResult {
  let easeFactor = Number.isFinite(prev.easeFactor) && prev.easeFactor > 0 ? prev.easeFactor : 2.5;
  let intervalDays = Math.max(0, prev.intervalDays || 0);
  let reviewCount = Math.max(0, prev.reviewCount || 0);

  if (grade === "hard") {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    reviewCount = 0;        // lapse — restart the ladder
    intervalDays = 1;       // see it again tomorrow
  } else {
    if (grade === "easy") easeFactor = Math.min(MAX_EASE, easeFactor + 0.15);
    reviewCount += 1;

    // Fixed early steps, then grow geometrically by ease.
    if (reviewCount === 1) intervalDays = grade === "easy" ? 3 : 1;
    else if (reviewCount === 2) intervalDays = grade === "easy" ? 7 : 3;
    else intervalDays = Math.round(intervalDays * easeFactor * (grade === "easy" ? 1.3 : 1));
  }

  intervalDays = Math.max(1, intervalDays);
  const nextReviewAt = new Date(now + intervalDays * DAY_MS).toISOString();

  return { easeFactor, intervalDays, reviewCount, nextReviewAt };
}

/** Short human label for when a card will next surface, e.g. "1 day", "2 weeks". */
export function intervalLabel(days: number): string {
  if (days <= 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return w === 1 ? "1 week" : `${w} weeks`;
  }
  const m = Math.round(days / 30);
  return m === 1 ? "1 month" : `${m} months`;
}
