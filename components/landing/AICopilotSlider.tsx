"use client";

import { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// Auto-rotating slider — consolidates Terminal + Tutor + Portfolio into one
// section. Rotates every 5s. Pauses on hover.
// ═══════════════════════════════════════════════════════════════════════════════

const ROTATION_MS = 5000;

// ─── Visual 1: Code terminal with AI feedback ─────────────────────────────────
function TerminalVisual() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0D1117", boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset" }}>
      {/* Window chrome */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8"
        style={{ background: "#161B22" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-xs text-slate-400 font-mono ml-2 flex-1">assessment.py</span>
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI graded
        </span>
      </div>

      {/* Code */}
      <div className="p-5 font-mono text-[13px] leading-relaxed">
        <div className="flex"><span className="text-slate-600 w-6 select-none">1</span>
          <span><span style={{ color: "#C792EA" }}>def </span><span style={{ color: "#82AAFF" }}>chat_with_ai</span><span style={{ color: "#BFC7D5" }}>(</span><span style={{ color: "#FFCB6B" }}>message</span><span style={{ color: "#BFC7D5" }}>: </span><span style={{ color: "#C3E88D" }}>str</span><span style={{ color: "#BFC7D5" }}>):</span></span>
        </div>
        <div className="flex"><span className="text-slate-600 w-6 select-none">2</span>
          <span><span style={{ color: "#BFC7D5" }}>    client </span><span style={{ color: "#89DDFF" }}>= </span><span style={{ color: "#FFCB6B" }}>Anthropic</span><span style={{ color: "#BFC7D5" }}>()</span></span>
        </div>
        <div className="flex"><span className="text-slate-600 w-6 select-none">3</span>
          <span><span style={{ color: "#BFC7D5" }}>    response </span><span style={{ color: "#89DDFF" }}>= </span><span style={{ color: "#82AAFF" }}>client</span><span style={{ color: "#BFC7D5" }}>.messages.</span><span style={{ color: "#82AAFF" }}>create</span><span style={{ color: "#BFC7D5" }}>(...)</span></span>
        </div>
        <div className="flex"><span className="text-slate-600 w-6 select-none">4</span>
          <span><span style={{ color: "#BFC7D5" }}>    </span><span style={{ color: "#C792EA" }}>return </span><span style={{ color: "#82AAFF" }}>response</span><span style={{ color: "#BFC7D5" }}>.content[</span><span style={{ color: "#F78C6C" }}>0</span><span style={{ color: "#BFC7D5" }}>].text</span></span>
        </div>

        {/* Feedback */}
        <div className="mt-4 pt-4 border-t border-white/8 space-y-1.5">
          <div className="flex justify-between items-center text-xs rounded-lg px-3 py-2"
            style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <span className="text-emerald-400">✓ Good use of type hints</span>
            <span className="text-emerald-400 font-bold">+1</span>
          </div>
          <div className="flex justify-between items-center text-xs rounded-lg px-3 py-2"
            style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <span className="text-red-400">✗ Missing error handling</span>
            <span className="text-red-400 font-bold">-1</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded"
                  style={{ background: i < 7 ? "linear-gradient(135deg, #0056CE, #6366f1)" : "rgba(255,255,255,0.07)" }} />
              ))}
            </div>
            <span className="text-white font-bold text-sm tabular-nums">
              Score: <span className="text-brand text-base">7</span><span className="text-slate-500">/10</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visual 2: AI tutor chat ──────────────────────────────────────────────────
function ChatVisual() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0D1117", boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #0056CE, #4F46E5)" }}>
          S1
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">Square 1 AI Tutor</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online · watching your code
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-4">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-md text-sm text-white font-medium"
            style={{ background: "linear-gradient(135deg, #0056CE, #2563EB)" }}>
            Why is my RAG pipeline returning wrong answers?
          </div>
        </div>

        {/* AI response */}
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1"
            style={{ background: "linear-gradient(135deg, #0056CE, #4F46E5)" }}>
            AI
          </div>
          <div className="flex-1 max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md text-sm text-slate-200 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="mb-3">Your chunk size of 2,000 tokens is causing context bleed. Three fixes:</p>
            <ol className="space-y-1.5 text-[13px] text-slate-300">
              <li><span className="text-brand-light font-bold">1.</span> Reduce chunk size to <code className="px-1.5 py-0.5 rounded text-[12px]" style={{ background: "rgba(99,102,241,0.15)", color: "#A78BFA" }}>400 tokens</code></li>
              <li><span className="text-brand-light font-bold">2.</span> Bump similarity threshold from <code className="px-1.5 py-0.5 rounded text-[12px]" style={{ background: "rgba(99,102,241,0.15)", color: "#A78BFA" }}>0.5 → 0.75</code></li>
              <li><span className="text-brand-light font-bold">3.</span> Add metadata filtering by source</li>
            </ol>
            <p className="mt-3 text-[12px] text-slate-500">~40% accuracy lift. Want me to show the updated code?</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visual 3: GitHub portfolio ───────────────────────────────────────────────
