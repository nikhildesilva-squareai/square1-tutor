// ═══════════════════════════════════════════════════════════════════════════════
// Free early-access trial — config + window helper
//
// Lets the first N students take any course free (no card), for a fixed window,
// while Stripe is still being wired up. Two independent guardrails close it:
//   1. The CAP — once N students have claimed a free seat, no more are granted
//      (enforced atomically server-side via claim_free_trial_seat()).
//   2. The WINDOW — after ENDS_AT it closes automatically; no redeploy needed.
//
// Cost is bounded per student by the AI budget guardrail (lib/ai/budget.ts):
// each free claim gets an explicit $WALLET_USD trial wallet, then degrades to
// Haiku and hard-stops at 2x. Cap × ceiling = the absolute aggregate worst case.
//
// To turn it OFF early: set NEXT_PUBLIC_FREE_ACCESS_ENABLED=false (+ redeploy),
// or just let ENDS_AT pass. To extend: bump NEXT_PUBLIC_FREE_ACCESS_ENDS_AT.
// These are NEXT_PUBLIC_* (non-secret) so both server and client agree.
// ═══════════════════════════════════════════════════════════════════════════════

/** Master switch. Defaults ON — the date window is the real auto-kill. */
const ENABLED = process.env.NEXT_PUBLIC_FREE_ACCESS_ENABLED !== "false";

/** How many students may claim a free seat. */
export const FREE_ACCESS_CAP = Number(process.env.NEXT_PUBLIC_FREE_ACCESS_CAP ?? "100");

/** When the window closes (Australia/Sydney end-of-day). 2-week free test for
 *  100 students, opened 2026-06-26 → closes 2026-07-10. */
export const FREE_ACCESS_ENDS_AT =
  process.env.NEXT_PUBLIC_FREE_ACCESS_ENDS_AT ?? "2026-07-10T23:59:59+10:00";

// Per-student trial AI wallet, ring-fenced on claim (USD). Sized for ~2 weeks,
// not a full month — a full month is $1.20, so half is ~$0.60. NOTE: the budget
// guard degrades to Haiku between 1x and 2x the wallet and only hard-stops at
// 2x, so $0.60 here = ~$1.20 absolute worst case per student (realistic spend is
// well under that). Tune via env without a redeploy.
export const FREE_ACCESS_WALLET_USD = Number(
  process.env.NEXT_PUBLIC_FREE_ACCESS_WALLET_USD ?? "0.6",
);

/** True while the trial window is open (enabled + before the end date). */
export function freeWindowOpen(now: Date = new Date()): boolean {
  if (!ENABLED) return false;
  const ends = new Date(FREE_ACCESS_ENDS_AT);
  if (Number.isNaN(ends.getTime())) return false;
  return now < ends;
}
