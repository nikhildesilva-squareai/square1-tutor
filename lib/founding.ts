// ─── Founding-cohort pricing ──────────────────────────────────────────────────
// Single source of truth for founding pricing. Read by:
//   - PricingSection (plan rows on the founding tier)
//   - SocialProofSection (founding-offer perk title)
//   - ComparisonSection (cost row)
//   - FAQSection (pricing answer + FAQPage structured data)
//
// Per-month rate depends on track length — longer commitment, lower rate.
// Founding members keep their rate for life.

export type FoundingPlan = {
  months: 3 | 6 | 9;
  perMonth: string;
  popular?: boolean;
};

export const FOUNDING_PLANS: FoundingPlan[] = [
  { months: 3, perMonth: "$29.90" },
  { months: 6, perMonth: "$19.90", popular: true },
  { months: 9, perMonth: "$15.90" },
];

// Cheapest per-month rate, for "from …" summaries.
export const FOUNDING_PRICE_FROM = "$15.90";

// Compact display string used where a single price is shown.
export const FOUNDING_PRICE: string | null = `from ${FOUNDING_PRICE_FROM}/mo`;
