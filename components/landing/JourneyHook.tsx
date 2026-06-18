"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// THE HOOK — Sits right after the hero. Answers "Why take this course?"
// Outcome first → 5-step journey to getting hired
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Career outcomes (the WHY) — USD salaries reflecting US tech market ─────
const ROLES = [
  { title: "AI Engineer",            track: "Generative AI",         salary: "$130–200k" },
  { title: "Cybersecurity Engineer", track: "Cybersecurity",         salary: "$110–180k" },
  { title: "ML Engineer",            track: "Machine Learning",      salary: "$140–220k" },
  { title: "Full Stack Engineer",    track: "Full Stack Development", salary: "$100–160k" },
  { title: "Data Engineer",          track: "Data Engineering",      salary: "$120–190k" },
  { title: "Cloud Architect",        track: "Cloud & DevOps",        salary: "$130–200k" },
];

// ─── Rotating headline roles (with gradient colors per role) ─────────────────
const HEADLINE_ROLES: { label: string; gradient: string }[] = [
  { label: "AI Engineer",            gradient: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)" },
  { label: "Cybersecurity Engineer", gradient: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #FBBF24 100%)" },
  { label: "ML Engineer",            gradient: "linear-gradient(135deg, #06B6D4 0%, #3388FF 50%, #6366F1 100%)" },
  { label: "Cloud Architect",        gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)" },
  { label: "Full Stack Engineer",    gradient: "linear-gradient(135deg, #10B981 0%, #06B6D4 50%, #3388FF 100%)" },
];

// ─── Outcome cards — deliverables the platform actually ships, not claimed results
const OUTCOMES = [
  {
    target:    12,
    suffix:    "",
    label:     "real projects deployed",
    sub:       "Every project shipped to GitHub with a live URL. Public, verifiable, yours.",
    accent:    "#3388FF",
  },
  {
    target:    100,
    suffix:    "%",
    label:     "of your code reviewed",
    sub:       "Every submission read line-by-line by Claude — strengths, fixes, and a score.",
    accent:    "#A78BFA",
  },
  {
    target:    24,
    suffix:    "/7",
    label:     "AI tutor at your side",
    sub:       "Nova knows your code, your weak topics, and your current lesson.",
    accent:    "#10B981",
  },
];

// ─── The 5 steps (the HOW) ────────────────────────────────────────────────────
const STEPS = [
  {
    n:        "01",
    label:    "Assessment",
    title:    "Find out where you stand",
    desc:     "20 questions across MCQ, short answer, and real code. Claude AI grades everything in 30 minutes.",
    duration: "30 min",
    isFinal:  false,
  },
  {
    n:        "02",
    label:    "Skill Report",
    title:    "See the full picture",
    desc:     "Topic-by-topic breakdown of strengths and gaps. Know exactly what's between you and the role you want.",
    duration: "Instant",
    isFinal:  false,
  },
  {
    n:        "03",
    label:    "Plan",
    title:    "A path to your target role",
    desc:     "Choose 3, 6, or 9 months. 45 minutes a day. Curriculum adapts to your level — beginner to advanced.",
    duration: "Flexible",
    isFinal:  false,
  },
  {
    n:        "04",
    label:    "Build",
    title:    "10–12 real, deployable projects",
    desc:     "Not toy apps. Real-world projects that prove you can do the job. Every one shipped to GitHub with a live URL.",
    duration: "3–9 months",
    isFinal:  false,
  },
  {
    n:        "05",
    label:    "Hired",
    title:    "Walk in with proof",
    desc:     "Verified portfolio. AI-graded score. Interview-ready. You don't need to say you can do the job — you can show it.",
    duration: "The goal",
    isFinal:  true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS + HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

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
  // Premium gradient — accent at corners, white in the middle for legibility
  const cardBg = `
    linear-gradient(135deg, ${outcome.accent}14 0%, #FFFFFF 45%, ${outcome.accent}08 100%),
    radial-gradient(circle at top right, ${outcome.accent}10, transparent 60%)
  `;
  return (
    <div
      className="relative group rounded-3xl p-6 lg:p-8 transition-all duration-700 will-change-transform border overflow-hidden"
      style={{
        background: cardBg,
        borderColor: `${outcome.accent}30`,
        boxShadow: `0 10px 32px ${outcome.accent}15, 0 0 0 1px ${outcome.accent}10 inset`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Decorative corner gradient blob */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-50"
        style={{ background: `radial-gradient(circle, ${outcome.accent}30 0%, transparent 70%)`, filter: "blur(16px)" }} />

      {/* Number */}
      <div className="relative z-10 mt-4 mb-4 flex items-baseline gap-0.5 leading-none">
        <span
          className="font-black tabular-nums tracking-tight"
          style={{
            fontSize: "clamp(56px, 7vw, 88px)",
            background: `linear-gradient(180deg, #0F172A 0%, ${outcome.accent} 120%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.04em",
          }}
        >
          {value}
        </span>
        {outcome.suffix && (
          <span className="text-2xl lg:text-3xl font-semibold text-slate-400 tabular-nums">
            {outcome.suffix}
          </span>
        )}
      </div>

      <p className="relative text-sm lg:text-base font-bold text-slate-900 mb-1.5">{outcome.label}</p>
      <p className="relative text-xs text-slate-600 leading-relaxed">{outcome.sub}</p>

      {/* Hover enhancement */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 16px 48px ${outcome.accent}35, 0 0 0 1px ${outcome.accent}40 inset` }}
      />
    </div>
  );
}

// ─── Role marquee (scrolling target roles) ────────────────────────────────────
function RoleMarquee() {
  // Duplicate for seamless infinite scroll
  const items = [...ROLES, ...ROLES];
  return (
    <div className="relative w-full overflow-hidden py-2">
      {/* Edge fade masks — white for the light section */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10"
        style={{ background: "linear-gradient(90deg, #FFFFFF 0%, transparent 100%)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10"
        style={{ background: "linear-gradient(270deg, #FFFFFF 0%, transparent 100%)" }} />

      {/* Scrolling track */}
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        {items.map((role, i) => (
          <div key={`${role.title}-${i}`} className="flex items-center gap-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm sm:text-base font-bold text-slate-900">{role.title}</span>
            <span className="text-xs text-slate-500 hidden sm:inline">· {role.salary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini product mockups for each step ───────────────────────────────────────
function MockupAssessment() {
  return (
    <div className="rounded-lg p-3 border border-white/8 bg-white/[0.02]">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono text-white" style={{ background: "rgba(0,86,206,0.5)" }}>Q3</span>
        <span className="text-[8px] text-slate-500">RAG Systems</span>
      </div>
      <p className="text-[11px] text-white/80 leading-snug mb-2">Which best describes RAG?</p>
      {["A", "B", "C", "D"].map((l, i) => (
        <div key={l} className={`text-[9px] mb-1 px-2 py-1 rounded ${i === 1 ? "bg-white/10 text-white border border-white/15" : "text-slate-600"}`}>
          {l}. {i === 1 ? "External knowledge retrieval" : "Option text..."}
        </div>
      ))}
    </div>
  );
}

function MockupReport() {
  const bars = [
    { l: "LLM",     v: 90, c: "#10B981" },
    { l: "Prompts", v: 75, c: "#10B981" },
    { l: "RAG",     v: 45, c: "#FBBF24" },
    { l: "Agents",  v: 30, c: "#EF4444" },
  ];
  return (
    <div className="rounded-lg p-3 border border-white/8 bg-white/[0.02]">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[8px] text-slate-500">Score</p>
          <p className="text-2xl font-black text-white tabular-nums leading-none">74<span className="text-xs text-slate-500">/100</span></p>
        </div>
        <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-400">INT.</span>
      </div>
      {bars.map((b) => (
        <div key={b.l} className="flex items-center gap-2 mb-1.5">
          <span className="text-[8px] text-slate-400 w-14">{b.l}</span>
          <div className="flex-1 h-1 rounded bg-white/8 overflow-hidden">
            <div className="h-full rounded transition-all" style={{ width: `${b.v}%`, background: b.c }} />
          </div>
          <span className="text-[8px] tabular-nums w-6 text-right" style={{ color: b.c }}>{b.v}%</span>
        </div>
      ))}
    </div>
  );
}

function MockupPlan() {
  return (
    <div className="rounded-lg p-3 border border-white/8 bg-white/[0.02] space-y-1.5">
      {[
        { m: "3mo", h: "2hr/day", n: "8",  active: false },
        { m: "6mo", h: "1hr/day", n: "10", active: true  },
        { m: "9mo", h: "45m/day", n: "12", active: false },
      ].map((p) => (
        <div key={p.m} className={`flex items-center justify-between p-2 rounded border ${p.active ? "border-blue-500/40 bg-blue-500/10" : "border-white/8"}`}>
          <div>
            <p className={`text-[10px] font-bold ${p.active ? "text-white" : "text-slate-500"}`}>{p.m}</p>
            <p className="text-[8px] text-slate-600">{p.h}</p>
          </div>
          <span className={`text-[9px] tabular-nums font-bold ${p.active ? "text-blue-400" : "text-slate-600"}`}>{p.n} proj</span>
        </div>
      ))}
    </div>
  );
}

function MockupBuild() {
  return (
    <div className="rounded-lg p-3 border border-white/8 bg-white/[0.02] font-mono space-y-1">
      {["ai-chatbot", "rag-pipeline", "research-agent", "production-saas"].map((name, i) => (
        <div key={name} className="flex items-center justify-between text-[9px]">
          <span className="text-blue-400">{name}</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-400">★</span>
            <span className="text-slate-500 tabular-nums">{[47, 31, 28, 62][i]}</span>
          </div>
        </div>
      ))}
      <div className="pt-1.5 mt-1.5 border-t border-white/5 flex items-center justify-between text-[8px]">
        <span className="text-slate-600">12 / 12 deployed</span>
        <span className="text-emerald-400">●</span>
      </div>
    </div>
  );
}

function MockupHired() {
  return (
    <div className="rounded-lg p-3 border border-emerald-500/25 space-y-2"
      style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))" }}>
      <div className="flex items-center justify-between">
        <p className="text-[8px] text-emerald-400 font-bold tracking-widest">THE GOAL</p>
        <p className="text-[8px] text-slate-500">interview-ready</p>
      </div>
      <p className="text-base font-black text-white leading-none mt-1">AI Engineer</p>
      <p className="text-[10px] text-slate-400">$130–200k market range</p>
      <div className="space-y-1 pt-2 border-t border-white/8">
        {[
          { l: "Projects live", v: "12" },
          { l: "Portfolio", v: "verified" },
        ].map((r) => (
          <div key={r.l} className="flex justify-between text-[8px]">
            <span className="text-slate-500">{r.l}</span>
            <span className="text-emerald-400 font-bold">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUPS = [MockupAssessment, MockupReport, MockupPlan, MockupBuild, MockupHired];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function JourneyHook() {
  const heroRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsTrackRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible]       = useState(false);
  const [visibleSteps, setVisibleSteps]     = useState<Set<number>>(new Set());
  const [roleIdx, setRoleIdx]               = useState(0);
  const [stepsProgress, setStepsProgress]   = useState(0); // 0..1 through steps

  // Rotate the role in the headline
  useEffect(() => {
    const t = setInterval(() => {
      setRoleIdx((i) => (i + 1) % HEADLINE_ROLES.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setHeroVisible(true),
      { threshold: 0.2 }
    );
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!stepsRef.current) return;
    const stepEls = stepsRef.current.querySelectorAll("[data-step-idx]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.stepIdx);
            setVisibleSteps((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.3 }
    );
    stepEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Scroll-driven progress line through the steps section
  useEffect(() => {
    function onScroll() {
      if (!stepsTrackRef.current) return;
      const rect       = stepsTrackRef.current.getBoundingClientRect();
      const viewportH  = window.innerHeight;
      // Triggers when the track enters the viewport from the bottom
      // Reaches 1.0 when the track has fully scrolled past the middle
      const start      = viewportH * 0.7;             // line starts filling when track is ~70% down
      const end        = -rect.height + viewportH * 0.3; // line is full when track has scrolled past
      const scrolled   = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      setStepsProgress(scrolled);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ZONE 1 — THE HOOK (Why take this?)  · LIGHT THEME */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 80%, #F0F4FB 100%)" }}
      >
        {/* Background accent glows — subtle on white */}
        <div className="pointer-events-none absolute top-1/4 left-0 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-6xl mx-auto">

          {/* Label */}
          <div className="text-center mb-6">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Why Square 1 · The Outcome
            </span>
          </div>

          {/* Headline — rotating role */}
          <h2 className="text-center font-black tracking-tight text-slate-900 leading-[0.95] mb-4"
            style={{ fontSize: "clamp(40px, 7vw, 96px)" }}>
            Get hired as
            <span className="hidden sm:inline">{" "}</span>
            <span className="sm:hidden"><br /></span>
            an
            <br />
            <span
              key={roleIdx}
              className="animate-role-rotate inline-block"
              style={{
                background: HEADLINE_ROLES[roleIdx].gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {HEADLINE_ROLES[roleIdx].label}.
            </span>
          </h2>

          <p className="text-center text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Whatever role you&apos;re targeting — Square 1 takes you from where you are now, to landing the offer.
          </p>

          {/* Role marquee */}
          <div className="mb-12 lg:mb-14">
            <RoleMarquee />
          </div>

          {/* "What you walk away with" sub-headline */}
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              What you walk away with.
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Deliverables, not promises. All public and verifiable.
            </p>
          </div>

          {/* 3 outcome cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {OUTCOMES.map((o, i) => (
              <OutcomeCard key={o.label} outcome={o} isVisible={heroVisible} delay={i * 150} />
            ))}
          </div>

          {/* What an employer actually sees — the tangible proof (folded in from ProofBand) */}
          <div className="mt-14 lg:mt-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3">And here&apos;s what an employer sees.</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0">
                Not a bullet point that says &ldquo;familiar with Python.&rdquo; A deployed project they can open, an AI review score that vouches for the code, and a credential they can verify in one click.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-200 overflow-hidden" style={{ background: "linear-gradient(180deg,#0B1626 0%,#070E1A 100%)", boxShadow: "0 24px 64px rgba(15,28,49,0.25)" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[11px] text-slate-500 font-mono truncate">alex-rivera.dev · portfolio</span>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm font-bold text-white font-mono">rag-support-agent</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-300" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="text-slate-400">Nova code review</span>
                    <span className="font-bold text-emerald-300 tabular-nums">94/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: heroVisible ? "94%" : "0%", background: "linear-gradient(90deg,#3388FF,#34D399)" }} />
                  </div>
                </div>
                {[{ n: "vision-defect-detector", s: "91" }, { n: "trading-dashboard-api", s: "88" }].map((p) => (
                  <div key={p.n} className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <span className="text-xs font-mono text-slate-300">{p.n}</span>
                    <div className="flex items-center gap-2.5 text-[10px]">
                      <span className="inline-flex items-center gap-1 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> live</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 tabular-nums">{p.s}/100</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3388FF" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                    Verified by Square 1
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">SQ1-7F3A-9C21</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 1 (light) → Zone 2 (dark): clean hard edge, no fade */}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ZONE 2 — THE 5 STEPS (How you get there) */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <section
        ref={stepsRef}
        className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      >
        {/* Background accent */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />

        <div className="relative max-w-6xl mx-auto">
          {/* Section intro */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              The 5-Step Journey
            </span>
            <h3 className="mt-3 font-black text-white tracking-tight leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              From doubt to offer letter.
            </h3>
            <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
              No fluff. No theory marathons. Just signal — and the proof to back it up.
            </p>
          </div>

          {/* Steps with scroll-driven progress line */}
          <div ref={stepsTrackRef} className="relative space-y-12 sm:space-y-16 lg:space-y-24">

            {/* Vertical scroll progress line — hidden on mobile */}
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px pointer-events-none z-0">
              {/* Background track */}
              <div className="absolute inset-0 bg-white/[0.06]" />
              {/* Filled portion — gradient */}
              <div
                className="absolute top-0 left-0 right-0 will-change-[height]"
                style={{
                  height: `${stepsProgress * 100}%`,
                  background:
                    "linear-gradient(180deg, #3388FF 0%, #A78BFA 25%, #8B5CF6 50%, #6366F1 75%, #10B981 100%)",
                  boxShadow: "0 0 16px rgba(99,102,241,0.4)",
                  transition: "height 0.05s linear",
                }}
              />
              {/* Glowing orb at current scroll position */}
              {stepsProgress > 0 && stepsProgress < 1 && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 will-change-transform"
                  style={{
                    top: `${stepsProgress * 100}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "top 0.05s linear",
                  }}
                >
                  {/* Outer halo */}
                  <div
                    className="absolute -inset-6 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)",
                      filter: "blur(8px)",
                    }}
                  />
                  {/* Inner bright dot */}
                  <div
                    className="relative w-3.5 h-3.5 rounded-full"
                    style={{
                      background: "radial-gradient(circle, #ffffff 0%, #6366F1 60%, #4F46E5 100%)",
                      boxShadow: "0 0 24px rgba(99,102,241,0.9), 0 0 8px rgba(255,255,255,0.9)",
                    }}
                  />
                </div>
              )}
            </div>

            {STEPS.map((step, i) => {
              const Mockup = MOCKUPS[i];
              const isVisible = visibleSteps.has(i);
              const isFinal = step.isFinal;
              // Active step = the one the orb is currently passing through
              const stepFraction = i / (STEPS.length - 1);
              const nextFraction = (i + 1) / (STEPS.length - 1);
              const isActive = stepsProgress >= stepFraction - 0.05 && stepsProgress < nextFraction + 0.05;
              const isPassed = stepsProgress >= nextFraction;
              // Step-specific accent colours for the active glow
              const stepAccents = ["#3388FF", "#6366F1", "#A78BFA", "#8B5CF6", "#10B981"];
              const accent = stepAccents[i] ?? "#3388FF";
              return (
                <div
                  key={step.n}
                  data-step-idx={i}
                  className={`relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center transition-all duration-700 ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(40px)",
                  }}
                >
                  {/* HUGE numeral — lights up when active */}
                  <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                    <div className="flex items-baseline gap-4">
                      <span
                        className="font-black tabular-nums leading-none select-none transition-all duration-500"
                        style={{
                          fontSize: "clamp(96px, 16vw, 220px)",
                          letterSpacing: "-0.06em",
                          background: isFinal
                            ? "linear-gradient(135deg, #10B981 0%, #34D399 100%)"
                            : isActive || isPassed
                              ? `linear-gradient(180deg, ${accent} 0%, ${accent}88 110%)`
                              : "linear-gradient(180deg, #FFFFFF 0%, #475569 110%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          filter: (isActive || (isFinal && isVisible))
                            ? `drop-shadow(0 0 32px ${accent}60)`
                            : "none",
                          transform: isActive ? "scale(1.03)" : "scale(1)",
                        }}
                      >
                        {step.n}
                      </span>
                    </div>
                    <div className="mt-3 lg:mt-5 flex items-center gap-3 transition-all duration-500">
                      <span
                        className="text-[10px] font-black tracking-[0.35em] uppercase transition-colors duration-500"
                        style={{ color: isFinal ? "#10B981" : isActive || isPassed ? accent : "rgba(148,163,184,1)" }}
                      >
                        {step.label}
                      </span>
                      <span className="h-px flex-1 max-w-[80px] transition-all duration-500"
                        style={{ background: isActive || isPassed ? `${accent}50` : "rgba(255,255,255,0.08)" }} />
                      <span className="text-[10px] tabular-nums transition-colors duration-500"
                        style={{ color: isActive ? accent : "rgba(71,85,105,1)" }}>{step.duration}</span>
                    </div>
                  </div>

                  {/* Content + mockup */}
                  <div className={`lg:col-span-7 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8 items-center">
                      <div>
                        <h4 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3 transition-all duration-500"
                          style={{ textShadow: isActive ? `0 0 30px ${accent}40` : "none" }}>
                          {step.title}
                        </h4>
                        <p className="text-sm lg:text-base leading-relaxed mb-4 transition-colors duration-500"
                          style={{ color: isActive ? "rgba(226,232,240,1)" : "rgba(148,163,184,1)" }}>
                          {step.desc}
                        </p>
                      </div>

                      <div className="w-full max-w-[260px] mx-auto sm:mx-0 rounded-2xl transition-all duration-500"
                        style={{
                          boxShadow: isActive ? `0 0 32px ${accent}30, 0 0 0 1px ${accent}25` : "none",
                          transform: isActive ? "scale(1.02)" : "scale(1)",
                        }}>
                        <Mockup />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Zone 2 (dark) → Zone 3 (light): clean hard edge, no fade */}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ZONE 3 — CLOSING CTA · LIGHT GRADIENT THEME · ALIVE BUTTON */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 450px at 20% 25%, rgba(0,86,206,0.10), transparent 60%),
            radial-gradient(ellipse 700px 500px at 80% 75%, rgba(16,185,129,0.10), transparent 60%),
            radial-gradient(ellipse 800px 600px at 50% 50%, rgba(167,139,250,0.07), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        {/* Extra animated background blobs for depth */}
        <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-40 animate-blob-1"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-40 animate-blob-2"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Label */}
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Your turn
          </span>

          {/* Closing headline */}
          <h3 className="mt-4 mb-5 font-black text-slate-900 tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(36px, 6vw, 76px)" }}>
            Start the assessment.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Take step one.
            </span>
          </h3>

          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-10">
            30 minutes to find out where you stand. Zero pressure. Free forever.
          </p>

          {/* What you get, stated plainly */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 py-2.5 rounded-full border bg-white text-xs sm:text-sm text-slate-600"
              style={{ borderColor: "rgba(15,28,49,0.08)", boxShadow: "0 4px 16px rgba(15,28,49,0.05)" }}>
              <span className="font-semibold text-slate-900">20 questions</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-900">AI-graded</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-900">Instant skill report</span>
            </div>
          </div>

          {/* Big CTA — rich red gradient · large · warm and premium */}
          <div className="flex flex-col items-center gap-5">
            <Link
              href="/diagnostic"
              className="relative group inline-flex items-center gap-4 px-12 sm:px-16 py-6 sm:py-7 rounded-2xl text-lg sm:text-xl lg:text-2xl font-black text-white overflow-hidden tracking-tight hover:-translate-y-0.5 transition-transform duration-300"
              style={{
                /* Sophisticated 3-stop red: deep red → vibrant red → rose-red */
                background: "linear-gradient(135deg, #B91C1C 0%, #DC2626 35%, #EF4444 70%, #F43F5E 100%)",
                boxShadow: "0 20px 56px rgba(220,38,38,0.45), 0 0 80px rgba(244,63,94,0.30), 0 0 0 1px rgba(255,255,255,0.15) inset",
                letterSpacing: "-0.01em",
                willChange: "transform",
              }}
            >
              <span className="relative z-10">Get your free skill report</span>
              <span className="relative z-10 text-2xl sm:text-3xl transition-transform duration-300 group-hover:translate-x-2">→</span>

              {/* Subtle auto-shimmer — premium polish, not blinking */}
              <span
                className="absolute inset-0 animate-cta-shimmer pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.40) 50%, transparent 100%)",
                  width: "60%",
                }}
              />
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              No credit card · No commitment · Just signal
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
