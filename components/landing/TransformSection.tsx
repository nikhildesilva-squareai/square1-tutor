"use client";

import { useEffect, useRef, useState } from "react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ─────────────────────────────────────────────────────────────────────────────
// B2C "before → after" transformation.
// A scroll-triggered level-up: a marker travels the milestone spine (Assess →
// Job-ready) while the readiness meter + projects count up, and each before→after
// row flips to its "after" state as the marker passes it. Milestones are
// clickable to scrub/replay. prefers-reduced-motion jumps to the final state.
//
// Honesty: the row outcomes are factual program mechanics (projects deploy, code
// is AI-graded, the portfolio is verifiable). The readiness % is the only soft
// number — labelled "illustrative", never a measured graduate outcome.
// ─────────────────────────────────────────────────────────────────────────────

const MILESTONES = [
  { phase: "Assess", when: "Day 1" },
  { phase: "Build", when: "Week 2" },
  { phase: "Review", when: "Month 2" },
  { phase: "Portfolio", when: "Month 4" },
  { phase: "Job-ready", when: "Month 6" },
];

const READINESS = [18, 38, 60, 80, 92];
const PROJECTS = [0, 1, 4, 8, 12];

const ROWS = [
  { before: "50 tutorials, nothing shipped", after: "12 real projects, deployed & live" },
  { before: "Is my code any good? No idea", after: "Every line graded by AI" },
  { before: "A résumé nobody opens", after: "A portfolio they can verify" },
  { before: "Freeze in technical interviews", after: "Rehearsed with Nova till it's reflex" },
  { before: "“I’m learning to code”", after: "“Here’s what I’ve built”" },
];

const N = MILESTONES.length;

// Tween from the previous value to a new target whenever the target changes.
function useTween(target: number, duration = 700) {
  const [v, setV] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setV(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function Row({ before, after, revealed }: { before: string; after: string; revealed: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-4 rounded-xl border px-3 sm:px-4 py-3 transition-all duration-500 ${
        revealed ? "border-brand/20 bg-white shadow-sm" : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <span
        className={`flex-1 text-xs sm:text-sm transition-all duration-500 ${
          revealed ? "text-slate-500 line-through" : "text-slate-600"
        }`}
      >
        {before}
      </span>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={`shrink-0 transition-colors duration-500 ${revealed ? "text-brand" : "text-slate-300"}`}
      >
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
      <span className="flex-1 flex items-center gap-2 justify-between">
        <span
          className={`text-xs sm:text-sm font-semibold transition-all duration-500 ${
            revealed ? "text-slate-900" : "text-slate-300"
          }`}
        >
          {after}
        </span>
        <span
          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
            revealed ? "bg-emerald-500 scale-100" : "bg-slate-200 scale-90"
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke={revealed ? "white" : "transparent"} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </span>
    </div>
  );
}

export function TransformSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const [done, setDone] = useState(false);

  // Start the level-up once it scrolls into view (or jump to the end if the
  // visitor prefers reduced motion).
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        if (reduced) {
          setStep(N - 1);
          setDone(true);
        } else {
          setAuto(true);
        }
        obs.disconnect();
      },
      { threshold: 0.35 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Auto-advance one milestone at a time while autoplay is on.
  useEffect(() => {
    if (!auto || step >= N - 1) {
      if (step >= N - 1) setDone(true);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), 1300);
    return () => clearTimeout(id);
  }, [auto, step]);

  function jump(i: number) {
    setAuto(false);
    setStep(i);
    setDone(i >= N - 1);
  }

  function replay() {
    setStep(0);
    setDone(false);
    setAuto(true);
  }

  const readiness = useTween(READINESS[step]);
  const projects = useTween(PROJECTS[step]);
  const fillPct = (step / (N - 1)) * 100;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 55%, #FFFFFF 100%)" }}
    >
      <div className="pointer-events-none absolute top-1/4 right-1/5 w-[520px] h-[520px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-1/4 left-1/5 w-[560px] h-[480px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">
            Before → after
          </span>
          <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.03]"
            style={{ fontSize: "clamp(30px, 5vw, 54px)", letterSpacing: "-0.02em" }}>
            Six months changes{" "}
            <span style={{ background: "linear-gradient(135deg, #0056CE 0%, #01224F 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              who you are.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Same you. Completely different position. Watch where the track takes you.
          </p>
        </div>

        {/* Level-up spine */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8" style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.10)" }}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="rounded-2xl bg-blue-50/70 border border-blue-100 px-3 py-3 sm:px-4 sm:py-4">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500">Job-ready</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black tabular-nums"
                style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {Math.round(readiness)}%
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white/70 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${readiness}%`, background: "linear-gradient(90deg,#3388FF,#0056CE)" }} />
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 sm:px-4 sm:py-4">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500">Projects shipped</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-slate-900">{Math.round(projects)}</p>
              <p className="mt-2 text-[10px] text-slate-500">live on GitHub</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 sm:px-4 sm:py-4">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500">Stage</p>
              <p className="mt-1 text-lg sm:text-2xl font-black text-slate-900 leading-tight">{MILESTONES[step].phase}</p>
              <p className="mt-1 text-[10px] text-slate-500">{MILESTONES[step].when}</p>
            </div>
          </div>

          {/* Rail */}
          <div className="relative px-1">
            <div className="absolute left-0 right-0 top-[13px] h-1 bg-slate-200 rounded-full" />
            <div className="absolute left-0 top-[13px] h-1 rounded-full transition-all duration-700"
              style={{ width: `${fillPct}%`, background: "linear-gradient(90deg,#3388FF,#0056CE)" }} />
            <div className="relative flex justify-between">
              {MILESTONES.map((m, i) => {
                const reached = i <= step;
                const active = i === step;
                return (
                  <button key={m.phase} onClick={() => jump(i)}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                    aria-label={`${m.phase} — ${m.when}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                      reached ? "text-white" : "bg-white border-2 border-slate-200 text-slate-500 group-hover:border-brand/40"
                    } ${active ? "ring-4 ring-brand/15 scale-110" : ""}`}
                      style={reached ? { background: "linear-gradient(135deg,#3388FF,#0056CE)" } : undefined}>
                      {reached ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (i + 1)}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-semibold transition-colors text-center leading-tight ${active ? "text-brand" : reached ? "text-slate-700" : "text-slate-500"}`}>
                      {m.phase}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] text-slate-500">
            Readiness is illustrative — what the track is built to take you to, not a measured outcome.
          </p>
        </div>

        {/* Transforming rows */}
        <div className="mt-4 grid gap-2.5">
          {ROWS.map((r, i) => (
            <Row key={i} before={r.before} after={r.after} revealed={i <= step} />
          ))}
        </div>

        {/* Replay / CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {done && (
            <button onClick={replay}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:border-brand/40 hover:text-brand transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.36 2.64L3 8" /><path d="M3 3v5h5" /></svg>
              Replay
            </button>
          )}
          <PrimaryCta href="/diagnostic">
            See your starting point — free
          </PrimaryCta>
        </div>
      </div>
    </section>
  );
}
