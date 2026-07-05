// ─── Founding-cohort pricing ──────────────────────────────────────────────────
// Single source of truth for the founding price shown on the landing page
// (SocialProofSection founding card + ComparisonSection cost row).
//
// Set this when B2C founding pricing is finalised, e.g. "A$29/mo".
// While null, the page keeps its price-free copy — but every surface that
// should show the number is already wired to this constant, so setting it
// here updates them all at once.
export const FOUNDING_PRICE: string | null = null;
