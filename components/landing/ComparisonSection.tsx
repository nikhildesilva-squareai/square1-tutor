"use client";

import { useEffect, useRef, useState } from "react";

// ─── The 4 money-shot comparisons ─────────────────────────────────────────────
type Comparison = {
  category: string;
  oldValue: string;
  oldNumber?: number;
  oldPrefix?: string;
  oldSuffix?: string;
  oldLabel: string;
  newValue: string;
  newNumber?: number;
  newPrefix?: string;
  newSuffix?: string;
  newLabel: string;
};

const COMPARISONS: Comparison[] = [
  { category: "Cost", oldValue: "$15,000+", oldNumber: 15000, oldPrefix: "$", oldSuffix: "+", oldLabel: "bootcamp tuition", newValue: "$0", newNumber: 0, newPrefix: "$", newLabel: "free assessment" },
  { category: "Time to job-ready", oldValue: "3 years", oldNumber: 3, oldSuffix: " yrs", oldLabel: "tutorials, alone", newValue: "6 months", newNumber: 6, newSuffix: " mo", newLabel: "one focused track" },
  { category: "Real projects deployed", oldValue: "2", oldNumber: 2, oldLabel: "toy apps · maybe", newValue: "12", newNumber: 12, newLabel: "live on GitHub" },
  { category: "Code feedback", oldValue: "0", oldNumber: 0, oldLabel: "you guess", newValue: "Every line", newLabel: "AI-graded by Claude" },
];

// ─── Count-up hook (runs once the table scrolls into view) ────────────────────
function useCountUp(target: number | undefined, run: boolean, duration = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run || target === undefined) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setV(Math.round(target! * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

const fmt = (n: number) => n.toLocaleString();

// ─── One table row ────────────────────────────────────────────────────────────
function Row({ comp, visible, last }: { comp: Comparison; visible: boolean; last: boolean }) {
  const oldC = useCountUp(comp.oldNumber, visible);
  const newC = useCountUp(comp.newNumber, visible);
  const oldDisplay = comp.oldNumber === undefined ? comp.oldValue : `${comp.oldPrefix ?? ""}${fmt(oldC)}${comp.oldSuffix ?? ""}`;
  const newDisplay = comp.newNumber === undefined ? comp.newValue : `${comp.newPrefix ?? ""}${fmt(newC)}${comp.newSuffix ?? ""}`;

  return (
    <div className="group grid grid-cols-[1.1fr_1fr_1fr] items-center">
      {/* Metric */}
      <div className="px-3 sm:px-6 py-4 sm:py-5 border-t border-slate-100 transition-colors group-hover:bg-slate-50/60">
        <p className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{comp.category}</p>
      </div>

      {/* The Old Way */}
      <div className="px-2 sm:px-6 py-4 sm:py-5 border-t border-slate-100 text-center transition-colors group-hover:bg-slate-50/60">
        <span className="relative inline-block font-black tabular-nums text-slate-400 text-lg sm:text-2xl leading-none">
          {oldDisplay}
          <span className="absolute top-1/2 -left-0.5 -right-0.5 h-[2px] rounded-full -translate-y-1/2" style={{ background: "#EF4444" }} />
        </span>
        <p className="mt-1.5 text-[10px] sm:text-xs text-slate-400 leading-tight">{comp.oldLabel}</p>
      </div>

      {/* Square 1 AI — highlighted winner column */}
      <div className={`px-2 sm:px-6 py-4 sm:py-5 text-center bg-blue-50/70 border-x border-t border-blue-100 ${last ? "rounded-b-2xl" : ""}`}>
        <span className="inline-flex items-center gap-1.5 leading-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
          <span className="font-black tabular-nums text-lg sm:text-2xl"
            style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {newDisplay}
          </span>
        </span>
        <p className="mt-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 leading-tight">{comp.newLabel}</p>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)" }}
    >
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Why Square 1</span>
          <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.02]" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}>
            The math is{" "}
            <span style={{ background: "linear-gradient(135deg, #0056CE 0%, #01224F 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              simple.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Same outcome. Completely different numbers.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.10)" }}>
          {/* Header */}
          <div className="grid grid-cols-[1.1fr_1fr_1fr] items-end">
            <div className="px-3 sm:px-6 pt-5 pb-3" />
            <div className="px-2 sm:px-6 pt-5 pb-3 text-center">
              <p className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-slate-400 font-bold">The Old Way</p>
            </div>
            <div className="px-2 sm:px-6 pt-4 pb-3 text-center bg-blue-50/70 border-x border-t border-blue-100 rounded-t-2xl">
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white" style={{ background: "#0056CE" }}>
                Square 1 AI
              </span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISONS.map((c, i) => (
            <Row key={c.category} comp={c} visible={visible} last={i === COMPARISONS.length - 1} />
          ))}
        </div>

        {/* Bottom takeaway */}
        <div className="text-center mt-10 sm:mt-14">
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            You can keep grinding the old way for years.{" "}
            <span className="text-slate-900 font-bold">Or you can take 30 minutes.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
