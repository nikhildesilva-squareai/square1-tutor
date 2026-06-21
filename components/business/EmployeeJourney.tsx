"use client";

import { useEffect, useRef, useState } from "react";

// "See exactly what your staff do" — interactive, auto-advancing walkthrough of
// the employee experience, each step with a small product visual. The value
// demonstration: a manager watches how a learner goes from placed → proven.

const STEPS = [
  { label: "Skill check", title: "Every employee gets placed", desc: "A 20-question, AI-graded assessment finds each person's real level — nobody starts where they don't belong.", accent: "#0056CE" },
  { label: "Personalised path", title: "A path built from their gaps", desc: "We map weak vs strong topics and build a tailored track — junior to senior, no filler, no boredom.", accent: "#0EA5E9" },
  { label: "Build & deploy", title: "They ship real projects", desc: "10–12 deployable, real-world projects — pushed to GitHub with a live URL. Not toy exercises.", accent: "#06B6D4" },
  { label: "Nova reviews", title: "Every line gets reviewed", desc: "Nova reads their actual code — strengths, fixes, and a score. Personalised feedback, at team scale.", accent: "#10B981" },
  { label: "Verifiable proof", title: "They finish with proof", desc: "A public portfolio of deployed work + a verifiable certificate — capability you (and any employer) can check.", accent: "#F59E0B" },
];

function Visual({ step }: { step: number }) {
  const wrap = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-full";
  if (step === 0) {
    return (
      <div className={wrap}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Assessment · Generative AI</p>
        <p className="text-sm font-bold text-slate-800 mb-3">Which best describes RAG?</p>
        {["Retrieve relevant info, then answer", "Train the model faster", "Compress images"].map((o, i) => (
          <div key={o} className={`text-xs mb-1.5 px-3 py-2 rounded-lg border ${i === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold" : "border-slate-200 text-slate-500"}`}>{i === 0 ? "✓ " : ""}{o}</div>
        ))}
        <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">Level placed</span>
          <span className="text-xs font-black text-slate-900">Intermediate · 74/100</span>
        </div>
      </div>
    );
  }
  if (step === 1) {
    const bars = [{ t: "Prompting", v: 82 }, { t: "RAG systems", v: 44 }, { t: "Agents", v: 31 }, { t: "Evaluation", v: 67 }];
    return (
      <div className={wrap}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Personalised path · gaps first</p>
        {bars.map((b) => (
          <div key={b.t} className="flex items-center gap-3 mb-2">
            <span className="text-[11px] text-slate-600 w-24 truncate">{b.t}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${b.v}%`, background: b.v < 50 ? "#F87171" : b.v < 70 ? "#FBBF24" : "#34D399" }} /></div>
            <span className="text-[10px] tabular-nums text-slate-400 w-7 text-right">{b.v}%</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 mt-2">Track auto-built to close the red & amber gaps first.</p>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className={wrap}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Projects · deployed</p>
        {[{ n: "rag-support-agent", s: "live" }, { n: "vision-defect-detector", s: "live" }, { n: "trading-dashboard-api", s: "live" }].map((p) => (
          <div key={p.n} className="flex items-center justify-between text-xs font-mono mb-2 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-slate-700">{p.n}</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-sans font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{p.s}</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 mt-1">Each pushed to GitHub with a public live URL.</p>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="rounded-2xl border border-white/10 overflow-hidden h-full" style={{ background: "#0D1117" }}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#161B22" }}>
          <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">✓ Nova&apos;s review</span>
          <span className="text-[10px] font-black text-emerald-300">92/100</span>
        </div>
        <pre className="p-4 text-[11px] leading-[1.6] font-mono text-[#E6EDF3] whitespace-pre-wrap">{`def get_user(uid: str) -> str | None:
    # ✓ f-string, timeout, error handling
    r = requests.get(f"{API}/{uid}", timeout=5)
    r.raise_for_status()
    return r.json().get("name")`}</pre>
        <div className="px-4 pb-3 text-[10px] text-slate-400">+ Added type hints, timeout & error handling.</div>
      </div>
    );
  }
  return (
    <div className={wrap}>
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
        <span className="text-sm font-black text-slate-900">Verified by Square 1</span>
      </div>
      <p className="text-xs text-slate-600 mb-3">AI Engineer · 12 projects deployed · portfolio public</p>
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Credential</span>
        <span className="text-[11px] font-mono font-bold text-slate-800">SQ1-7F3A-9C21</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-2">Verifiable in one click — not a PDF anyone can fake.</p>
    </div>
  );
}

export function EmployeeJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3200);
    return () => clearInterval(id);
  }, [visible, paused]);

  const s = STEPS[active];

  return (
    <section ref={ref} className="max-w-5xl mx-auto px-5 sm:px-6 py-14">
      <div className="text-center mb-9">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">What your staff actually do</span>
        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">See exactly how your team improves.</h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">Not videos they half-watch — a measured path from each person&apos;s real level to deployed, reviewed proof of skill.</p>
      </div>

      {/* Step tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {STEPS.map((st, i) => {
          const on = i === active;
          return (
            <button key={st.label} onClick={() => setActive(i)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border transition-all"
              style={on
                ? { background: st.accent, color: "#fff", borderColor: st.accent, boxShadow: `0 8px 20px ${st.accent}40` }
                : { background: "#fff", color: "#64748B", borderColor: "rgba(15,28,49,0.12)" }}>
              <span className="tabular-nums">{i + 1}</span>{st.label}
            </button>
          );
        })}
      </div>

      {/* Active step */}
      <div className="grid lg:grid-cols-2 gap-8 items-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div key={active} className="animate-fade-in-up">
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: s.accent }}>Step {active + 1} of {STEPS.length} · {s.label}</span>
          <h3 className="mt-2 text-2xl font-black text-slate-900 leading-tight">{s.title}</h3>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{s.desc}</p>
          <div className="mt-5 flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} aria-label={`Step ${i + 1}`} onClick={() => setActive(i)}
                className="h-1.5 rounded-full transition-all" style={{ width: i === active ? 28 : 8, background: i === active ? s.accent : "#CBD5E1" }} />
            ))}
          </div>
        </div>
        <div className="min-h-[220px]"><Visual step={active} /></div>
      </div>
    </section>
  );
}
