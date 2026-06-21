"use client";

import { useEffect, useRef, useState } from "react";

// Team-impact dashboard for /business — four projected visuals, all animating on
// scroll. Pre-launch, so everything is a MODEL of the program design, clearly
// labelled "projected" — never claimed customer results.

function useCountUp(target: number, run: boolean, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
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

function Tile({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" style={{ boxShadow: "0 4px 16px rgba(15,28,49,0.05)" }}>
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3">{label}</p>
      {children}
    </div>
  );
}

// 1 — Avg team readiness climbing over the track
function ReadinessTile({ visible }: { visible: boolean }) {
  const end = useCountUp(88, visible);
  return (
    <Tile label="Avg team readiness">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-black text-slate-900 tabular-nums">{end}%</span>
        <span className="text-xs text-slate-400">from ~32% at intake</span>
      </div>
      <svg viewBox="0 0 260 84" className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ti-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3388FF" /><stop offset="100%" stopColor="#0056CE" /></linearGradient>
          <linearGradient id="ti-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(0,86,206,0.18)" /><stop offset="100%" stopColor="rgba(0,86,206,0)" /></linearGradient>
        </defs>
        <path d="M0 70 C 70 64, 95 48, 135 34 S 215 12, 260 8 L 260 84 L 0 84 Z" fill="url(#ti-fill)"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 1s ease 0.3s" }} />
        <path d="M0 70 C 70 64, 95 48, 135 34 S 215 12, 260 8" fill="none" stroke="url(#ti-line)" strokeWidth="3" strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={visible ? 0 : 1} style={{ transition: "stroke-dashoffset 1.4s ease" }} />
      </svg>
      <div className="flex justify-between text-[9px] text-slate-400 mt-1.5"><span>Diagnostic</span><span>Build</span><span>Portfolio</span></div>
    </Tile>
  );
}

// 2 — Skill gaps closing (intake → after)
function SkillTile({ visible }: { visible: boolean }) {
  const topics = [
    { t: "Prompting", before: 40, after: 90 },
    { t: "RAG systems", before: 25, after: 82 },
    { t: "Agents", before: 18, after: 75 },
    { t: "Eval & testing", before: 15, after: 70 },
  ];
  return (
    <Tile label="Skill gaps closed">
      <div className="space-y-2.5 mt-1">
        {topics.map((b, i) => (
          <div key={b.t} className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-600 w-24 shrink-0 truncate">{b.t}</span>
            <div className="relative flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: visible ? `${b.after}%` : `${b.before}%`, background: "linear-gradient(90deg,#3388FF,#19A65F)", transition: `width 1s ease ${i * 90}ms` }} />
            </div>
            <span className="text-[10px] font-semibold tabular-nums text-emerald-600 w-7 text-right">{b.after}%</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-3">Red/amber at intake → green by the portfolio stage.</p>
    </Tile>
  );
}

// 3 — Projected cost saving vs a bootcamp
function SavingTile({ visible }: { visible: boolean }) {
  const k = useCountUp(15, visible);
  const bars = [
    { l: "Bootcamp", v: 100, c: "#94A3B8", cap: "$15k+/seat" },
    { l: "Square 1", v: 8, c: "#0056CE", cap: "free (early access)" },
  ];
  return (
    <Tile label="Projected cost / upskilled dev">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-black text-slate-900 tabular-nums">~${k}k</span>
        <span className="text-xs text-slate-400">saved per seat</span>
      </div>
      <div className="flex items-end gap-6 h-24">
        {bars.map((b, i) => (
          <div key={b.l} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="w-full rounded-t-lg" style={{ height: visible ? `${b.v}%` : "0%", background: b.c, transition: `height 1s ease ${i * 150}ms`, minHeight: 6 }} />
            <p className="text-[11px] font-bold text-slate-700 mt-2">{b.l}</p>
            <p className="text-[9px] text-slate-400">{b.cap}</p>
          </div>
        ))}
      </div>
    </Tile>
  );
}

// 4 — Time to job-ready
function TimeTile({ visible }: { visible: boolean }) {
  const x = useCountUp(2, visible);
  const bars = [
    { l: "Self-taught / generic", mo: "~12 mo", v: 100, c: "#94A3B8" },
    { l: "Square 1 track", mo: "~6 mo", v: 50, c: "#0056CE" },
  ];
  return (
    <Tile label="Time to job-ready">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-black text-slate-900 tabular-nums">{x}×</span>
        <span className="text-xs text-slate-400">faster, focused</span>
      </div>
      <div className="space-y-3">
        {bars.map((b, i) => (
          <div key={b.l}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600">{b.l}</span>
              <span className="font-semibold text-slate-700 tabular-nums">{b.mo}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: visible ? `${b.v}%` : "0%", background: b.c, transition: `width 1s ease ${i * 150}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

export function TeamImpact() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.25 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#F4F8FF 100%)" }}>
      <div className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(0,86,206,0.06) 0%,transparent 70%)", filter: "blur(110px)" }} />

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-9">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">
            Team impact
            <span className="tracking-normal normal-case font-semibold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Projected</span>
          </span>
          <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.05]" style={{ fontSize: "clamp(28px,4vw,46px)", letterSpacing: "-0.02em" }}>
            What 6 months does to a team.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Modeled from how the program is built — diagnostic, deployed projects, line-by-line review.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <ReadinessTile visible={visible} />
          <SkillTile visible={visible} />
          <SavingTile visible={visible} />
          <TimeTile visible={visible} />
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 max-w-xl mx-auto">
          Projected from the program design — not customer results. We&apos;re onboarding our founding cohort now; real benchmarks will replace these as teams complete the track.
        </p>
      </div>
    </section>
  );
}
