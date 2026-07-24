"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * First-party analytics — writes to the `events` table in our own Supabase
 * (INSERT-only RLS policy for browser clients; reads are service-role only,
 * consumed by the internal dashboard).
 *
 * - anonymous_id: stable per browser (localStorage)
 * - session_id:   rotates after 30 min idle (sessionStorage)
 * - session_start carries UTM params + external referrer (first-touch attribution)
 * - page_view on every route change
 * - identify links anonymous_id → student_id once per session after login
 *
 * Fire-and-forget: analytics must never break or slow the app.
 */

const IDLE_MS = 30 * 60 * 1000;

function uuid(): string {
  return crypto.randomUUID();
}

function getAnonymousId(): string {
  let id = localStorage.getItem("s1_aid");
  if (!id) {
    id = uuid();
    localStorage.setItem("s1_aid", id);
  }
  return id;
}

/** Returns the session id, creating a new session if idle-expired. */
function getSession(): { sessionId: string; isNew: boolean } {
  const now = Date.now();
  const last = Number(sessionStorage.getItem("s1_last") ?? 0);
  let sid = sessionStorage.getItem("s1_sid");
  let isNew = false;
  if (!sid || now - last > IDLE_MS) {
    sid = uuid();
    sessionStorage.setItem("s1_sid", sid);
    sessionStorage.removeItem("s1_identified");
    isNew = true;
  }
  sessionStorage.setItem("s1_last", String(now));
  return { sessionId: sid, isNew };
}

function utmFromUrl(): Record<string, string | null> {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_content: p.get("utm_content"),
    utm_term: p.get("utm_term"),
  };
}

function externalReferrer(): string | null {
  const r = document.referrer;
  if (!r) return null;
  try {
    return new URL(r).host === window.location.host ? null : r;
  } catch {
    return null;
  }
}

/** Coarse device class from the user agent — mobile / tablet / desktop. */
function deviceClass(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini/i.test(ua)) return "mobile";
  return "desktop";
}

export function FirstPartyAnalytics() {
  const pathname = usePathname();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    try {
      const supabase = (supabaseRef.current ??= createClient());
      const anonymous_id = getAnonymousId();
      const { sessionId: session_id, isNew } = getSession();

      const rows: Array<Record<string, unknown>> = [];

      if (isNew) {
        rows.push({
          anonymous_id,
          session_id,
          type: "session_start",
          path: pathname,
          referrer: externalReferrer(),
          device: deviceClass(),
          ...utmFromUrl(),
        });
      }

      rows.push({ anonymous_id, session_id, type: "page_view", path: pathname });

      void supabase
        .from("events")
        .insert(rows)
        .then(() => {
          // Identify once per session — SERVER-side. The old browser chain
          // (client getUser → RLS student select → client insert) never fired
          // once in production; the API route reads the auth cookie itself and
          // writes with the service role. getSession() is a local cookie read,
          // so anonymous visitors never generate a request.
          if (sessionStorage.getItem("s1_identified")) return;
          void supabase.auth.getSession().then(({ data }) => {
            if (!data.session) return;
            fetch("/api/track/identify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ anonymous_id, session_id, path: pathname }),
              keepalive: true,
            })
              .then((r) => r.json().catch(() => null))
              .then((res) => {
                // Only stop retrying once the link is actually written.
                if (res?.ok) sessionStorage.setItem("s1_identified", "1");
              })
              .catch(() => {});
          });
        });
    } catch {
      // analytics must never throw
    }
  }, [pathname]);

  return null;
}
