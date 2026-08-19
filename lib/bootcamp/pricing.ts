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
export type PaymentPlan = "full" | "three_part";

export interface PlanPricing {
  /** Charged once, up front. The promoted default. */
  full: number;
  /** Deposit, then two instalments. Deposit is credited to tuition. */
  threePart: readonly [number, number, number];
}

export interface RegionPricing {
  /** Forward-looking list rate. Nobody pays this during founding cohorts —
   *  shown struck through, never charged. */
  list: number;
  /** The real Cohort 1 price, and the base the 3-part plan sums to. */
  founding: number;
  plans: PlanPricing;
  currency: "USD";
}

/**
 * Cohort 1 founding rates.
 *
 * Pay-in-full is the DEFAULT and the promoted option: with a hard 50-seat cap,
 * commitment quality matters more than conversion rate. It also funds instructors
 * before delivery and removes Stripe Subscriptions, dunning and suspension logic.
 *
 * The 3-part plan exists so the regional price stays reachable — $441 up front can
 * be a month's salary for the exact career-switcher the regional rate is for. It is
 * fully collected by week 8, before dropout risk materialises.
 */
export const BOOTCAMP_PRICING: Record<PriceRegion, RegionPricing> = {
  global: {
    list: 1490_00,
    founding: 890_00,
    plans: { full: 799_00, threePart: [150_00, 370_00, 370_00] },
    currency: "USD",
  },
  south_asia: {
    list: 790_00,
    founding: 490_00,
    plans: { full: 441_00, threePart: [75_00, 208_00, 207_00] },
    currency: "USD",
  },
} as const;

/** Deposit — charged at acceptance, credited against tuition. Non-refundable
 *  after week 2, which is what makes ST-06 ("see exactly what is refundable")
 *  an honest promise rather than a vague one. */
export function depositCents(region: PriceRegion): number {
  return BOOTCAMP_PRICING[region].plans.threePart[0];
}

/** Total a 3-part payer hands over. Must equal the founding price — a plan that
 *  silently costs more is a dark pattern. */
export function threePartTotal(region: PriceRegion): number {
  return BOOTCAMP_PRICING[region].plans.threePart.reduce((a, b) => a + b, 0);
}

/** What paying up front saves, in cents. */
export function payInFullSavingCents(region: PriceRegion): number {
  return threePartTotal(region) - BOOTCAMP_PRICING[region].plans.full;
}

/** Saving as a whole-number percentage, for "save 10%" copy. */
export function payInFullSavingPct(region: PriceRegion): number {
  return Math.round((payInFullSavingCents(region) / threePartTotal(region)) * 100);
}

/** What this student will actually be charged, given their chosen plan. */
export function amountDueCents(region: PriceRegion, plan: PaymentPlan): number {
  return plan === "full"
    ? BOOTCAMP_PRICING[region].plans.full
    : threePartTotal(region);
}

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
