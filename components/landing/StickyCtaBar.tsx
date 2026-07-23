"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";

// ═══════════════════════════════════════════════════════════════════════════════
// Sticky top CTA bar — desktop only (mobile has the bottom MobileStickyCta).
// On a 10+ section page the primary action otherwise vanishes for long
// stretches; this keeps the one conversion action + the live seat scarcity a
// single click away for the entire scroll. Slides in only after the visitor
// has passed the hero, so it never competes with the hero's own CTA.
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

export function StickyCtaBar({ seats = null }: { seats?: { left: number; cap: number } | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.1);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`hidden sm:block fixed top-0 inset-x-0 z-40 transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-full pointer-events-none"}`}
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8EEF5",
        boxShadow: "0 10px 30px -18px rgba(15,28,49,0.18)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between gap-4">
        <Logo variant="dark" size="sm" />

        <div className="flex items-center gap-5">
          {/* Live scarcity — real DB count, hidden entirely when the window is closed */}
          {seats && (
            <p className="hidden md:inline-flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
              </span>
              {seats.left} of {seats.cap} compute-capped free seats left
            </p>
          )}
          <Link
            href="/diagnostic"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-white text-[13px] font-bold transition-transform duration-150 motion-safe:hover:-translate-y-0.5"
            style={{ background: BLUE_GRADIENT, boxShadow: "0 10px 22px -10px rgba(0,86,206,0.55)" }}
          >
            Take the free 3-min skill check
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
