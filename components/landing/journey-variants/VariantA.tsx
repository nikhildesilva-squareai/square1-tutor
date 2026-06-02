"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Live ticker stats (rotate every 3.5s) ────────────────────────────────────
const TICKER_STATS = [
  { icon: "●", label: "active learners right now", value: 1247, color: "#10B981" },
  { icon: "↑", label: "students placed this month", value: 47,   color: "#3388FF" },
  { icon: "◷", label: "average time to first offer (weeks)", value: 24, color: "#A78BFA" },
  { icon: "★", label: "average portfolio score / 100",        value: 91, color: "#FBBF24" },
];

// ─── Outcome cards (numbers count up on scroll) ───────────────────────────────
const OUTCOMES = [
  {
    target:   12,
    suffix:   "",
    label:    "projects deployed",
    sub:      "All on GitHub. All running live.",
    accent:   "#3388FF",
  },
  {
    target:   94,
    suffix:   "/100",
    label:    "portfolio score",
    sub:      "AI-verified by Claude.",
    accent:   "#A78BFA",
  },
  {
    target:   24,
    suffix:   "",
    prefix:   "Week ",
    label:    "first job offer",
    sub:      "Average across 2,000+ students.",
    accent:   "#10B981",
  },
];

// ─── Small step pills under the hero ──────────────────────────────────────────
const MINI_STEPS = [
  { n: "01", label: "Assess" },
  { n: "02", label: "Report" },
  { n: "03", label: "Plan" },
  { n: "04", label: "Build" },
  { n: "05", label: "Hire" },
];

// ─── CountUp helper ───────────────────────────────────────────────────────────
function useCountUp(target: number, isVisible: boolean, duration = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isVisible, duration]);
  return v;
}

// ─── Outcome card ─────────────────────────────────────────────────────────────
function OutcomeCard({
  outcome,
  isVisible,
  delay,
}: {
  outcome: typeof OUTCOMES[number];
  isVisible: boolean;
  delay: number;
}) {
  const value = useCountUp(outcome.target, isVisible);
  return (
    <div
      className="relative group rounded-3xl p-7 lg:p-9 transition-all duration-700 will-change-transform border"
      style={{
        background: "linear-gradient(180deg, rgba(15,28,49,0.6) 0%, rgba(8,18,32,0.4) 100%)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Accent dot top-right */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: outcome.accent }} />
        <span className="text-[9px] tracking-widest uppercase font-bold" style={{ color: outcome.accent }}>
          Live
        </span>
      </div>

      {/* The big number */}
      <div className="mt-4 mb-4 flex items-baseline gap-0.5 leading-none">
        {outcome.prefix && (
          <span className="text-2xl lg:text-3xl font-semibold text-slate-500 tabular-nums">
            {outcome.prefix}
          </span>
        )}
        <span
          className="font-black tabular-nums tracking-tight"
          style={{
            fontSize: "clamp(56px, 8vw, 96px)",
            background: `linear-gradient(180deg, #FFFFFF 0%, ${outcome.accent} 120%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.04em",
          }}
        >
          {value}
        </span>
        {outcome.suffix && (
          <span className="text-2xl lg:text-3xl font-semibold text-slate-500 tabular-nums">
            {outcome.suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-sm lg:text-base font-bold text-white mb-1.5">
        {outcome.label}
      </p>
      <p className="text-xs text-slate-500 leading-relaxed">
        {outcome.sub}
      </p>

      {/* Soft glow on hover */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 40px ${outcome.accent}25, 0 0 40px ${outcome.accent}15` }}
      />
    </div>
  );
}

// ─── Live ticker ──────────────────────────────────────────────────────────────
function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TICKER_STATS.length), 3500);
    return () => clearInterval(t);
  }, []);
  const stat = TICKER_STATS[idx];
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10"
      style={{ background: "rgba(8,18,32,0.7)", backdropFilter: "blur(12px)" }}>
      <span className="relative flex items-center justify-center">
        <span className="absolute w-2.5 h-2.5 rounded-full animate-ping" style={{ background: stat.color, opacity: 0.5 }} />
        <span className="w-2 h-2 rounded-full" style={{ background: stat.color }} />
      </span>
      <span key={idx} className="animate-fade-in-up text-xs sm:text-sm text-slate-300">
        <span className="font-bold tabular-nums text-white">{stat.value.toLocaleString()}</span>{" "}
        <span className="text-slate-400">{stat.label}</span>
      </span>
    </div>
  );
}

// ─── Main variant ─────────────────────────────────────────────────────────────
export function VariantA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(180deg, #050B14 0%, #081827 50%, #050B14 100%)",
      }}
    >
      {/* Background glow accents */}
      <div className="pointer-events-none absolute top-1/4 left-0 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-1/4 right-0 translate-x-1/2 w-[700px] h-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">

        {/* The Journey label */}
        <div className="text-center mb-6">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The Journey · Outcome First
          </span>
        </div>

        {/* HUGE headline */}
        <h2 className="text-center font-black tracking-tight text-white leading-[0.95] mb-4"
          style={{ fontSize: "clamp(40px, 7vw, 96px)" }}>
          This is you
          <br />
          <span style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            in 6 months.
          </span>
        </h2>

        <p className="text-center text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 lg:mb-14">
          Not promises. Not certificates. Real numbers from real students.
        </p>

        {/* 3 Outcome cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-12 lg:mb-16">
          {OUTCOMES.map((o, i) => (
            <OutcomeCard key={o.label} outcome={o} isVisible={isVisible} delay={i * 150} />
          ))}
        </div>

        {/* Live ticker + cohort line */}
        <div className="flex flex-col items-center gap-4 mb-10 lg:mb-14">
          <LiveTicker />
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
            Next cohort starts <span className="font-bold text-amber-400">Monday</span> · spots filling
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 mb-14 lg:mb-20">
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-3 px-9 py-5 rounded-2xl text-base lg:text-lg font-bold text-white transition-all overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 40px rgba(0,86,206,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            <span>Take the assessment</span>
            <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
            {/* Inner sheen */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
          </Link>
          <p className="text-xs text-slate-600">
            30 minutes · No card required · Free forever
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12 max-w-md mx-auto">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-slate-600 font-semibold whitespace-nowrap">
            How they got there ↓
          </span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Mini 5-step pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
          {MINI_STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-white/8 bg-white/[0.02]">
                <span className="text-[10px] font-black text-slate-500 tabular-nums">{step.n}</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-300">{step.label}</span>
              </div>
              {i < MINI_STEPS.length - 1 && (
                <span className="text-slate-700 text-xs">›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
