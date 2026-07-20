"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { readConsent, setConsent, type ConsentValue } from "@/lib/consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!readConsent()) {
      // Delay appearance for smooth entrance
      const timer = setTimeout(() => { setVisible(true); setAnimating(true); }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  function choose(value: ConsentValue) {
    setConsent(value);
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);
  }

  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg transition-all duration-500 ${animating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-4">
          {/* Shield icon */}
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong className="text-white font-semibold">Essential cookies</strong> keep you signed in.
              May we also use <strong className="text-white font-semibold">analytics</strong> (Google
              Analytics) to see which lessons actually work and improve them?{" "}
              <span className="text-slate-400">No ads. We never sell your data.</span>{" "}
              <Link href="/privacy" className="text-slate-400 underline underline-offset-2 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => choose("essential")}
            className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all"
          >
            Essential only
          </button>
          <button
            onClick={() => choose("all")}
            className="h-9 px-5 rounded-xl bg-white text-[#0A0A0A] text-sm font-bold hover:bg-white/90 transition-all"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  );
}
