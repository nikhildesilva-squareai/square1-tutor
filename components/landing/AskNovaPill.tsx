"use client";

import { useEffect, useState } from "react";

// Persistent, dismissible "Ask Nova" pill. Appears once the visitor scrolls past
// the hero and jumps them straight to the live Nova demo — so the single most
// engaging moment is always one tap away, at any scroll depth.
export function AskNovaPill() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // The landing scrolls inside <main> (overflow-x-hidden flips overflow-y:auto)
    const scroller: HTMLElement | Window = document.querySelector("main") ?? window;
    function onScroll() {
      const top = scroller instanceof Window ? window.scrollY : scroller.scrollTop;
      setVisible(top > 500);
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  function jumpToNova() {
    const el = document.getElementById("nova-demo");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus the demo input shortly after the scroll settles
      setTimeout(() => {
        const input = el.querySelector<HTMLInputElement>('input[placeholder="Ask Nova anything…"]');
        input?.focus();
      }, 600);
    }
  }

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <div className="relative flex items-center gap-2 pl-2 pr-3 py-2 rounded-full shadow-2xl"
        style={{ background: "linear-gradient(135deg,#0056CE,#7C3AED)", boxShadow: "0 12px 40px rgba(0,86,206,0.45)" }}>
        <button onClick={jumpToNova} className="flex items-center gap-2.5 group" aria-label="Ask Nova">
          <span className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black text-white">
            N
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B1626]" />
          </span>
          <span className="text-sm font-bold text-white pr-1">Ask Nova — it&apos;s live</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-5 h-5 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  );
}
