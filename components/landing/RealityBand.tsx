"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, FileX2, FolderGit2, BadgeCheck, Sparkles } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// The 2026 Reality — the stakes. A cited market strip (real, sourced numbers
// only) followed by a side-by-side candidate comparison: same market, two CVs.
// The argument is visible at a glance instead of hidden behind a toggle, and
// the "winning" card carries PRODUCT FACTS (10+ graded projects, live repos,
// skill report) — no invented multipliers.
//
// Stat sources (verified 2026-07):
//  −65% entry-level software postings Jan 2022–Jan 2025 + ~40% more CS grads:
//    Indeed Hiring Lab-based reporting (hiringlab.org; overall software dev
//    postings −68.8% vs Feb 2022 peak).
//  6.1% recent-CS-grad unemployment (~2× many majors): Federal Reserve Bank of
//    New York labour-market data for recent graduates.
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// ─── Cited market stats — the only place a number is allowed to be scary ──────
const MARKET_STATS = [
  { prefix: "−", target: 65, suffix: "%", label: "entry-level software postings, Jan 2022 – Jan 2025", accent: "#DC2626" },
  { prefix: "+", target: 40, suffix: "%", label: "more CS graduates competing for them", accent: "#0056CE" },
  { staticValue: "6.1%", label: "unemployment among recent CS grads — nearly 2× many other majors", accent: "#01224F" },
] as const;

