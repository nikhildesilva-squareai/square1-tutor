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
