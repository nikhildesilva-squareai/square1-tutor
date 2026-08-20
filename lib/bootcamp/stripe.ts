import Stripe from "stripe";

// ═══════════════════════════════════════════════════════════════════════════════
// Stripe wiring for bootcamp tuition.
//
// EVERYTHING HERE DEGRADES TO "NOT CONFIGURED" RATHER THAN THROWING. The keys
// are not in the project yet, and a missing key must not turn the whole product
// into a 500 — the desk can still take a bank transfer and mark it paid. Callers
// check stripeConfigured() and fall back to the manual path.
//
// NOT part of the pure lib layer: it imports the SDK, so it is never loaded by
// `node --test`. Anything worth unit-testing belongs in enrolment.ts instead.
// ═══════════════════════════════════════════════════════════════════════════════

let cached: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

export function webhookSecretConfigured(): boolean {
  return Boolean(process.env["STRIPE_WEBHOOK_SECRET"]);
}

/** The client, or null when the key is absent. Never throws on a missing key. */
export function getStripe(): Stripe | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      // Pinned deliberately. An SDK upgrade silently changing the API version is
      // how a webhook payload shape shifts under a running integration.
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return cached;
}

/**
 * The billing country Stripe actually saw, or null.
 *
 * This is the ONLY country that may decide the regional rate. The country on a
 * student profile is self-declared, and the gap between the global and South
 * Asia price is roughly $400 — enough to be worth someone editing a profile
 * field. See verifyRegionAtCheckout() in lib/pricing.ts, which this feeds.
 */
export function billingCountryFrom(
  session: Stripe.Checkout.Session,
): string | null {
  const details = session.customer_details;
  return details?.address?.country ?? null;
}

/** Absolute URL for Stripe redirects. Stripe rejects relative paths. */
export function siteUrl(path: string): string {
  const base =
    process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://www.square1ai.com";
  return `${base.replace(/\/$/, "")}${path}`;
}
