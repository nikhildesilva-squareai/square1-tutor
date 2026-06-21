"use client";

import { useEffect, useRef, useState } from "react";

// Interactive stepper — auto-advances through the 3 steps (pauses on hover),
// the connector line fills to the active step, completed steps check off, and
// each step is clickable. Scroll-revealed.

const STEPS = [
  { n: 1, title: "Pick your seats", desc: "Choose how many people. Start free during early access — no card needed today." },
  { n: 2, title: "Invite your team", desc: "Share a link or invite by email. Each person gets a personalised path for their level and role." },
  { n: 3, title: "Track + prove it", desc: "A manager dashboard shows progress, scores and certificates across your whole team." },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 2600);
    return () => clearInterval(id);
  }, [visible, paused]);

  // Track spans the middle 66.66% (badge centres at 16.66 / 50 / 83.33%)
  const fillPct = (active / (STEPS.length - 1)) * (200 / 3);

  return (
    <section ref={ref} className="max-w-5xl mx-auto px-5 sm:px-6 py-14">
      <div className="text-center mb-12">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">Up and running in minutes</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">How it works</h2>
      </div>

      <div
        className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Connector track + animated fill (desktop) */}
        <div className="hidden sm:block absolute top-8 left-[16.66%] right-[16.66%] h-[3px] rounded-full bg-slate-200" />
        <div
          className="hidden sm:block absolute top-8 left-[16.66%] h-[3px] rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${fillPct}%`, background: "linear-gradient(90deg,#0056CE,#3388FF)" }}
        />

        {STEPS.map((s, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <button
              key={s.n}
              onClick={() => setActive(i)}
              className="relative z-10 w-full text-center focus:outline-none cursor-pointer"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .6s, transform .6s", transitionDelay: `${i * 120}ms` }}
            >
              <div
                className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black mb-4 transition-all duration-500"
                style={{
                  background: isActive || isDone ? "linear-gradient(135deg,#0056CE,#3388FF)" : "#E2E8F0",
                  color: isActive || isDone ? "#fff" : "#94A3B8",
                  boxShadow: isActive
                    ? "0 12px 28px rgba(0,86,206,0.45), 0 0 0 6px #ffffff, 0 0 0 10px rgba(0,86,206,0.12)"
                    : "0 0 0 6px #ffffff",
                  transform: isActive ? "scale(1.12)" : "scale(1)",
                }}
              >
                {isDone
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  : s.n}
              </div>
              <h3 className="text-base font-bold mb-1.5 transition-colors duration-500" style={{ color: isActive ? "#0F172A" : "#475569" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed max-w-[260px] mx-auto transition-colors duration-500" style={{ color: isActive ? "#475569" : "#94A3B8" }}>{s.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-9">Click a step to explore · auto-advances</p>
    </section>
  );
}
