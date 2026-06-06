"use client";

import { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// "What Makes Us Different" — 5 rotating feature panels, side-by-side layout
// Rotates every 4 seconds. Pauses on hover. Rock-solid showcase.
// ═══════════════════════════════════════════════════════════════════════════════

const ROTATION_MS = 4000;

// ─── Visual components for each differentiator ────────────────────────────────

function CodeReviewVisual({ accent }: { accent: string }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0D1117", boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}25` }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8"
        style={{ background: "#161B22" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-xs text-slate-400 font-mono ml-2 flex-1">assignment.py</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: accent }}>SCORE 8/10</span>
      </div>
      <div className="p-5 font-mono text-[12px] leading-relaxed space-y-1">
        <div className="flex"><span className="text-emerald-400 w-5 select-none">✓</span><span className="text-slate-500 w-5">1</span><span><span style={{color:"#C792EA"}}>def </span><span style={{color:"#82AAFF"}}>chat</span><span className="text-slate-400">(msg: </span><span className="text-[#C3E88D]">str</span><span className="text-slate-400">):</span></span></div>
        <div className="flex"><span className="text-emerald-400 w-5 select-none">✓</span><span className="text-slate-500 w-5">2</span><span className="text-slate-300">    client = Anthropic()</span></div>
        <div className="flex"><span className="text-red-400 w-5 select-none">✗</span><span className="text-slate-500 w-5">3</span><span className="text-slate-300">    response = client.send(</span></div>
        <div className="flex"><span className="text-red-400 w-5 select-none">✗</span><span className="text-slate-500 w-5">4</span><span className="text-slate-300">      messages=[msg])</span></div>
        <div className="flex"><span className="text-emerald-400 w-5 select-none">✓</span><span className="text-slate-500 w-5">5</span><span><span style={{color:"#C792EA"}}>    return </span><span className="text-slate-300">response.text</span></span></div>

        <div className="mt-3 pt-3 border-t border-white/8 space-y-1">
          <div className="text-[11px] flex items-start gap-2 px-2 py-1.5 rounded"
            style={{background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)"}}>
            <span className="text-red-400 font-bold">L3</span>
            <span className="text-slate-300">Missing <code className="text-red-300">model</code> parameter — required by Anthropic API</span>
          </div>
          <div className="text-[11px] flex items-start gap-2 px-2 py-1.5 rounded"
            style={{background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)"}}>
            <span className="text-amber-400 font-bold">L4</span>
            <span className="text-slate-300">Should use <code className="text-amber-300">role</code> + <code className="text-amber-300">content</code> structure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorVisual({ accent }: { accent: string }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0D1117", boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}25` }}>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>S1</div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white leading-tight">Nova</p>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            Watching your code
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[78%] px-3 py-2 rounded-2xl rounded-tr-md text-xs text-white font-medium"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}>
            Why does my code throw on empty inputs?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>AI</div>
          <div className="flex-1 max-w-[88%] px-3 py-2.5 rounded-2xl rounded-tl-md text-xs text-slate-200 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p>On <code className="px-1 rounded text-[11px]" style={{background: `${accent}20`, color: accent}}>line 12</code> you index <code className="px-1 rounded text-[11px]" style={{background: `${accent}20`, color: accent}}>response.content[0]</code> without checking length.</p>
            <p className="mt-2 text-slate-400 text-[11px]">Add a guard: <code className="text-slate-300">if not response.content: return &quot;&quot;</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioVisual({ accent }: { accent: string }) {
  const repos = [
    { name: "ai-chatbot",        stars: 47, lang: "Python",     activity: 7 },
    { name: "rag-knowledge",     stars: 31, lang: "Python",     activity: 5 },
    { name: "production-saas",   stars: 62, lang: "TypeScript", activity: 8 },
    { name: "multi-agent",       stars: 44, lang: "Python",     activity: 6 },
  ];
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0D1117", boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}25` }}>
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white leading-tight">priya-learns</p>
          <p className="text-[10px] text-slate-400">12 repos · all deployed</p>
        </div>
        <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${accent}20`, color: accent }}>Verified</span>
      </div>
      <div className="p-4 space-y-2">
        {repos.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-3 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-blue-400 truncate">{r.name}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.lang === "Python" ? "#3776AB" : "#3178C6" }} />
              <span className="text-[10px] text-slate-500 hidden sm:inline">{r.lang}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-0.5">
                {[...Array(r.activity)].map((_, i) => (
                  <div key={i} className="w-1 h-3 rounded-sm bg-emerald-400" style={{ opacity: 0.3 + (i / r.activity) * 0.7 }} />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <span className="text-amber-400">★</span>
                <span className="tabular-nums">{r.stars}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdaptiveVisual({ accent }: { accent: string }) {
  const levels = [
    { label: "Beginner",     pct: 100, weeks: "Weeks 1–8",  status: "✓" },
    { label: "Intermediate", pct: 65,  weeks: "Weeks 9–16", status: "▸" },
    { label: "Advanced",     pct: 25,  weeks: "Weeks 17–24", status: "·" },
  ];
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 p-6"
      style={{ background: "#0D1117", boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}25` }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: accent }}>Your path</p>
        <span className="text-[10px] text-slate-500">Adaptive · personalised</span>
      </div>
      <div className="space-y-4">
        {levels.map((l) => (
          <div key={l.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-5 text-center"
                  style={{ color: l.pct > 0 ? accent : "#64748b" }}>{l.status}</span>
                <span className="text-sm font-bold text-white">{l.label}</span>
                <span className="text-[10px] text-slate-500">{l.weeks}</span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>{l.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${l.pct}%`,
                  background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                  boxShadow: `0 0 8px ${accent}40`,
                }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-5 border-t border-white/8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>AI</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          You&apos;re ready for <span className="font-bold text-white">Intermediate · Week 11</span> — RAG fundamentals.
        </p>
      </div>
    </div>
  );
}

function CareerVisual({ accent }: { accent: string }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 p-6"
      style={{ background: "#0D1117", boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}25` }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: accent }}>Course → Role</p>
        <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: "rgba(16,185,129,0.20)", color: "#34D399" }}>Hireable</span>
      </div>
      {/* Course → Role mapping */}
      <div className="space-y-2.5">
        {[
          { course: "Generative AI",          role: "AI Engineer",            salary: "$130–200k" },
          { course: "Machine Learning",       role: "ML Engineer",            salary: "$140–220k" },
          { course: "Cybersecurity",          role: "Cyber Engineer",         salary: "$110–180k" },
          { course: "Full Stack Development", role: "Full Stack Engineer",    salary: "$100–160k" },
        ].map((row) => (
          <div key={row.course} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-b-0">
            <span className="text-xs font-semibold text-slate-300 truncate">{row.course}</span>
            <div className="flex items-center gap-2 shrink-0">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5h11M8 1l4 4-4 4" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-bold text-white">{row.role}</span>
              <span className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${accent}20`, color: accent }}>{row.salary}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    n:        "01",
    eyebrow:  "AI Code Review",
    headline: "AI grades every line of code.",
    tagline:  "Not multiple choice. Every keystroke reviewed by Claude.",
    accent:   "#3388FF",
    facts:    ["Real-time feedback", "Line-by-line scoring", "Production-quality bar"],
    Visual:   CodeReviewVisual,
  },
  {
    n:        "02",
    eyebrow:  "Meet Nova",
    headline: "Nova knows your code.",
    tagline:  "Not generic advice. Specific feedback on your actual work, 24/7.",
    accent:   "#A78BFA",
    facts:    ["Context-aware", "Available anytime", "Adapts to your style"],
    Visual:   TutorVisual,
  },
  {
    n:        "03",
    eyebrow:  "Real Portfolio",
    headline: "12 deployed projects.",
    tagline:  "Walk into interviews with proof — not just a certificate.",
    accent:   "#10B981",
    facts:    ["All live URLs", "All on GitHub", "All verifiable"],
    Visual:   PortfolioVisual,
  },
  {
    n:        "04",
    eyebrow:  "Adaptive Curriculum",
    headline: "Adapts to your level.",
    tagline:  "Beginner or senior — same destination, different starting line.",
    accent:   "#F59E0B",
    facts:    ["Skill-based pacing", "Skip what you know", "Deep-dive what you don't"],
    Visual:   AdaptiveVisual,
  },
  {
    n:        "05",
    eyebrow:  "Career Tied",
    headline: "Every course → a real job.",
    tagline:  "Tied to a role. Tied to a salary. Tied to your future.",
    accent:   "#EC4899",
    facts:    ["12 career paths", "Real US salaries", "Verifiable outcomes"],
    Visual:   CareerVisual,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function AICopilotSlider() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused]   = useState(false);
  const [progress, setProgress]   = useState(0);
  const startRef = useRef<number>(0);
  const rafRef   = useRef<number>(0);

  // Auto-rotate with progress tracking
  useEffect(() => {
    if (isPaused) return;
    startRef.current = performance.now();
    setProgress(0);

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct = Math.min(1, elapsed / ROTATION_MS);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setActiveIdx((i) => (i + 1) % FEATURES.length);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeIdx, isPaused]);

  function jumpTo(idx: number) {
    setActiveIdx(idx);
    setProgress(0);
  }

  const feature = FEATURES[activeIdx];
  const Visual = feature.Visual;

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background accents — colour shifts with active feature */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${feature.accent}40 0%, transparent 70%)`, filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-25 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${feature.accent}30 0%, transparent 70%)`, filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Section heading — static */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            What Makes Us Different
          </span>
          <h2 className="mt-4 font-black tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
            Five things{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              nobody else does.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
            Why our students land offers in 6 months, not 3 years.
          </p>
        </div>

        {/* Side-by-side feature panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[480px] lg:min-h-[440px]">

          {/* LEFT — feature text */}
          <div key={`text-${activeIdx}`} className="animate-step-in">
            {/* Step number + eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="font-black tabular-nums leading-none select-none"
                style={{
                  fontSize: "clamp(48px, 6vw, 72px)",
                  background: `linear-gradient(180deg, ${feature.accent} 0%, ${feature.accent}55 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.04em",
                  filter: `drop-shadow(0 0 16px ${feature.accent}40)`,
                }}
              >
                {feature.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold"
                  style={{ color: feature.accent }}>
                  {feature.eyebrow}
                </span>
                <div className="h-px w-12" style={{ background: `${feature.accent}40` }} />
              </div>
            </div>

            {/* Headline */}
            <h3 className="font-black tracking-tight text-white leading-[1.05] mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em" }}>
              {feature.headline}
            </h3>

            {/* Tagline */}
            <p className="text-base lg:text-lg text-slate-400 leading-relaxed mb-6 max-w-md">
              {feature.tagline}
            </p>

            {/* Facts list */}
            <div className="space-y-2.5">
              {feature.facts.map((fact) => (
                <div key={fact} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: `${feature.accent}20`, color: feature.accent }}>
                    ✓
                  </span>
                  <span className="text-sm text-slate-300 font-medium">{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — visual */}
          <div key={`visual-${activeIdx}`} className="animate-mockup-in">
            <Visual accent={feature.accent} />
          </div>
        </div>

        {/* Bottom controls — dots + progress + counter */}
        <div className="flex flex-col items-center gap-4 mt-12 sm:mt-14">
          {/* Numbered tabs */}
          <div className="flex items-center gap-2">
            {FEATURES.map((f, i) => {
              const active = i === activeIdx;
              return (
                <button
                  key={i}
                  onClick={() => jumpTo(i)}
                  className={`group relative transition-all rounded-full font-mono text-[10px] font-black tabular-nums ${active ? "px-3 py-1.5" : "px-2 py-1.5"}`}
                  aria-label={`Show feature ${f.n}`}
                  style={{
                    background: active ? `${f.accent}20` : "transparent",
                    border: `1px solid ${active ? f.accent + "60" : "rgba(255,255,255,0.08)"}`,
                    color: active ? f.accent : "rgba(148,168,200,0.4)",
                    minHeight: "unset",
                    boxShadow: active ? `0 0 16px ${f.accent}30` : "none",
                  }}
                >
                  {f.n}
                </button>
              );
            })}
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 text-[10px] text-slate-500 tracking-wider uppercase">
            <span className="tabular-nums">{String(activeIdx + 1).padStart(2, "0")}</span>
            <span className="text-slate-700">/</span>
            <span className="tabular-nums">{String(FEATURES.length).padStart(2, "0")}</span>
            {isPaused && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-amber-400 font-semibold">Paused</span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-0.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${feature.accent}, ${feature.accent}cc)`,
                transition: progress === 0 ? "none" : "width 0.05s linear",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
