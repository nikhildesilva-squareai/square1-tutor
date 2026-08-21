// ═══════════════════════════════════════════════════════════════════════════════
// Enrolment state — pure, no imports beyond sibling pure modules.
//
// PAYMENT HAPPENS ON ACCEPTANCE. There is no deposit: an accepted applicant
// either pays in full or starts the three-part plan, and until they do they are
// not enrolled.
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
  threePart: readonly [number, number, number];
}

export type PaymentPlan = "full" | "three_part";

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

export interface Instalment {
  /** 1-based. Instalment 1 is what unlocks enrolment. */
  number: number;
  amountCents: number;
  /** Null for instalment 1 — it is due now, not on a date. */
  dueWeek: number | null;
}

/**
 * The payment schedule for a plan.
 *
 * Pay-in-full is one charge. The three-part plan is three, and they are all
 * collected by WEEK 8 — deliberately early, before dropout risk materialises, so
 * we are never chasing money from someone who has already disengaged.
 */
export function scheduleFor(prices: PlanPrices, plan: PaymentPlan): Instalment[] {
  if (plan === "full") {
    return [{ number: 1, amountCents: prices.full, dueWeek: null }];
  }
  const [first, second, third] = prices.threePart;
  return [
    { number: 1, amountCents: first,  dueWeek: null },
    { number: 2, amountCents: second, dueWeek: 4 },
    { number: 3, amountCents: third,  dueWeek: 8 },
  ];
}

/** What must be paid before the student is enrolled at all. */
export function dueOnAcceptanceCents(prices: PlanPrices, plan: PaymentPlan): number {
  return scheduleFor(prices, plan)[0].amountCents;
}

/** Total across the whole plan. Pay-in-full is genuinely cheaper — asserted in
 *  the pricing tests, not merely intended. */
export function planTotalCents(prices: PlanPrices, plan: PaymentPlan): number {
  return plan === "full"
    ? prices.full
    : prices.threePart.reduce((a, b) => a + b, 0);
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

/** The next instalment to collect, or null when nothing is owed. */
export function nextInstalment(
  prices: PlanPrices,
  plan: PaymentPlan,
  paidInstalments: number[],
): Instalment | null {
  const done = new Set(paidInstalments);
  return scheduleFor(prices, plan).find((i) => !done.has(i.number)) ?? null;
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

// ─── When the later instalments fall due ─────────────────────────────────────
//
// Payment is ONE-OFF CHECKOUT, deliberately: no card is stored and nothing is
// charged while the student is away. The cost of that choice is that instalments
// 2 and 3 will not collect themselves — somebody has to be asked. These
// functions are what the reminder cron and the status page both read, so a
// student is never emailed "payment 2 is due" by one and shown "nothing owed" by
// the other.

/** Days after an instalment falls due before access is suspended.
 *
 *  Long enough to cover a card that expired, a bank that blocked a foreign
 *  charge, or a week away from email — all ordinary, none of them a reason to
 *  lock someone out of a course they are halfway through. */
export const INSTALMENT_GRACE_DAYS = 10;

export type InstalmentState = "upcoming" | "due" | "overdue";

/** When an instalment falls due: its week, counted from the cohort start. */
export function instalmentDueDate(cohortStartsOn: string, dueWeek: number): Date {
  const start = new Date(`${cohortStartsOn}T00:00:00Z`);
  return new Date(start.getTime() + dueWeek * 7 * DAY_MS);
}

export function instalmentState(dueDate: Date, now: Date = new Date()): InstalmentState {
  if (now.getTime() < dueDate.getTime()) return "upcoming";
  const graceEnds = dueDate.getTime() + INSTALMENT_GRACE_DAYS * DAY_MS;
  return now.getTime() <= graceEnds ? "due" : "overdue";
}

export interface DueInstalment extends Instalment {
  dueDate: Date;
  state: InstalmentState;
  /** Whole days past the due date. 0 while upcoming. */
  daysLate: number;
}

/**
 * The next instalment still to collect, with its date and where it stands.
 *
 * Null when the plan is fully paid, or when the next instalment is number 1 —
 * that one is due on acceptance, has no week, and is governed by the OFFER
 * deadline rather than by the cohort calendar.
 */
export function nextDueInstalment(
  prices: PlanPrices,
  plan: PaymentPlan,
  paidInstalments: number[],
  cohortStartsOn: string,
  now: Date = new Date(),
): DueInstalment | null {
  const next = nextInstalment(prices, plan, paidInstalments);
  if (!next || next.dueWeek === null) return null;

  const dueDate = instalmentDueDate(cohortStartsOn, next.dueWeek);
  const state = instalmentState(dueDate, now);
  const daysLate = Math.max(
    0,
    Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS),
  );
  return { ...next, dueDate, state, daysLate };
}

/** Whether a missed instalment has run past its grace period. The cron suspends
 *  on this and nothing else — never on "is there a balance", which would catch
 *  every three-part student the day they enrol. */
export function shouldSuspendForNonPayment(
  prices: PlanPrices,
  plan: PaymentPlan,
  paidInstalments: number[],
  cohortStartsOn: string,
  now: Date = new Date(),
): boolean {
  const due = nextDueInstalment(prices, plan, paidInstalments, cohortStartsOn, now);
  return due?.state === "overdue";
}
