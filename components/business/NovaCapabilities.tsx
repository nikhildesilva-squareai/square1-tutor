"use client";

import { useEffect, useRef, useState } from "react";
import { NeuralField } from "@/components/ui/neural-field";

// Compact, interactive "Meet Nova" — full-black section (matches the main page's
// dark-band rhythm). Shows Nova's full value (tutor / reviews code / coaches the
// build / personalises), not just code-checking.

const CAPS = [
  { key: "tutor", title: "An AI tutor, 24/7", desc: "Answers questions on your lessons and your own code, right in the Study Hub — any time.", accent: "#3388FF", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { key: "review", title: "Reviews every line you write", desc: "Reads real submissions — strengths, fixes, and a score. Not a video, not a generic tip.", accent: "#0EA5E9", icon: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
  { key: "build", title: "Coaches you through building", desc: "10–12 real, deployed projects. You learn it, then you build it — the proof is in the building.", accent: "#0056CE", icon: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { key: "adapt", title: "Knows each learner", desc: "Adapts to every employee's level, weak topics, and current lesson — personal, at scale.", accent: "#1E40AF", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

function NovaPanel({ k }: { k: string }) {
  if (k === "tutor") {
    return (
      <div className="p-4 space-y-2.5">
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-white/10 px-3 py-2 text-[11px] text-slate-200">Why does my API call fail intermittently?</div>
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm px-3 py-2 text-[11px] text-slate-100" style={{ background: "rgba(51,136,255,0.18)" }}>You&apos;re missing a timeout + error handling. Add <span className="font-mono">timeout=5</span> and call <span className="font-mono">raise_for_status()</span> — here&apos;s why that fixes the flakiness…</div>
        <div className="ml-auto max-w-[55%] rounded-2xl rounded-br-sm bg-white/10 px-3 py-2 text-[11px] text-slate-200">That worked — thanks!</div>
      </div>
    );
  }
  if (k === "review") {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">✓ Nova&apos;s review</span>
          <span className="text-[11px] font-black text-emerald-300 tabular-nums">92/100</span>
        </div>
        <pre className="text-[10.5px] leading-[1.6] font-mono text-[#E6EDF3] whitespace-pre-wrap">{`def get_user(uid: str) -> str | None:
    r = requests.get(f"{API}/{uid}", timeout=5)
    r.raise_for_status()
    return r.json().get("name")`}</pre>
        <p className="text-[10px] text-slate-400 mt-2">+ Added type hints, timeout &amp; error handling.</p>
      </div>
    );
  }
  if (k === "build") {
    return (
      <div className="p-4 space-y-2">
        {["rag-support-agent", "vision-defect-detector", "trading-dashboard-api"].map((n) => (
          <div key={n} className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg border border-white/10">
            <span className="font-mono text-slate-300">{n}</span>
            <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />live</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 pt-0.5">10–12 deployed projects — the portfolio is the proof.</p>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-2.5">
      {[{ t: "Prompting", v: 82 }, { t: "RAG systems", v: 44 }, { t: "Agents", v: 31 }].map((b) => (
        <div key={b.t} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-20 truncate">{b.t}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${b.v}%`, background: b.v < 50 ? "#F87171" : b.v < 70 ? "#FBBF24" : "#34D399" }} /></div>
          <span className="text-[10px] tabular-nums text-slate-500 w-7 text-right">{b.v}%</span>
        </div>
      ))}
      <p className="text-[10px] text-slate-400">Path adapts to each learner&apos;s gaps.</p>
    </div>
  );
}

export function NovaCapabilities() {
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
    const id = setInterval(() => setActive((a) => (a + 1) % CAPS.length), 3000);
    return () => clearInterval(id);
  }, [visible, paused]);

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-24 px-4 sm:px-6 lg:px-8" style={{ background: "linear-gradient(180deg,#F4F8FF 0%,#FFFFFF 100%)" }}>
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(0,86,206,0.07) 0%,transparent 70%)", filter: "blur(110px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 70%)", filter: "blur(110px)" }} />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-9">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Meet Nova</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">More than a code checker.</h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Nova tutors every employee, reviews their real code, and coaches them through building deployed projects. They learn it — then prove it by building it.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* Capability rows */}
          <div className="space-y-2.5">
            {CAPS.map((c, i) => {
              const on = i === active;
              return (
                <button key={c.key} onClick={() => setActive(i)}
                  className="w-full text-left flex items-start gap-3 rounded-xl border p-3.5 transition-all"
                  style={{ borderColor: on ? `${c.accent}66` : "#E2E8F0", background: on ? `${c.accent}12` : "#FFFFFF", boxShadow: on ? `0 8px 24px ${c.accent}22` : "0 1px 3px rgba(15,28,49,0.04)" }}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`, transform: on ? "scale(1.05)" : "scale(1)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-900 leading-snug">{c.title}</span>
                    <span className="block text-xs text-slate-600 leading-relaxed mt-0.5">{c.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nova panel — neural field glows behind the UI (dark = perfect canvas) */}
          <div className="relative rounded-2xl border border-white/10 overflow-hidden flex flex-col" style={{ background: "linear-gradient(180deg,#0B1626 0%,#070E1A 100%)", boxShadow: "0 20px 56px rgba(5,11,20,0.4)" }}>
            <NeuralField color="#3388FF" />
            <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300">Nova</span>
              <span className="ml-auto text-[10px] text-slate-500">{CAPS[active].title}</span>
            </div>
            <div key={active} className="relative z-10 flex-1 animate-fade-in-up"><NovaPanel k={CAPS[active].key} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
