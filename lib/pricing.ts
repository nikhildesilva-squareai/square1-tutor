// ═══════════════════════════════════════════════════════════════════════════════
// Regional (purchasing-power) pricing — single source of truth for RATES.
//
// A visitor's region is resolved ONCE at the edge: proxy.ts reads Vercel's
// x-vercel-ip-country and writes S1_REGION_COOKIE; every server component then
// reads the cookie (cheap, and a manual override just overwrites it).
//
// The commitment structure (3 / 6 / 9-month tracks, longer = cheaper per month)
// is identical in every region — only the rates differ. lib/founding.ts derives
// the display plans from here, so the pricing section, comparison table, FAQ,
// founding-offer card and skill-report close can never disagree.
//
// IMPORTANT — a displayed price is NOT an entitlement. IP geolocation is a hint
// (VPNs, travellers and corporate proxies all lie). Re-verify at checkout
// against the payment method's country before granting a discounted rate:
// see verifyRegionAtCheckout.
// ═══════════════════════════════════════════════════════════════════════════════

export const S1_REGION_COOKIE = "s1_region";

export type RegionKey = "global" | "south_asia";

export type RegionPricing = {
  key: RegionKey;
  label: string; // shown in the region selector
  /** Per-month rate by track length. Keys are the committed months. */
  rates: { 3: string; 6: string; 9: string };
  /** The list rate once founding seats close — the anchor the founding rates
   *  are measured against. Forward-looking (nobody pays it today): displayed
   *  as "standard rate after founding", never as a current charge. Raising
   *  this never touches a founding rate — those are promised for life. */
  standard: string;
};

// Prices are USD in every region for now: one Stripe currency keeps refunds,
// proration and revenue reporting simple. Local-currency DISPLAY can be layered
// on later without touching the region model.
export const REGIONS: Record<RegionKey, RegionPricing> = {
  global: {
    key: "global",
    label: "Global",
    rates: { 3: "$29.90", 6: "$19.90", 9: "$15.90" },
    standard: "$34.90",
  },
  // Purchasing-power rate — roughly a third of the global rate, which is the
  // band the large platforms settle on for these markets.
  south_asia: {
    key: "south_asia",
    label: "South Asia",
    rates: { 3: "$9.90", 6: "$6.90", 9: "$4.90" },
    standard: "$11.90",
  },
};

// ISO 3166-1 alpha-2 codes that get the purchasing-power rate. Explicit list
// (not a "developing markets" heuristic) so adding a country stays a
// deliberate, reviewable decision.
const SOUTH_ASIA_COUNTRIES = new Set([
  "IN", // India
  "LK", // Sri Lanka
  "PK", // Pakistan
  "NP", // Nepal
  "BD", // Bangladesh
  "BT", // Bhutan
  "MV", // Maldives
]);

/** Maps an ISO country code to a pricing region. Unknown/absent → global. */
export function regionForCountry(country: string | null | undefined): RegionKey {
  if (!country) return "global";
  return SOUTH_ASIA_COUNTRIES.has(country.toUpperCase()) ? "south_asia" : "global";
}

/** Narrows an untrusted string (cookie value, form field) to a real region. */
export function parseRegion(value: string | null | undefined): RegionKey | null {
  return value === "global" || value === "south_asia" ? value : null;
}

export function pricingFor(region: RegionKey): RegionPricing {
  return REGIONS[region] ?? REGIONS.global;
}

/**
 * Checkout-time guard. The region a visitor BROWSED in is advisory; the region
 * they may BUY in is decided by their payment method's country. Call this when
 * wiring Stripe: pass the billing country off the PaymentMethod plus the region
 * the client claims, and grant the lower rate only when the two agree.
 */
export function verifyRegionAtCheckout(
  claimedRegion: RegionKey,
  billingCountry: string | null | undefined,
): RegionKey {
  const entitled = regionForCountry(billingCountry);
  // Never grant a cheaper region than the billing country supports.
  if (claimedRegion === "south_asia" && entitled !== "south_asia") return "global";
  return claimedRegion;
}
