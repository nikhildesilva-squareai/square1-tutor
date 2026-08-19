// ═══════════════════════════════════════════════════════════════════════════════
// Cohort availability — pure, no imports.
//
// "Can someone join this cohort?" is a five-state question, not a boolean, and
// collapsing it to one was a real bug: a cohort with all 50 seats free but
// applications not open until 15 September rendered as "This cohort is full".
// Telling a buyer the thing is gone when it has not started selling is the worst
// possible wrong answer — they leave and never come back.
//
// The structural CohortWindow type (rather than importing BootcampCohort from
// @/types/database) keeps this module alias-free so `node --test` runs it with no
// bundler. A full BootcampCohort satisfies it by shape.
// ═══════════════════════════════════════════════════════════════════════════════

export interface CohortWindow {
  seats: number;
  /** YYYY-MM-DD */
  applications_open_on: string;
  /** YYYY-MM-DD, inclusive — the last day someone may apply. */
  applications_close_on: string;
}

export type Availability =
  /** Applications are open and there is room. The only state with a CTA. */
  | { state: "open"; seatsLeft: number }
  /** A real cohort exists but selling has not started. */
  | { state: "not_open_yet"; opensOn: string; seatsLeft: number }
  /** The window has passed. The cohort may still run; you cannot join it. */
  | { state: "closed"; seatsLeft: number }
  /** Every seat is accounted for. Terminal — waiting will not help. */
  | { state: "full" }
  /** The track is listed but has no sellable cohort scheduled. */
  | { state: "no_cohort" };

/** Seats remaining. No offset parameter exists anywhere in this file, so there is
 *  nowhere to inflate scarcity (AD-08). */
export function seatsLeftFor(seats: number, accepted: number): number {
  return Math.max(0, seats - accepted);
}

/** Inclusive on both ends: someone applying on the closing day is in time. */
export function isWindowOpen(cohort: CohortWindow, today: Date): boolean {
  const day = toDayString(today);
  return day >= cohort.applications_open_on && day <= cohort.applications_close_on;
}

/** UTC calendar day. Dates in the DB are `date`, which has no zone — comparing
 *  them against a local-midnight string would shift the boundary by a day for
 *  anyone east or west of UTC. */
export function toDayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve what a visitor can actually do with this cohort.
 *
 * ORDER MATTERS and is deliberate:
 *   no_cohort  — nothing to reason about
 *   full       — checked BEFORE the window, because it is irreversible. A full
 *                cohort inside its window and a full cohort outside it are the
 *                same answer to the buyer: this one is gone.
 *   not_open_yet / closed — temporal, and recoverable by waiting or by the next
 *                intake, so they must never be reported as "full".
 *   open       — everything else.
 */
export function cohortAvailability(
  cohort: CohortWindow | null,
  accepted: number,
  today: Date,
): Availability {
  if (!cohort) return { state: "no_cohort" };

  const seatsLeft = seatsLeftFor(cohort.seats, accepted);
  if (seatsLeft === 0) return { state: "full" };

  const day = toDayString(today);
  if (day < cohort.applications_open_on) {
    return { state: "not_open_yet", opensOn: cohort.applications_open_on, seatsLeft };
  }
  if (day > cohort.applications_close_on) {
    return { state: "closed", seatsLeft };
  }
  return { state: "open", seatsLeft };
}

/** The single boolean the CTA hangs off. Everything else is messaging. */
export function isJoinable(a: Availability): boolean {
  return a.state === "open";
}

/** Seats to display, or null when there is nothing meaningful to show. */
export function displaySeatsLeft(a: Availability): number | null {
  switch (a.state) {
    case "open":
    case "not_open_yet":
    case "closed":
      return a.seatsLeft;
    case "full":
      return 0;
    case "no_cohort":
      return null;
  }
}
