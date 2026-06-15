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
