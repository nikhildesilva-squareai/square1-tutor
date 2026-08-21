// ═══════════════════════════════════════════════════════════════════════════════
// Bootcamp pricing — a SEPARATE SKU. Pure, no imports.
//
// lib/pricing.ts REGIONS is never touched by this file. Those are the self-paced
// founding rates, promised for life; a bootcamp is a different product with a
// different cost structure and must not perturb them.
//
// WHY THE ⅓ PPP RATIO FROM lib/pricing.ts IS NOT USED HERE
//
// That ratio is correct for software with ~zero marginal cost. A bootcamp carries
// roughly $655 of instructor time per student, so a ⅓ regional rate would sell
// below cost. The regional price works only when paired with a regionally-hired
// instructor (~$15/h -> ~$280/student). The ratio here is ~0.55, not 0.33, and
// that is deliberate.
//
// Amounts are integer CENTS. Never floats — a rounding error in money is a
// support ticket and a chargeback.
// ═══════════════════════════════════════════════════════════════════════════════

export type PriceRegion = "global" | "south_asia";
/** Pay in full, one payment. See lib/bootcamp/enrolment.ts. */
export type PaymentPlan = "full";

export interface PlanPricing {
  /** Charged once, up front. The only option — see the note on BOOTCAMP_PRICING. */
  full: number;
}

export interface RegionPricing {
  /** Forward-looking list rate. Nobody pays this during founding cohorts —
   *  shown struck through, never charged. */
  list: number;
  /** The undiscounted Cohort 1 rate. Retained as the reference the PRD quotes;
   *  NOT displayed anywhere and NOT charged — `plans.full` is the real price. */
  founding: number;
  plans: PlanPricing;
  currency: "USD";
}

/**
 * Cohort 1 founding rates.
 *
 * ONE PAYMENT, ONE PRICE. The three-part plan was removed on 2026-08-21: tuition
 * is a single charge and nothing follows it. That deletes instalment scheduling,
 * reminder mail, dunning and payment-failure suspension along with it — a whole
 * class of ways to get someone's money wrong, gone rather than merely handled.
 *
 * With a hard 50-seat cap, commitment quality matters more than conversion rate,
 * and paying up front funds instructors before delivery rather than after.
 *
 * The cost of the decision, stated plainly: $441 up front can be a month's
 * salary for exactly the career-switcher the regional rate exists for. The
 * regional price is the answer to that, and it is the only answer we now offer.
 */
export const BOOTCAMP_PRICING: Record<PriceRegion, RegionPricing> = {
  global: {
    list: 1490_00,
    founding: 890_00,
    plans: { full: 799_00 },
    currency: "USD",
  },
  south_asia: {
    list: 790_00,
    founding: 490_00,
    plans: { full: 441_00 },
    currency: "USD",
  },
} as const;






/** Cents -> "$890" or "$1,490". No trailing ".00": prices here are always whole
 *  dollars, and "$890.00" reads like a utility bill. */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  const whole = Number.isInteger(dollars);
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Resolve a display region from a country code.
 *
 * IMPORTANT: this is for DISPLAY only. A displayed price is not an entitlement —
 * IP geolocation is a hint that VPNs, travellers and corporate proxies all defeat.
 * At a ~$350 gap the arbitrage is worth someone's time, so checkout must re-verify
 * against the payment method's country before granting the regional rate.
 */
const SOUTH_ASIA = new Set(["IN", "LK", "PK", "BD", "NP", "BT", "MV"]);

export function regionForCountry(country: string | null | undefined): PriceRegion {
  if (!country) return "global";
  return SOUTH_ASIA.has(country.toUpperCase()) ? "south_asia" : "global";
}
