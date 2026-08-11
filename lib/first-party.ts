// ═══════════════════════════════════════════════════════════════════════════════
// First-party event helper — shared by LandingEngagement, the skill-check flow
// and the results page. One anonymous id per browser, one session id per
// 30-minute-idle window (same keys LandingEngagement has always used, so
// sessions stay continuous across the old and new call sites).
//
// fpTrack() is fire-and-forget over sendBeacon: it must never throw, never
// block, and silently no-op outside production.
// ═══════════════════════════════════════════════════════════════════════════════

const IDLE_MS = 30 * 60 * 1000;

export function fpIds(): { anonymous_id: string; session_id: string } {
  let aid = localStorage.getItem("s1_aid");
  if (!aid) { aid = crypto.randomUUID(); localStorage.setItem("s1_aid", aid); }
  const now = Date.now();
  const last = Number(sessionStorage.getItem("s1_last") ?? 0);
  let sid = sessionStorage.getItem("s1_sid");
  if (!sid || now - last > IDLE_MS) { sid = crypto.randomUUID(); sessionStorage.setItem("s1_sid", sid); }
  sessionStorage.setItem("s1_last", String(now));
  return { anonymous_id: aid, session_id: sid };
}

export function fpTrack(type: string, label?: string, value?: number) {
  try {
    if (process.env.NODE_ENV !== "production") return;
    if (isLikelyBot()) return; // funnel events are meaningless for crawlers
    const { anonymous_id, session_id } = fpIds();
    const event: Record<string, unknown> = {
      anonymous_id, session_id, type, path: window.location.pathname,
    };
    if (label != null) event.label = label;
    if (value != null) event.value = value;
    const blob = new Blob([JSON.stringify({ events: [event] })], { type: "application/json" });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", blob);
    else void fetch("/api/track", { method: "POST", body: blob, keepalive: true });
  } catch { /* analytics must never throw */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Bot detection (2026-08-11).
//
// These analytics are written from the browser, so only JS-EXECUTING clients
// ever reach the table — and in August 2026 most of them were crawlers. One day
// recorded 1,491 "tablet" sessions against 14 desktop, with ~1,940 landing on /
// and going nowhere, which is not a shape human audiences take. Every rate
// computed against that denominator was noise.
//
// Detection is deliberately CONSERVATIVE. A false positive silently deletes a
// real person from the numbers, which is worse than letting a crawler through,
// so each signal below is either self-declared or physically impossible for a
// real device. Result is cached per page load — this runs on every event.
// ═══════════════════════════════════════════════════════════════════════════════

const BOT_UA =
  /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|chrome-lighthouse|bingpreview|facebookexternalhit|embedly|scrapy|curl|wget|python-requests|axios|go-http-client|java\/|okhttp|apache-httpclient|monitor|uptime|pingdom|statuscake/i;

let botCache: boolean | null = null;

export function isLikelyBot(): boolean {
  if (botCache !== null) return botCache;
  try {
    const ua = navigator.userAgent || "";

    // 1. Self-declared crawlers and automation runtimes.
    if (BOT_UA.test(ua)) return (botCache = true);

    // 2. WebDriver flag — set by Playwright/Puppeteer/Selenium unless masked.
    if (navigator.webdriver === true) return (botCache = true);

    // 3. A UA claiming a phone or tablet on hardware with no touch input. Real
    //    touch devices always report maxTouchPoints > 0; this contradiction is
    //    the signature behind the tablet-heavy spike.
    const claimsTouchDevice = /Mobi|Android|iPhone|iPad|iPod|Tablet|Silk|PlayBook/i.test(ua);
    if (claimsTouchDevice && (navigator.maxTouchPoints ?? 0) === 0) return (botCache = true);

    // 4. No painted window — a headless tell that survives UA spoofing.
    if (window.outerWidth === 0 || window.outerHeight === 0) return (botCache = true);

    return (botCache = false);
  } catch {
    // Never let detection itself break a page; assume human when unsure.
    return (botCache = false);
  }
}
