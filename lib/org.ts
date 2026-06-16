// Shared org/team constants + helpers.

// Per-seat monthly rate by team size (volume-discounted). Mirrors the published
// /business pricing. Billing is FREE during early access; these are shown for
// reference and used once Stripe is wired.
export function seatRate(seats: number): number {
  if (seats <= 5) return 39;
  if (seats <= 15) return 32;
  if (seats <= 30) return 26;
  return 20; // 31–50
}

export function tierName(seats: number): string {
  if (seats <= 5) return "Starter";
  if (seats <= 15) return "Team";
  if (seats <= 30) return "Growth";
  return "Scale";
}

export const MAX_SELF_SERVE_SEATS = 50; // 50+ → contact sales

// ─── Billing intervals ──────────────────────────────────────────────────────
export type BillingInterval = "monthly" | "annual";

// seatRate() above is the ANNUAL plan's per-seat MONTHLY price (billed yearly).
// Month-to-month costs ~30% more per seat, so committing annually visibly
// "saves ~3 months". One markup constant keeps the two in sync.
const MONTHLY_MARKUP = 1.3;

export function monthlySeatRate(seats: number): number {
  return Math.round(seatRate(seats) * MONTHLY_MARKUP);
}

// Per-seat monthly price to display for the chosen interval.
export function ratePerSeat(seats: number, interval: BillingInterval): number {
  return interval === "annual" ? seatRate(seats) : monthlySeatRate(seats);
}

// What's actually charged at checkout for the interval:
//   annual  → per-seat/mo × seats × 12  (one yearly charge)
//   monthly → per-seat/mo × seats        (charged each month)
export function billedTotal(seats: number, interval: BillingInterval): number {
  return interval === "annual"
    ? seatRate(seats) * seats * 12
    : monthlySeatRate(seats) * seats;
}

// Dollars saved over a year by paying annually vs month-to-month for 12 months.
export function annualSavings(seats: number): number {
  return (monthlySeatRate(seats) - seatRate(seats)) * seats * 12;
}
