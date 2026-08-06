"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT, advertisingAllowed } from "@/lib/consent";

// ═══════════════════════════════════════════════════════════════════════════════
// Meta pixel — ad measurement for the paid social spend.
//
// Loads ONLY after an explicit "all" on the consent banner. Undecided is not
// consent, and "Essential only" is a refusal: neither loads anything. Mirrors
// components/GoogleAnalytics.tsx so there is one pattern for gated tags.
//
// The banner names Meta and no longer claims "No ads" — see lib/consent.ts for
// why the storage key was bumped to _v3 rather than reusing prior consent.
//
// Deliberately no Advanced Matching (no hashed email/phone sent from the
// browser). The pixel measures conversions; it does not need identity to do
// that, and shipping PII to an ad network by default is not a decision to make
// silently. Server-side CAPI can add matching later under the same consent.
// ═══════════════════════════════════════════════════════════════════════════════

const PIXEL_ID = process.env["NEXT_PUBLIC_META_PIXEL_ID"];

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function MetaPixel() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(advertisingAllowed());
    const onConsent = () => setAllowed(advertisingAllowed());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!PIXEL_ID || !allowed) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}

/**
 * Fire a standard Meta event. No-ops when the pixel never loaded — which is the
 * normal case for anyone who declined, so callers never need to check consent
 * themselves.
 *
 * `eventId` should be a stable id shared with the server-side Conversions API
 * call for the same action, so Meta deduplicates the pair instead of counting
 * the conversion twice.
 */
export function trackMeta(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}