function useCountUp(target: number, run: boolean, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

function MarketStat({ stat, visible, delay }: { stat: (typeof MARKET_STATS)[number]; visible: boolean; delay: number }) {
  const counted = useCountUp("target" in stat && stat.target ? stat.target : 0, visible);
  const display = "staticValue" in stat && stat.staticValue ? stat.staticValue : `${stat.prefix ?? ""}${counted}${stat.suffix ?? ""}`;
  return (
    <div
      className="flex-1 min-w-0 px-5 py-4 text-center transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transitionDelay: `${delay}ms` }}
    >
      <p className="font-black tabular-nums leading-none" style={{ fontSize: "clamp(26px, 3vw, 38px)", letterSpacing: "-0.03em", color: stat.accent }}>
        {display}
      </p>
      <p className="mt-2 text-[11px] sm:text-xs text-slate-500 leading-snug max-w-[220px] mx-auto">{stat.label}</p>
    </div>
  );
}

// ─── The two candidates ────────────────────────────────────────────────────────
const CANDIDATE_A = [
  { icon: FileX2, text: "A certificate PDF employers can't verify" },
  { icon: X,      text: "No public code for anyone to review" },
  { icon: X,      text: "The same CV as thousands of other grads" },
  { icon: X,      text: "Waits in the pile, hopes for a callback" },
];

const CANDIDATE_B = [
  { icon: FolderGit2, text: "10+ deployed, code-reviewed projects" },
  { icon: Check,      text: "Live GitHub repos employers can actually run" },
  { icon: BadgeCheck, text: "A skill report that shows your real level" },
  { icon: Sparkles,   text: "Every rep graded by Nova before it ships" },
];

export function RealityBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F6F9FE 100%)" }}>
      {/* Accent glows — Square 1 blue */}
      <div className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)", filter: "blur(110px)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(110px)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Eyebrow + headline */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">The 2026 reality</span>
        </div>
        <h2 className="mt-4 text-center font-black tracking-tight text-slate-900 leading-[1.0] max-w-3xl mx-auto"
          style={{ fontSize: "clamp(26px, 4vw, 46px)", letterSpacing: "-0.03em" }}>
          A degree used to be enough.{" "}
          <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Not anymore.
          </span>
        </h2>
        <p className="mt-5 text-center text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Hundreds of applications, no callbacks — it&apos;s not a you problem, it&apos;s a{" "}
          <span className="text-slate-900 font-semibold">proof problem</span>. Your degree gets you
          shortlisted — <span className="text-slate-900 font-semibold">deployed proof gets you picked</span>.
        </p>

        {/* ── Market strip — cited numbers in one slim band ────────────────── */}
        <div className="mt-9 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-[0_8px_30px_-16px_rgba(15,28,49,0.15)]">
          <div className="flex flex-col sm:flex-row sm:divide-x divide-y sm:divide-y-0 divide-slate-100">
            {MARKET_STATS.map((s, i) => (
              <MarketStat key={s.label} stat={s} visible={visible} delay={i * 120} />
            ))}
          </div>
          <p className="px-5 pb-3 pt-1 text-center text-[10px] text-slate-400">
            Sources:{" "}
            <a href="https://www.hiringlab.org" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-slate-600">Indeed Hiring Lab</a>
            {" · "}
            <a href="https://www.newyorkfed.org/research/college-labor-market" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-slate-600">Federal Reserve Bank of New York</a>
          </p>
        </div>

        {/* ── Same market, two CVs — the visible argument ──────────────────── */}
        <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-5 lg:gap-0">

          {/* CANDIDATE A — degree only (deliberately flat + muted: the "before") */}
          <div
            className="relative rounded-2xl border p-6 sm:p-7 transition-all duration-700 lg:mr-[-8px] lg:my-4"
            style={{
              background: "#F8FAFC",
              borderColor: "#E2E8F0",
              opacity: visible ? 0.92 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
            }}
          >
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-400">Candidate A</p>
            <h3 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-slate-500">Degree only</h3>
            <ul className="mt-5 space-y-3.5">
              {CANDIDATE_A.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[13px] sm:text-sm text-slate-500 leading-snug">
                  <span className="mt-px w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 border border-slate-300 text-slate-400 bg-white">
                    <Icon size={12} strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="pt-0.5">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-400 font-medium">
              Shortlisted, maybe. Picked on faith.
            </p>
          </div>

          {/* VS medallion */}
          <div className="relative z-10 flex lg:flex-col items-center justify-center">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-black text-white shadow-lg"
              style={{ background: BLUE_GRADIENT, boxShadow: "0 10px 24px -8px rgba(0,86,206,0.6), 0 0 0 6px #FFFFFF" }}
              aria-hidden
            >
              VS
            </span>
          </div>

          {/* CANDIDATE B — degree + deployed proof (elevated: the "after") */}
          <div
            className="relative rounded-2xl p-6 sm:p-7 overflow-hidden transition-all duration-700 lg:ml-[-8px]"
            style={{
              background: "linear-gradient(155deg, #2E7BF0 0%, #0056CE 52%, #01224F 100%)",
              boxShadow: "0 1px 2px rgba(15,28,49,0.06), 0 28px 60px -24px rgba(0,86,206,0.6)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
              transitionDelay: "140ms",
            }}
          >
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)" }} />
            <div className="relative flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "#BFD9FF" }}>Candidate B</p>
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full text-white"
                style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.24)" }}>
                Proof attached
              </span>
            </div>
            <h3 className="relative mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-white">
              Degree + deployed proof
            </h3>
            <ul className="relative mt-5 space-y-3.5">
              {CANDIDATE_B.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[13px] sm:text-sm leading-snug" style={{ color: "#E4EEFB" }}>
                  <span className="mt-px w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 bg-white">
                    <Icon size={12} strokeWidth={2.5} aria-hidden style={{ color: "#0056CE" }} />
                  </span>
                  <span className="pt-0.5 font-medium">{text}</span>
                </li>
              ))}
            </ul>
            <p className="relative mt-6 pt-4 text-[11px] font-medium" style={{ borderTop: "1px solid rgba(255,255,255,0.18)", color: "#BFD9FF" }}>
              Same market. A CV employers can click, run and verify.
            </p>
          </div>
        </div>

        {/* Resolution + CTA — hand the tension to the funnel */}
        <div className="mt-11 flex flex-col items-center gap-4">
          <p className="text-center text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            Square 1 turns you into Candidate B —{" "}
            <span className="font-bold text-slate-900">project by graded project.</span>
          </p>
          <PrimaryCta href="/diagnostic">Start building proof — free 3-min skill check</PrimaryCta>
        </div>
      </div>
    </section>
  );
}
