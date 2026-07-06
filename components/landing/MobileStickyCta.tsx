"use client";

import { useEffect, useState } from "react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// Slim sticky bottom CTA — mobile only, slides in once the visitor scrolls past
// the hero. The landing page is 10+ sections long; on mobile the next action
// should never be more than a thumb-reach away.
// ═══════════════════════════════════════════════════════════════════════════════

export function MobileStickyCta({ seats = null }: { seats?: { left: number; cap: number } | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`sm:hidden fixed inset-x-0 bottom-0 z-40 px-4 pt-4 transition-transform duration-300 ${show ? "translate-y-0" : "translate-y-full pointer-events-none"}`}
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 35%, #FFFFFF 100%)",
      }}
    >
      {seats && (
        <p className="mb-1.5 text-center text-[10px] font-bold text-slate-600">
          {seats.left} of {seats.cap} free early-access seats left
        </p>
      )}
      <PrimaryCta href="/diagnostic" className="w-full">
        Free skill check — 3 min
      </PrimaryCta>
    </div>
  );
}
