"use client";

import { useEffect, useRef, useState } from "react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// Slim sticky bottom CTA — mobile only, slides in once the visitor scrolls past
// the hero. The landing page is 10+ sections long; on mobile the next action
// should never be more than a thumb-reach away.
// ═══════════════════════════════════════════════════════════════════════════════


// Seat counter rolls cap -> left when the bar first reveals (21st.dev
// "animated counter" pattern) - dramatizes the REAL claimed count, no
// invented events. Runs once; reduced-motion gets the final value instantly.
function useSeatRoll(target: number, from: number, run: boolean) {
  const [v, setV] = useState(from);
  const done = useRef(false);
  useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, from]);
  return v;
}

export function MobileStickyCta({ seats = null }: { seats?: { left: number; cap: number } | null }) {
  const [show, setShow] = useState(false);
  const rolledLeft = useSeatRoll(seats?.left ?? 0, seats?.cap ?? 0, show && seats !== null);

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
          {rolledLeft} of {seats.cap} compute-capped free seats left
        </p>
      )}
      <PrimaryCta href="/diagnostic" className="w-full">
        Free skill check — 3 min
      </PrimaryCta>
    </div>
  );
}
