import { cookies, headers } from "next/headers";
import {
  S1_REGION_COOKIE,
  parseRegion,
  regionForCountry,
  pricingFor,
  type RegionKey,
  type RegionPricing,
} from "@/lib/pricing";

// ═══════════════════════════════════════════════════════════════════════════════
// Server-side region resolution. Server components / route handlers only —
// cookies() and headers() are request-time APIs and opt a route into dynamic
// rendering, so only call this from routes that are already dynamic (the
// landing page is: it reads live course + seat data on every request).
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolves the visitor's pricing region, in priority order:
 *   1. the s1_region cookie — set by proxy.ts on first request, or by the
 *      visitor's own manual override (which must always win over IP geo)
 *   2. Vercel's IP geolocation header, as a same-request fallback for the very
 *      first hit if the cookie hasn't landed yet
 *   3. "global" — the safe default: never silently show a discounted price to
 *      someone we can't place.
 */
export async function getRegion(): Promise<RegionKey> {
  try {
    const jar = await cookies();
    const fromCookie = parseRegion(jar.get(S1_REGION_COOKIE)?.value);
    if (fromCookie) return fromCookie;

    const h = await headers();
    return regionForCountry(h.get("x-vercel-ip-country"));
  } catch {
    // Called from a context without a request (e.g. a static prerender) —
    // fall back to the default rather than throwing.
    return "global";
  }
}

/** Convenience: the resolved region plus its price table. */
export async function getRegionPricing(): Promise<{ region: RegionKey; pricing: RegionPricing }> {
  const region = await getRegion();
  return { region, pricing: pricingFor(region) };
}
