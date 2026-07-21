// Cookie-consent state, shared by the banner and any tag that must not fire
// without an explicit opt-in.
//
// NOTE the "_v2" key. Visitors who dismissed the previous banner were told
// "essential cookies only. No tracking, no ads." — a promise made before
// analytics existed. Reusing that key would silently reinterpret their old
// dismissal as consent to something they were never offered. The new key asks
// everyone once, under the terms that are actually true now.

export const CONSENT_KEY = "sq1_cookie_consent_v2";
export const CONSENT_EVENT = "sq1:consent";

/** "all" = essential + analytics. "essential" = essential only (the default). */
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
