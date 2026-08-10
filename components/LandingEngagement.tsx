"use client";

import { useEffect } from "react";

/**
 * Landing-page engagement tracking — answers "which section holds attention?"
 * and "how far down do people scroll before leaving?".
 *
 * - Observes every [data-s1-section] block and accrues real attention time
 *   (only while the section is meaningfully in view AND the tab is visible).
 * - Tracks the deepest scroll reached.
 * - Flushes via navigator.sendBeacon → /api/track on tab-hide / page-leave, so
 *   it survives the user closing the tab. Increments are sent since the last
 *   flush (server sums them); scroll depth is sent as the running max (server
 *   takes the max per session).
 *
 * Production only, fire-and-forget — never throws, never blocks the page.
 */

import { fpIds as ids } from "@/lib/first-party";

export function LandingEngagement() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let cleanup = () => {};
    try {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-s1-section]"));
      if (sections.length === 0) return;

      // One transport for everything below — sendBeacon so events survive
      // navigation/tab-close; fetch keepalive as the fallback.
      const beacon = (events: Array<Record<string, unknown>>) => {
        try {
          const blob = new Blob([JSON.stringify({ events })], { type: "application/json" });
          if (navigator.sendBeacon) navigator.sendBeacon("/api/track", blob);
          else void fetch("/api/track", { method: "POST", body: blob, keepalive: true });
        } catch { /* ignore */ }
      };

      const accumMs = new Map<string, number>();   // time since last flush
      const enterAt = new Map<string, number>();    // when the section started attending (0 = not)
      const attending = new Set<string>();          // currently in view + attended
      let maxDepth = 0;

      const nameOf = (el: HTMLElement) => el.dataset.s1Section || "unknown";

      const settle = (name: string) => {
        const start = enterAt.get(name) ?? 0;
        if (start > 0) {
          accumMs.set(name, (accumMs.get(name) ?? 0) + (Date.now() - start));
          enterAt.set(name, 0);
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            const name = nameOf(en.target as HTMLElement);
            const tallerThanViewport = en.boundingClientRect.height >= window.innerHeight * 0.85;
            const isAttending = en.isIntersecting && (en.intersectionRatio >= 0.4 || tallerThanViewport);
            if (isAttending) {
              attending.add(name);
              if (!enterAt.get(name) && document.visibilityState === "visible") enterAt.set(name, Date.now());
            } else {
              attending.delete(name);
              settle(name);
            }
          }
        },
        { threshold: [0, 0.4, 0.75, 1] },
      );
      sections.forEach((s) => io.observe(s));

      // Scroll depth (rAF-throttled). Audit R7: depth used to be reported only
      // on the leave-flush, which collapsed the metric to "100 or nothing" —
      // now each 25/50/75/100 threshold crossing beacons immediately, so the
      // distribution of how far people actually get is measurable again.
      let raf = 0;
      let sentThreshold = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const doc = document.documentElement;
          const denom = doc.scrollHeight;
          if (denom > 0) {
            const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / denom) * 100));
            if (depth > maxDepth) maxDepth = depth;
            const threshold = depth >= 100 ? 100 : depth >= 75 ? 75 : depth >= 50 ? 50 : depth >= 25 ? 25 : 0;
            if (threshold > sentThreshold) {
              sentThreshold = threshold;
              beacon([{ ...ids(), type: "scroll_depth", path: window.location.pathname, value: threshold }]);
            }
          }
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      // CTA clicks (audit R7 — there were NO click events at all). Delegated:
      // any click that lands on a link into the skill-check funnel is recorded
      // with the section it came from, so "which section converts" is finally
      // a queryable number. sendBeacon survives the navigation.
      const onClick = (e: MouseEvent) => {
        try {
          const a = (e.target as HTMLElement | null)?.closest?.('a[href^="/skill-check"], a[href^="/diagnostic"]');
          if (!a) return;
          const section = (a.closest("[data-s1-section]") as HTMLElement | null)?.dataset.s1Section ?? "page";
          beacon([{ ...ids(), type: "cta_click", path: window.location.pathname, label: section }]);
        } catch { /* never interfere with the click */ }
      };
      document.addEventListener("click", onClick, true);

      const flush = () => {
        // Settle any actively-attending sections first.
        for (const name of attending) settle(name);

        const path = window.location.pathname;
        const { anonymous_id, session_id } = ids();
        const events: Array<Record<string, unknown>> = [];
        for (const [name, ms] of accumMs) {
          const secs = Math.round(ms / 1000);
          if (secs >= 1) { events.push({ anonymous_id, session_id, type: "section_time", path, label: name, value: secs }); accumMs.set(name, 0); }
        }
        if (maxDepth > 0) events.push({ anonymous_id, session_id, type: "scroll_depth", path, value: maxDepth });
        if (events.length === 0) return;
        beacon(events);
      };

      const onVisibility = () => {
        if (document.visibilityState === "hidden") {
          flush();
        } else {
          // Resume timing for whatever is still in view.
          for (const name of attending) enterAt.set(name, Date.now());
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", flush);

      cleanup = () => {
        flush();
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", flush);
        if (raf) cancelAnimationFrame(raf);
      };
    } catch {
      /* analytics must never throw */
    }
    return () => cleanup();
  }, []);

  return null;
}
