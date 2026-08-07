// ─── Founding-cohort pricing ──────────────────────────────────────────────────
// Display layer over lib/pricing.ts (which owns the regional RATES). Read by:
//   - PricingSection (plan rows on the founding tier)
//   - SocialProofSection (founding-offer perk title)
//   - ComparisonSection (cost row)
//   - FAQSection (pricing answer + FAQPage structured data)
//   - diagnostic results (the skill-report conversion close)
//
// Per-month rate depends on track length — longer commitment, lower rate — and
// on the visitor's pricing region (purchasing-power pricing). Founding members
// keep their rate for life.
//
// Every consumer takes a RegionKey so one page can never mix two regions'
// prices. Server components resolve it with getRegion() (lib/pricing-server.ts);
// client components receive it as a prop.

import { pricingFor, type RegionKey } from "@/lib/pricing";

export type FoundingPlan = {
  months: 3 | 6 | 9;
  perMonth: string;
  popular?: boolean;
};

/** The three commitment tiers, priced for the given region. */
export function foundingPlansFor(region: RegionKey): FoundingPlan[] {
  const { rates } = pricingFor(region);
  return [
    { months: 3, perMonth: rates[3] },
    { months: 6, perMonth: rates[6], popular: true },
    { months: 9, perMonth: rates[9] },
  ];
}

/** Cheapest per-month rate in the region, for "from …" summaries. */
export function foundingPriceFrom(region: RegionKey): string {
  return pricingFor(region).rates[9];
}

/** Compact display string used where a single price is shown. */
export function foundingPriceLabel(region: RegionKey): string {
  return `from ${foundingPriceFrom(region)}/mo`;
}

/** The list rate once founding closes — the anchor founding rates beat.
 *  Forward-looking only; nobody is charged this today. */
export function standardPriceFor(region: RegionKey): string {
  return pricingFor(region).standard;
}