function GitHubVisual() {
  // Deterministic contribution grid — 7 rows × 30 cols
  const grid: number[] = [];
  for (let i = 0; i < 7 * 30; i++) {
    // Pseudo-random but deterministic
    grid.push(((i * 73 + 17) % 11) - 4);
  }

  const repos = [
    { name: "ai-chatbot-v2",      lang: "Python",     stars: 47, bars: 7, langColor: "#3776AB" },
    { name: "rag-knowledge-base", lang: "Python",     stars: 31, bars: 5, langColor: "#3776AB" },
    { name: "research-agent",     lang: "Python",     stars: 28, bars: 6, langColor: "#3776AB" },
    { name: "production-saas",    lang: "TypeScript", stars: 62, bars: 8, langColor: "#3178C6" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0D1117", boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">priya-learns</p>
          <p className="text-[11px] text-slate-400 mt-0.5">12 repositories · all live</p>
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: "rgba(16,185,129,0.20)", color: "#34D399" }}>
          ✓ Verified
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Contribution grid */}
        <div>
          <p className="text-[11px] text-slate-500 mb-2">Contribution activity · 12 months</p>
          <div className="grid grid-cols-30 gap-0.5" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
            {grid.map((v, i) => {
              const intensity = Math.max(0, Math.min(4, v));
              const opacity = intensity === 0 ? 0.08 : 0.2 + intensity * 0.2;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{ background: intensity === 0 ? "rgba(255,255,255,0.05)" : `rgba(34,197,94,${opacity})` }}
                />
              );
            })}
          </div>
        </div>

        {/* Repo list */}
        <div className="space-y-2 pt-2">
          {repos.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 py-2 border-t border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#64748B">
                  <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16H3.75A1.75 1.75 0 0 1 2 14.25Z"/>
                </svg>
                <span className="text-sm font-mono text-blue-400 truncate">{r.name}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.langColor }} />
                <span className="text-[10px] text-slate-500 hidden sm:inline">{r.lang}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex gap-0.5">
                  {[...Array(r.bars)].map((_, i) => (
                    <div key={i} className="w-1.5 h-3 rounded-sm bg-emerald-400" style={{ opacity: 0.3 + (i / r.bars) * 0.7 }} />
                  ))}
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-0.5">
                  <span className="text-amber-400">★</span>
                  <span className="tabular-nums">{r.stars}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES: {
  eyebrow:     string;
  titleStart:  string;
  titleAccent: string;
  description: string;
  accent:      string;
  Visual:      () => React.ReactElement;
}[] = [
  {
    eyebrow:     "Built-in AI",
    titleStart:  "AI grades your code.",
    titleAccent: " Instantly.",
    description: "Not just ticking boxes. Real feedback on every line you write.",
    accent:      "#3388FF",
    Visual:      TerminalVisual,
  },
  {
    eyebrow:     "24/7 AI Tutor",
    titleStart:  "Your AI tutor",
    titleAccent: " knows your code.",
    description: "Not generic advice. Specific feedback on your actual work, in real time.",
    accent:      "#A78BFA",
    Visual:      ChatVisual,
  },
  {
    eyebrow:     "Real Portfolio",
    titleStart:  "Graduate with proof,",
    titleAccent: " not just a certificate.",
    description: "Employers see 12 working repos. All deployed. All verifiable. All yours.",
    accent:      "#10B981",
    Visual:      GitHubVisual,
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
        setActiveIdx((i) => (i + 1) % SLIDES.length);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeIdx, isPaused]);

  function jumpTo(idx: number) {
    setActiveIdx(idx);
    setProgress(0);
  }

  const slide = SLIDES[activeIdx];
  const Visual = slide.Visual;

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background accents — colour shifts with active slide */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-25 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${slide.accent}40 0%, transparent 70%)`, filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-20 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${slide.accent}30 0%, transparent 70%)`, filter: "blur(90px)" }} />

      <div className="relative max-w-6xl mx-auto">

        {/* Heading area — crossfades with key={activeIdx} */}
        <div className="text-center mb-10 sm:mb-14 min-h-[180px] sm:min-h-[200px] flex flex-col justify-center">
          <div key={`head-${activeIdx}`} className="animate-step-in">
            <span
              className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase font-bold"
              style={{ color: slide.accent }}
            >
              {slide.eyebrow}
            </span>
            <h2 className="mt-4 font-black tracking-tight text-white leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5.5vw, 72px)" }}>
              {slide.titleStart}
              <span style={{
                background: `linear-gradient(135deg, ${slide.accent} 0%, #FFFFFF 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {slide.titleAccent}
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Visual area — crossfades with key */}
        <div className="relative min-h-[420px] sm:min-h-[460px] flex items-center justify-center mb-10">
          <div key={`visual-${activeIdx}`} className="w-full animate-mockup-in">
            <Visual />
          </div>
        </div>

        {/* Bottom controls — dots + progress bar */}
        <div className="flex flex-col items-center gap-4">
          {/* Dot pagination */}
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => {
              const active = i === activeIdx;
              return (
                <button
                  key={i}
                  onClick={() => jumpTo(i)}
                  className="group relative flex items-center justify-center transition-all"
                  aria-label={`Show slide ${i + 1}`}
                  style={{ minHeight: "unset" }}
                >
                  <span
                    className="block rounded-full transition-all duration-500"
                    style={{
                      width:   active ? 32 : 8,
                      height:  8,
                      background: active ? s.accent : "rgba(255,255,255,0.15)",
                      boxShadow: active ? `0 0 12px ${s.accent}` : "none",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Slide counter + pause indicator */}
          <div className="flex items-center gap-3 text-[10px] text-slate-500 tracking-wider uppercase">
            <span className="tabular-nums">{String(activeIdx + 1).padStart(2, "0")}</span>
            <span className="text-slate-700">/</span>
            <span className="tabular-nums">{String(SLIDES.length).padStart(2, "0")}</span>
            {isPaused && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-amber-400 font-semibold">Paused</span>
              </>
            )}
          </div>

          {/* Thin progress bar */}
          <div className="w-full max-w-xs h-0.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${slide.accent}, ${slide.accent}cc)`,
                transition: progress === 0 ? "none" : "width 0.05s linear",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
