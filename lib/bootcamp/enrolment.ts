// ═══════════════════════════════════════════════════════════════════════════════
// Enrolment state — pure, no imports beyond sibling pure modules.
//
// PAYMENT HAPPENS ON ACCEPTANCE, ONCE. There is no deposit and no instalment
// plan: an accepted applicant pays their tuition in a single charge, and until
// they do they are not enrolled.
//
// The consequence, which is the reason most of this file exists: acceptance
// itself is what holds a seat. An accepted applicant who never pays holds one of
// fifty forever, so an offer without a deadline is a slow leak in the only
// scarce resource the product has. Offers expire.
// ═══════════════════════════════════════════════════════════════════════════════

// NO IMPORTS. The pure layer is self-contained per file so `node --test` runs it
// with no bundler (same rule lib/competitions/metrics.ts follows). Prices are
// passed IN rather than read from ./pricing — which is better design regardless:
// enrolment logic should not know which price table it is reading.

/** Structurally satisfied by BOOTCAMP_PRICING[region].plans. */
export interface PlanPrices {
  full: number;
}

/** Pay in full, one payment. The three-part plan was removed on 2026-08-21 —
 *  the product takes a single payment and nothing else, so this is a union of
 *  one on purpose: it makes any surviving instalment assumption a type error. */
export type PaymentPlan = "full";

const DAY_MS = 86_400_000;

/** How long an offer stands. Long enough to talk to a partner or move money
 *  internationally; short enough that a seat is not parked for a month. */
export const OFFER_WINDOW_DAYS = 7;

/**
 * When an offer made now should expire.
 *
 * Clamped by two hard dates: applications close, and the cohort starts. An offer
 * that outlives either is a promise we cannot keep — you cannot join a cohort
 * after it has begun, and holding a seat past the close date blocks the waitlist
 * from being worked.
 */
export function offerExpiry(
  now: Date,
  applicationsCloseOn: string,
  startsOn: string,
): Date {
  const sevenDays = new Date(now.getTime() + OFFER_WINDOW_DAYS * DAY_MS);
  const close = new Date(`${applicationsCloseOn}T23:59:59Z`);
  const start = new Date(`${startsOn}T00:00:00Z`);
  return new Date(Math.min(sevenDays.getTime(), close.getTime(), start.getTime()));
}

export function isOfferLive(expiresAt: Date | string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return exp.getTime() > now.getTime();
}

/** Whole days left, rounded up, floored at 0. For "expires in 3 days" copy. */
export function daysLeftOnOffer(
  expiresAt: Date | string | null,
  now: Date = new Date(),
): number {
  if (!expiresAt) return 0;
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / DAY_MS));
}

// ─── What is owed ────────────────────────────────────────────────────────────



/** What must be paid before the student is enrolled at all. Tuition is a single
 *  charge, so this is simply the price. */
export function dueOnAcceptanceCents(prices: PlanPrices, _plan: PaymentPlan): number {
  return prices.full;
}

/** Total tuition. One payment, so this and dueOnAcceptanceCents agree by
 *  construction — kept as a separate name because the settlement check reads it
 *  to work out whether what ARRIVED covers what is OWED. */
export function planTotalCents(prices: PlanPrices, _plan: PaymentPlan): number {
  return prices.full;
}

/** Still outstanding after some payments have landed. Never negative: an
 *  overpayment is a refund conversation, not a negative balance on a screen. */
export function outstandingCents(
  prices: PlanPrices,
  plan: PaymentPlan,
  paidCents: number,
): number {
  return Math.max(0, planTotalCents(prices, plan) - paidCents);
}

export function isFullyPaid(
  prices: PlanPrices,
  plan: PaymentPlan,
  paidCents: number,
): boolean {
  return outstandingCents(prices, plan, paidCents) === 0;
}


// ─── Where an applicant stands ───────────────────────────────────────────────

export type EnrolmentStep =
  /** Applied; the assessment has not been recorded yet. */
  | { step: "awaiting_assessment" }
  /** Assessed; a human has not decided yet. */
  | { step: "awaiting_decision" }
  /** Accepted, offer live, nothing paid — the only state with a pay button. */
  | { step: "pay"; dueCents: number; daysLeft: number }
  /** Accepted but the offer ran out. The seat has gone back to the pool. */
  | { step: "offer_expired" }
  /** Paid and enrolled. Instalments may still be outstanding. */
  | { step: "enrolled"; outstandingCents: number }
  /** Waitlisted, rejected, withdrawn or deferred — nothing for them to do here. */
  | { step: "closed"; status: string };

/**
 * Resolve what the applicant should see and do next.
 *
 * One function so the status page, the desk and any future email all agree.
 * Three screens deriving this independently is how a student gets told to pay
 * for a seat that expired yesterday.
 */
export function enrolmentStep(
  input: {
    applicationStatus: string;
    offerExpiresAt: string | Date | null;
    assessmentRecorded: boolean;
    enrolled: boolean;
    prices: PlanPrices;
    plan: PaymentPlan;
    paidCents: number;
  },
  now: Date = new Date(),
): EnrolmentStep {
  if (input.enrolled) {
    return {
      step: "enrolled",
      outstandingCents: outstandingCents(input.prices, input.plan, input.paidCents),
    };
  }

  switch (input.applicationStatus) {
    case "submitted":
      return input.assessmentRecorded
        ? { step: "awaiting_decision" }
        : { step: "awaiting_assessment" };
    case "assessed":
      return { step: "awaiting_decision" };
    case "accepted":
      return isOfferLive(input.offerExpiresAt, now)
        ? {
            step: "pay",
            dueCents: dueOnAcceptanceCents(input.prices, input.plan),
            daysLeft: daysLeftOnOffer(input.offerExpiresAt, now),
          }
        : { step: "offer_expired" };
    default:
      return { step: "closed", status: input.applicationStatus };
  }
}
