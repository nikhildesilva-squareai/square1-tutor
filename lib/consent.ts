// Cookie-consent state, shared by the banner and any tag that must not fire
// without an explicit opt-in.
//
// NOTE the "_v3" key, and the same reasoning that produced _v2 before it.
//
// _v2 asked about ANALYTICS, in a banner that said "No ads" and named Google
// Analytics specifically. From 2026-08-06 the site also runs the Meta pixel and
// Conversions API, which is ad targeting rather than analytics. Anyone who
// clicked "Allow analytics" under the old wording consented to something
// materially narrower, so reusing _v2 would reinterpret their answer as
// permission they were never asked for. _v3 asks everyone once, under terms
// that are actually true.
//
// If the purposes widen again, bump the key again. It is a cheap re-prompt and
// the alternative is claiming consent nobody gave.

export const CONSENT_KEY = "sq1_cookie_consent_v3";
export const CONSENT_EVENT = "sq1:consent";

/** "all" = essential + analytics + advertising. "essential" = essential only. */
export type ConsentValue = "all" | "essential";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null; // storage blocked (private mode) → treat as undecided
  }
}

export function setConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* still fire the event so this page session honours the choice */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Analytics may only load on an explicit "all". Undecided is NOT consent. */
export function analyticsAllowed(): boolean {
  return readConsent() === "all";
}

/**
 * Ad-targeting tags (Meta pixel, Conversions API) may only fire on the same
 * explicit "all". Separate function on purpose: it reads at the call site as a
 * different permission, and if advertising ever gets its own toggle this is the
 * one line that changes rather than every tag on the site.
 */
export function advertisingAllowed(): boolean {
  return readConsent() === "all";
}
