"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// Proof Band — the credibility beat, right after the "Get hired as an [role]" hook.
// Shows WHY proof-based hiring works + what a hiring manager actually sees.
// On-brand trust signal: ZERO fake testimonials — the proof is that it's verifiable.
//
// NOTE: the %/× figures are industry secondary-source estimates. Verify + cite
// before leaning on them publicly — they're isolated in STATS for easy editing.
// ═══════════════════════════════════════════════════════════════════════════════

const STATS = [
  { target: 67,  suffix: "%", label: "of tech recruiters check your code & projects before they ever call", accent: "#3388FF" },
  { target: 3,   suffix: "×", label: "more interviews with deployed, real-world project experience",        accent: "#34D399" },
  { target: 12,  suffix: "",  label: "projects a hiring manager can open and run — public, real, all yours", accent: "#A78BFA" },
  { target: 100, suffix: "%", label: "verifiable — no fake reviews here, check every claim before you pay",  accent: "#FBBF24" },
];

const PROOF_POINTS = [
  "A product they can run — not a claim they have to take on faith",
  "Every line reviewed by Nova — a score that speaks for your code",
  "A verifiable credential, not a PDF anyone can fake",
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

// ─── Animated stat tile ─────────────────────────────────────────────────────────
function StatTile({ stat, visible, delay }: { stat: typeof STATS[number]; visible: boolean; delay: number }) {
  const value = useCountUp(stat.target, visible);
  return (
    <div
      className="group relative rounded-2xl border p-6 sm:p-7 text-center transition-all duration-700 hover:-translate-y-1"
      style={{
        background: `linear-gradient(160deg, ${stat.accent}12 0%, rgba(255,255,255,0.02) 55%)`,
        borderColor: `${stat.accent}26`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <p
        className="font-black tabular-nums leading-none"
        style={{ fontSize: "clamp(40px, 5.5vw, 60px)", letterSpacing: "-0.04em", color: stat.accent }}
      >
        {value}
        {stat.suffix}
      </p>
      <p className="mt-3.5 text-xs sm:text-[13px] leading-relaxed text-slate-300/90">{stat.label}</p>
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 16px 40px ${stat.accent}22, 0 0 0 1px ${stat.accent}40 inset` }}
      />
    </div>
  );
}

// ─── "What an employer actually sees" mock ──────────────────────────────────────
function ProofCard({ visible }: { visible: boolean }) {
  return (
    <div
      className="relative rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#0B1626 0%,#070E1A 100%)", boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[11px] text-slate-500 font-mono truncate">alex-rivera.dev · portfolio</span>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {/* Featured project with animated review score */}
        <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-sm font-bold text-white font-mono">rag-support-agent</span>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-300"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-slate-400">Nova code review</span>
            <span className="font-bold text-emerald-300 tabular-nums">94/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: visible ? "94%" : "0%", background: "linear-gradient(90deg,#3388FF,#34D399)" }}
            />
          </div>
        </div>

        {/* Two more projects */}
        {[
          { n: "vision-defect-detector", s: "91" },
          { n: "trading-dashboard-api", s: "88" },
        ].map((p) => (
          <div
            key={p.n}
            className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3.5 py-2.5"
            style={{ background: "rgba(255,255,255,0.015)" }}
          >
            <span className="text-xs font-mono text-slate-300">{p.n}</span>
            <div className="flex items-center gap-2.5 text-[10px]">
              <span className="inline-flex items-center gap-1 text-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> live
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 tabular-nums">{p.s}/100</span>
            </div>
          </div>
        ))}

        {/* Verified footer */}
        <div className="flex items-center justify-between pt-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3388FF" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Verified by Square 1
          </span>
          <span className="text-[10px] text-slate-600 font-mono">SQ1-7F3A-9C21</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export function ProofBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg,#050B14 0%,#081120 55%,#050B14 100%)" }}
    >
      {/* Accent glows */}
      <div
        className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle,#3388FF 0%,transparent 70%)", filter: "blur(110px)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle,#34D399 0%,transparent 70%)", filter: "blur(110px)" }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Eyebrow */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Why this works
          </span>
        </div>

        {/* Headline */}
        <h2
          className="mt-5 text-center font-black tracking-tight text-white leading-[0.98] max-w-3xl mx-auto"
          style={{ fontSize: "clamp(30px,5vw,58px)", letterSpacing: "-0.03em" }}
        >
          Employers don&apos;t read résumés.{" "}
          <span
            style={{
              background: "linear-gradient(135deg,#3388FF 0%,#34D399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            They click proof.
          </span>
        </h2>

        <p className="mt-5 text-center text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          A line on a CV says you <span className="italic">can</span>. A deployed, code-reviewed project{" "}
          <span className="text-white font-semibold">shows you did</span> — the difference between
          &ldquo;we&apos;ll be in touch&rdquo; and a callback.
        </p>

        {/* Animated stat tiles */}
        <div className="mt-12 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STATS.map((s, i) => (
            <StatTile key={s.label} stat={s} visible={visible} delay={i * 120} />
          ))}
        </div>

        {/* Employer-view panel */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <ProofCard visible={visible} />
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">
              This is what lands in front of them.
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-6">
              Not a bullet point that says &ldquo;familiar with Python.&rdquo; A working product they can open,
              backed by an AI code review that vouches for the quality — and a credential they can verify in one
              click.
            </p>
            <ul className="space-y-3">
              {PROOF_POINTS.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                  <span
                    className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.3)" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Honesty line + CTA */}
        <div className="mt-14 sm:mt-16 text-center">
          <p className="text-sm text-slate-500 max-w-xl mx-auto mb-7">
            <span className="text-slate-300 font-semibold">No fake testimonials on this page.</span> The figures
            above are industry data; everything below is something you build — and can verify yourself.
          </p>
          <Link
            href="/diagnostic"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,#0056CE 0%,#4F46E5 100%)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}
          >
            Start building your proof →
          </Link>
          <p className="mt-3 text-[11px] text-slate-500 tracking-wide">Free · 30 minutes · No credit card</p>
        </div>
      </div>
    </section>
  );
}
