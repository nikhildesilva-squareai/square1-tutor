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

const IDLE_MS = 30 * 60 * 1000;

function uuid() { return crypto.randomUUID(); }

function ids(): { anonymous_id: string; session_id: string } {
  let aid = localStorage.getItem("s1_aid");
  if (!aid) { aid = uuid(); localStorage.setItem("s1_aid", aid); }
  const now = Date.now();
  const last = Number(sessionStorage.getItem("s1_last") ?? 0);
  let sid = sessionStorage.getItem("s1_sid");
  if (!sid || now - last > IDLE_MS) { sid = uuid(); sessionStorage.setItem("s1_sid", sid); }
  sessionStorage.setItem("s1_last", String(now));
  return { anonymous_id: aid, session_id: sid };
}

export function LandingEngagement() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let cleanup = () => {};
    try {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-s1-section]"));
      if (sections.length === 0) return;

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

      // Scroll depth (rAF-throttled).
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const doc = document.documentElement;
          const denom = doc.scrollHeight;
          if (denom > 0) {
            const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / denom) * 100));
            if (depth > maxDepth) maxDepth = depth;
          }
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

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

        try {
          const blob = new Blob([JSON.stringify({ events })], { type: "application/json" });
          if (navigator.sendBeacon) navigator.sendBeacon("/api/track", blob);
          else void fetch("/api/track", { method: "POST", body: blob, keepalive: true });
        } catch { /* ignore */ }
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
