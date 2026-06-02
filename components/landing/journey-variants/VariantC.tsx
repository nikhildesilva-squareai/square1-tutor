"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    n: "01",
    label: "Assessment",
    title: "Know exactly where you stand",
    desc: "20 questions across MCQ, short answer, and code. AI grades every answer.",
    duration: "30 min",
    isFinal: false,
  },
  {
    n: "02",
    label: "Skill Report",
    title: "See the full picture",
    desc: "Topic-by-topic breakdown. Strengths and gaps. AI recommendations specific to you.",
    duration: "Instant",
    isFinal: false,
  },
  {
    n: "03",
    label: "Plan",
    title: "Built around your life",
    desc: "Choose 3, 6, or 9 months. 45 minutes a day. Adapts to your level.",
    duration: "Flexible",
    isFinal: false,
  },
  {
    n: "04",
    label: "Build",
    title: "10–12 real projects",
    desc: "Not toy apps. Real-world projects. Every one deployed to GitHub with a live URL.",
    duration: "3–9 months",
    isFinal: false,
  },
  {
    n: "05",
    label: "Hired",
    title: "Walk in with proof",
    desc: "Verified portfolio. AI-graded score. Interview-ready. Real credentials.",
    duration: "The goal",
    isFinal: true,
  },
];

// ─── Mini product mockup for each step ────────────────────────────────────────
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
    { l: "LLM",      v: 90, c: "#10B981" },
    { l: "Prompts",  v: 75, c: "#10B981" },
    { l: "RAG",      v: 45, c: "#FBBF24" },
    { l: "Agents",   v: 30, c: "#EF4444" },
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
        { m: "6mo", h: "1hr/day", n: "10", active: true },
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
        <p className="text-[8px] text-emerald-400 font-bold tracking-widest">PORTFOLIO</p>
        <p className="text-[8px] text-slate-500">verified</p>
      </div>
      <p className="text-3xl font-black text-white tabular-nums leading-none">94<span className="text-sm text-slate-500">/100</span></p>
      <div className="space-y-1 pt-2 border-t border-white/8">
        {[
          { l: "Projects",  v: "12 / 12" },
          { l: "Offers",    v: "3 received" },
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

// ─── Main variant ─────────────────────────────────────────────────────────────
export function VariantC() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const stepEls = el.querySelectorAll("[data-step-idx]");
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

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(180deg, #050B14 0%, #081827 50%, #050B14 100%)",
      }}
    >
      {/* Background accent */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />

      <div className="relative max-w-6xl mx-auto">

        {/* Label */}
        <div className="text-center mb-6">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            The Journey · Numbers
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-center font-black tracking-tight text-white leading-[0.95] mb-4"
          style={{ fontSize: "clamp(40px, 7vw, 92px)" }}>
          Five steps.
          <br />
          <span style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            One outcome.
          </span>
        </h2>

        <p className="text-center text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-16 lg:mb-24">
          Restraint. Typography. The actual product, not metaphors.
        </p>

        {/* Steps — Vertical rhythm */}
        <div className="space-y-16 sm:space-y-24 lg:space-y-32">
          {STEPS.map((step, i) => {
            const Mockup = MOCKUPS[i];
            const isVisible = visibleSteps.has(i);
            const isFinal = step.isFinal;
            return (
              <div
                key={step.n}
                data-step-idx={i}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center transition-all duration-700 ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(40px)",
                }}
              >
                {/* HUGE numeral */}
                <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-black tabular-nums leading-none select-none"
                      style={{
                        fontSize: "clamp(96px, 16vw, 220px)",
                        letterSpacing: "-0.06em",
                        background: isFinal
                          ? "linear-gradient(135deg, #10B981 0%, #34D399 100%)"
                          : "linear-gradient(180deg, #FFFFFF 0%, #475569 110%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: isFinal && isVisible ? "drop-shadow(0 0 32px rgba(16,185,129,0.5))" : "none",
                      }}
                    >
                      {step.n}
                    </span>
                  </div>
                  <div className="mt-3 lg:mt-5 flex items-center gap-3">
                    <span className={`text-[10px] font-black tracking-[0.35em] uppercase ${isFinal ? "text-emerald-400" : "text-slate-500"}`}>
                      {step.label}
                    </span>
                    <span className="h-px flex-1 max-w-[80px] bg-white/8" />
                    <span className="text-[10px] tabular-nums text-slate-600">{step.duration}</span>
                  </div>
                </div>

                {/* Content + mockup */}
                <div className={`lg:col-span-7 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8 items-center">
                    {/* Text */}
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm lg:text-base text-slate-400 leading-relaxed mb-4">
                        {step.desc}
                      </p>
                      {isFinal && (
                        <Link
                          href="/signup"
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-bold"
                        >
                          Start your journey →
                        </Link>
                      )}
                    </div>

                    {/* Product mockup */}
                    <div className="w-full max-w-[260px] mx-auto sm:mx-0">
                      <Mockup />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20 sm:mt-28">
          <p className="text-xs text-slate-500 mb-4">No theory marathons. No fluff. Just signal.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors"
          >
            Take the assessment →
          </Link>
        </div>
      </div>
    </section>
  );
}
