"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// The 2026 Reality — the wedge. Sets the stakes BEFORE the outcome hook: a degree
// alone no longer gets you hired, the market hires on proof, and proof is exactly
// what Square 1 Ai produces.
//
// Interactive: count-up stats on scroll, staggered reveal, animated magnitude
// bars, hover glow.
//
// NOTE: The figures below are from 2026 labour-market reporting (secondary
// sources). Verify + cite before relying on them publicly — they're isolated in
// STATS so they're trivial to edit or swap for your own sourced numbers.
// ═══════════════════════════════════════════════════════════════════════════════

type Stat = {
  prefix?: string;
  target?: number;       // when set → count-up
  staticValue?: string;  // when set → shown verbatim (e.g. a range)
  suffix?: string;
  bar: number;           // 0..100 magnitude-bar fill
  label: string;
  accent: string;
};

const STATS: Stat[] = [
  { prefix: "−", target: 65, suffix: "%", bar: 65,  label: "drop in entry-level dev job postings, 2022–2025",      accent: "#F87171" },
  { prefix: "+", target: 40, suffix: "%", bar: 40,  label: "more CS grads competing for them",                    accent: "#FBBF24" },
  { staticValue: "2–3×",                  bar: 72,  label: "higher offer rate with real, deployed project experience", accent: "#34D399" },
  { target: 1,               suffix: "",  bar: 100, label: "thing that now closes the gap: proof you can ship",    accent: "#3388FF" },
];

// ─── Count-up on scroll ─────────────────────────────────────────────────────────
function useCountUp(target: number, isVisible: boolean, duration = 1400) {
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

// ─── Interactive stat tile ──────────────────────────────────────────────────────
function StatTile({ stat, visible, delay }: { stat: Stat; visible: boolean; delay: number }) {
  const counted = useCountUp(stat.target ?? 0, visible);
  const display = stat.staticValue ?? `${stat.prefix ?? ""}${counted}${stat.suffix ?? ""}`;
  return (
    <div
      className="group relative rounded-2xl border p-5 sm:p-6 text-center overflow-hidden transition-all duration-700 hover:-translate-y-1.5"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: visible ? `${stat.accent}26` : "rgba(255,255,255,0.08)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Hover glow ring */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 16px 44px ${stat.accent}22, 0 0 0 1px ${stat.accent}45 inset` }}
      />
      {/* Corner blob on hover */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${stat.accent}40 0%, transparent 70%)`, filter: "blur(20px)" }}
      />

      <p
        className="relative font-black tabular-nums leading-none transition-transform duration-500 group-hover:scale-105"
        style={{ fontSize: "clamp(30px, 4vw, 46px)", letterSpacing: "-0.04em", color: stat.accent }}
      >
        {display}
      </p>

      {/* Animated magnitude bar */}
      <div className="relative mt-3.5 mx-auto h-1 w-14 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: visible ? `${stat.bar}%` : "0%", background: stat.accent, transitionDelay: `${delay + 250}ms` }}
        />
      </div>

      <p className="relative mt-3.5 text-[11px] sm:text-xs text-slate-400 leading-relaxed">{stat.label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export function RealityBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8" style={{ background: "#050B14" }}>
      {/* Accent glows */}
      <div
        className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #F87171 0%, transparent 70%)", filter: "blur(110px)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #3388FF 0%, transparent 70%)", filter: "blur(110px)" }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The 2026 reality
          </span>
        </div>

        {/* Headline */}
        <h2
          className="mt-5 text-center font-black tracking-tight text-white leading-[0.98] max-w-3xl mx-auto"
          style={{ fontSize: "clamp(30px, 5vw, 60px)", letterSpacing: "-0.03em" }}
        >
          A degree used to be enough.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #F87171 0%, #FBBF24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Not anymore.
          </span>
        </h2>

        <p className="mt-5 text-center text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Hundreds of applications, no callbacks — it&apos;s not a you problem, it&apos;s a{" "}
          <span className="text-white font-semibold">proof problem</span>. Employers stopped
          hiring on credentials and started hiring on what you can show.
        </p>

        {/* Interactive stat tiles */}
        <div className="mt-12 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STATS.map((s, i) => (
            <StatTile key={s.label} stat={s} visible={visible} delay={i * 130} />
          ))}
        </div>

        {/* Resolution */}
        <div className="mt-12 sm:mt-14 text-center">
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Square 1 Ai gets you the proof:{" "}
            <span className="font-bold text-white">
              10–12 deployed, code-reviewed projects employers can actually click on.
            </span>
          </p>
          <Link
            href="/diagnostic"
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
              boxShadow: "0 12px 32px rgba(0,86,206,0.30)",
            }}
          >
            Get your free skill report →
          </Link>
          <p className="mt-3 text-[11px] text-slate-500 tracking-wide">
            Free · 30 minutes · No credit card
          </p>
        </div>
      </div>
    </section>
  );
}
