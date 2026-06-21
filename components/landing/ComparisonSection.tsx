"use client";

import { useEffect, useRef, useState } from "react";

// ─── The 4 money-shot comparisons ─────────────────────────────────────────────
type Comparison = {
  category: string;
  short: string;            // tab label
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
  win: string;              // the headline takeaway for this dimension
};

const COMPARISONS: Comparison[] = [
  { category: "Cost", short: "Cost", oldValue: "$15,000+", oldNumber: 15000, oldPrefix: "$", oldSuffix: "+", oldLabel: "bootcamp tuition", newValue: "$0", newNumber: 0, newPrefix: "$", newLabel: "free assessment", win: "Same outcome, 1/25th the cost." },
  { category: "Time to job-ready", short: "Time", oldValue: "3 years", oldNumber: 3, oldSuffix: " years", oldLabel: "wandering tutorials alone", newValue: "6 months", newNumber: 6, newSuffix: " months", newLabel: "one focused track", win: "Half the time, none of the guesswork." },
  { category: "Real projects deployed", short: "Projects", oldValue: "2", oldNumber: 2, oldLabel: "toy apps · maybe", newValue: "12", newNumber: 12, newLabel: "live on GitHub", win: "6× the proof employers can click." },
  { category: "Code feedback received", short: "Feedback", oldValue: "0", oldNumber: 0, oldLabel: "zero · you guess", newValue: "Every line", newLabel: "AI-graded by Claude", win: "Every line read — not a generic tip." },
];

// ─── Count-up hook (runs on mount when `run` is true) ─────────────────────────
function useCountUp(target: number | undefined, run: boolean, duration = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run || target === undefined) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target! * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

function fmt(n: number) { return n.toLocaleString(); }

// ─── Featured comparison (remounts per selected dimension → re-animates) ──────
function Featured({ comp, run }: { comp: Comparison; run: boolean }) {
  const oldC = useCountUp(comp.oldNumber, run);
  const newC = useCountUp(comp.newNumber, run);
  const oldDisplay = comp.oldNumber === undefined ? comp.oldValue : `${comp.oldPrefix ?? ""}${fmt(oldC)}${comp.oldSuffix ?? ""}`;
  const newDisplay = comp.newNumber === undefined ? comp.newValue : `${comp.newPrefix ?? ""}${fmt(newC)}${comp.newSuffix ?? ""}`;

  return (
    <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-center">
      {/* OLD */}
      <div className="text-center md:text-right">
        <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-slate-400 font-bold mb-2">The Old Way</p>
        <div className="relative inline-block font-black tabular-nums leading-none select-none text-slate-400"
          style={{ fontSize: "clamp(44px, 6.5vw, 80px)", letterSpacing: "-0.04em" }}>
          {oldDisplay}
          <span className="absolute top-1/2 left-0 h-1 sm:h-1.5 rounded-full w-full origin-left"
            style={{ background: "linear-gradient(90deg,#EF4444,#F87171)", transform: "scaleX(1)" }} />
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">{comp.oldLabel}</p>
      </div>

      {/* CENTER */}
      <div className="flex md:flex-col items-center justify-center gap-2 py-1">
        <span className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-bold">vs</span>
        <svg width="54" height="18" viewBox="0 0 54 18" fill="none" className="shrink-0 -rotate-90 md:rotate-0" aria-hidden="true">
          <path d="M 3 9 L 44 9" stroke="#0056CE" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 38 3 L 46 9 L 38 15" stroke="#0056CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      {/* NEW — the winner */}
      <div className="text-center md:text-left">
        <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold mb-2 text-brand">Square 1 AI</p>
        <div className="inline-block font-black tabular-nums leading-none select-none"
          style={{
            fontSize: "clamp(44px, 6.5vw, 80px)",
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #3388FF 0%, #0056CE 60%, #01224F 110%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 24px rgba(0,86,206,0.25))",
          }}>
          {newDisplay}
        </div>
        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-600">{comp.newLabel}</p>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Auto-advance through dimensions; pause on interaction.
  useEffect(() => {
    if (!visible || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % COMPARISONS.length), 3400);
    return () => clearInterval(t);
  }, [visible, paused]);

  const comp = COMPARISONS[active];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)" }}
    >
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-40 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[600px] h-[500px] rounded-full opacity-30 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Why Square 1</span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]" style={{ fontSize: "clamp(36px, 6vw, 84px)" }}>
            The math is{" "}
            <span style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              simple.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Same outcome. Completely different numbers. Tap a metric.
          </p>
        </div>

        {/* Interactive comparison card */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8"
          style={{ boxShadow: "0 24px 64px rgba(15,28,49,0.10)" }}
        >
          {/* Dimension tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {COMPARISONS.map((c, i) => (
              <button
                key={c.category}
                onClick={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all"
                style={
                  i === active
                    ? { background: "linear-gradient(135deg,#3388FF,#0056CE)", color: "#fff", boxShadow: "0 4px 16px rgba(0,86,206,0.30)" }
                    : { background: "#fff", color: "#475569", border: "1px solid #E2E8F0" }
                }
              >
                {c.short}
              </button>
            ))}
          </div>

          {/* Featured comparison — remounts per selection to re-animate */}
          <div className="min-h-[200px] flex flex-col justify-center">
            <Featured key={active} comp={comp} run={visible} />
          </div>

          {/* Per-dimension takeaway */}
          <div key={`win-${active}`} className="animate-fade-in-up mt-7 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm sm:text-base font-semibold text-slate-900">{comp.win}</p>
          </div>
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
