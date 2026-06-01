"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ── Syntax-highlighted code tokens ──────────────────────────────────────────
const PURPLE = "#C792EA";
const BLUE   = "#82AAFF";
const GREEN  = "#C3E88D";
const YELLOW = "#FFCB6B";
const ORANGE = "#F78C6C";
const CYAN   = "#89DDFF";
const GREY   = "#BFC7D5";

const CODE_LINES: { text: string; color: string }[][] = [
  [
    { text: "def ",            color: PURPLE },
    { text: "chat_with_ai",   color: BLUE   },
    { text: "(",               color: GREY   },
    { text: "message",         color: YELLOW },
    { text: ": ",              color: GREY   },
    { text: "str",             color: GREEN  },
    { text: ", ",              color: GREY   },
    { text: "history",         color: YELLOW },
    { text: ": ",              color: GREY   },
    { text: "list",            color: GREEN  },
    { text: ") -> ",           color: GREY   },
    { text: "str",             color: GREEN  },
    { text: ":",               color: GREY   },
  ],
  [
    { text: "    client",      color: GREY   },
    { text: " = ",             color: CYAN   },
    { text: "Anthropic",       color: YELLOW },
    { text: "()",              color: GREY   },
  ],
  [
    { text: "    response",    color: GREY   },
    { text: " = ",             color: CYAN   },
    { text: "client",          color: BLUE   },
    { text: ".messages.",      color: GREY   },
    { text: "create",          color: BLUE   },
    { text: "(",               color: GREY   },
  ],
  [
    { text: '        model',   color: GREY   },
    { text: "=",               color: CYAN   },
    { text: '"claude-sonnet-4-5"', color: GREEN },
    { text: ",",               color: GREY   },
  ],
  [
    { text: "        messages", color: GREY  },
    { text: "=",               color: CYAN   },
    { text: "history",         color: YELLOW },
    { text: " + ",             color: CYAN   },
    { text: '[{"role": ',      color: GREY   },
    { text: '"user"',          color: GREEN  },
    { text: ", ",              color: GREY   },
    { text: '"content"',       color: GREEN  },
    { text: ": ",              color: GREY   },
    { text: "message",         color: YELLOW },
    { text: "}]",              color: GREY   },
  ],
  [
    { text: "    )",           color: GREY   },
  ],
  [
    { text: "    ",            color: GREY   },
    { text: "return ",         color: PURPLE },
    { text: "response",        color: BLUE   },
    { text: ".content[",       color: GREY   },
    { text: "0",               color: ORANGE },
    { text: "].text",          color: GREY   },
  ],
];

const CODE_PLAIN = CODE_LINES.map(l => l.map(t => t.text).join("")).join("\n");

const FEEDBACK = [
  { ok: true,  text: "Good use of type hints",                     mark: "+1 mark" },
  { ok: true,  text: "Correct Anthropic client initialisation",    mark: "+1 mark" },
  { ok: false, text: "Missing error handling for rate limits",      mark: "-1 mark" },
  { ok: false, text: "History not validated before passing to API", mark: "-1 mark" },
];

type Phase = "typing" | "scanning" | "grading" | "feedback" | "done";

// ── Circular arc SVG helper ─────────────────────────────────────────────────
function CircleProgress({ pct, size = 56, stroke = 5, color = "#0056CE" }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r   = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }} />
    </svg>
  );
}

// ── Mini bar chart ──────────────────────────────────────────────────────────
const XP_BARS = [55, 80, 65, 92, 48, 88, 72];

// ── Floating metric panels ──────────────────────────────────────────────────
// These replace the old project cards — clean, data-forward, premium feel
const METRIC_PANELS = [
  // Top-left — weekly progress arc
  {
    id: "progress",
    anim: "animate-float-1",
    pos: "top-[26%] left-[2%] xl:left-[5%]",
    delay: "0s",
    glow: "rgba(0,86,206,0.20)",
    content: (
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
          <CircleProgress pct={62} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">5/8</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white leading-tight">Week 5 of 8</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Gen AI · On track</p>
          <div className="mt-1.5 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] text-emerald-400 font-medium">62% complete</span>
          </div>
        </div>
      </div>
    ),
  },
  // Bottom-left — XP bar chart
  {
    id: "xp",
    anim: "animate-float-3",
    pos: "top-[58%] left-[2%] xl:left-[4%]",
    delay: "1s",
    glow: "rgba(99,102,241,0.20)",
    content: (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-white">Daily XP</p>
          <span className="text-[10px] text-indigo-400 font-medium">+340 today</span>
        </div>
        <div className="flex items-end gap-1 h-8">
          {XP_BARS.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: i === XP_BARS.length - 1
                  ? "linear-gradient(180deg, #6366f1, #0056CE)"
                  : "rgba(99,102,241,0.35)",
                transition: `height 0.8s ease ${i * 0.08}s`,
              }} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-500">Mon</span>
          <span className="text-[9px] text-slate-500">Today</span>
        </div>
      </div>
    ),
  },
  // Top-right — assessment score
  {
    id: "score",
    anim: "animate-float-2",
    pos: "top-[26%] right-[2%] xl:right-[5%]",
    delay: "0.5s",
    glow: "rgba(16,185,129,0.20)",
    content: (
      <div>
        <p className="text-[10px] text-slate-400 mb-1">Last Assessment</p>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-3xl font-black text-white tabular-nums">94</span>
          <span className="text-sm text-slate-400">/100</span>
        </div>
        {/* Mini score bar */}
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-400"
            style={{ width: "94%", transition: "width 1s ease 0.5s" }} />
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[10px] text-emerald-400 font-medium">↑ +12 pts</span>
          <span className="text-[9px] text-slate-500">vs last week</span>
        </div>
      </div>
    ),
  },
  // Bottom-right — streak
  {
    id: "streak",
    anim: "animate-float-4",
    pos: "top-[58%] right-[2%] xl:right-[4%]",
    delay: "1.5s",
    glow: "rgba(245,158,11,0.20)",
    content: (
      <div className="text-center">
        <div className="text-3xl mb-1">🔥</div>
        <p className="text-2xl font-black text-white tabular-nums">32</p>
        <p className="text-[10px] text-amber-400 font-semibold">day streak</p>
        {/* Mini week dots */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`w-4 h-4 rounded-full ${i < 6 ? "bg-amber-400" : "bg-white/10"}`} />
              <span className="text-[8px] text-slate-500">{d}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function HeroSection() {
  const [phase,       setPhase]       = useState<Phase>("typing");
  const [typedCount,  setTypedCount]  = useState(0);
  const [showSyntax,  setShowSyntax]  = useState(false);
  const [feedbackIdx, setFeedbackIdx] = useState(-1);
  const [scoreCount,  setScoreCount]  = useState(0);
  const [loopKey,     setLoopKey]     = useState(0); // increment to restart
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── Full reset → triggers re-run via loopKey ─────────────────────────────
  const restartSequence = useCallback(() => {
    clearAllTimers();
    setPhase("typing");
    setTypedCount(0);
    setShowSyntax(false);
    setFeedbackIdx(-1);
    setScoreCount(0);
    setLoopKey(k => k + 1);
  }, [clearAllTimers]);

  // ── Main animation sequence ──────────────────────────────────────────────
  useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      i++;
      setTypedCount(i);
      if (i >= CODE_PLAIN.length) {
        clearInterval(typing);
        setShowSyntax(true);

        // Phase: scanning
        timerRef.current = setTimeout(() => {
          setPhase("scanning");

          // Phase: grading
          timerRef.current = setTimeout(() => {
            setPhase("grading");

            // Phase: feedback
            timerRef.current = setTimeout(() => {
              setPhase("feedback");
              let idx = 0;
              const fb = setInterval(() => {
                setFeedbackIdx(idx);
                idx++;
                if (idx >= FEEDBACK.length) {
                  clearInterval(fb);
                  // Score counter
                  let s = 0;
                  const sc = setInterval(() => {
                    s++;
                    setScoreCount(s);
                    if (s >= 7) {
                      clearInterval(sc);
                      setPhase("done");
                      // ✨ Auto-restart after 3.5s pause
                      timerRef.current = setTimeout(() => {
                        restartSequence();
                      }, 3500);
                    }
                  }, 120);
                }
              }, 380);
            }, 1400);
          }, 700);
        }, 800);
      }
    }, 22);

    return () => {
      clearInterval(typing);
      clearAllTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopKey]); // loopKey changes trigger a full restart

  const typedSoFar  = CODE_PLAIN.slice(0, typedCount);
  const currentLine = typedSoFar.split("\n").length - 1;
  const isTyping    = phase === "typing";
  const isScanning  = phase === "scanning";
  const isGrading   = phase === "grading";
  const isFeedback  = phase === "feedback" || phase === "done";
  const isDone      = phase === "done";

  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col" style={{ background: "#050B14" }}>

      {/* ── Gradient blobs ──────────────────────────────────────────── */}
      <div className="animate-blob-1 pointer-events-none absolute -top-40 -left-40 rounded-full"
        style={{ width: 700, height: 700, opacity: 0.18,
          background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="animate-blob-2 pointer-events-none absolute -bottom-48 -right-20 rounded-full"
        style={{ width: 600, height: 600, opacity: 0.14,
          background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 400, height: 400, opacity: 0.06,
          background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)", filter: "blur(80px)" }} />

      {/* ── Floating metric panels ───────────────────────────────────── */}
      {METRIC_PANELS.map((panel) => (
        <div key={panel.id}
          className={`hidden xl:block absolute z-20 ${panel.anim} ${panel.pos}`}
          style={{ width: 180, animationDelay: panel.delay }}>
          <div className="rounded-2xl border border-white/10 p-3.5 transition-transform hover:scale-[1.03]"
            style={{
              background: "rgba(13,17,23,0.75)",
              backdropFilter: "blur(16px)",
              boxShadow: `0 0 28px ${panel.glow}, 0 8px 32px rgba(0,0,0,0.5)`,
            }}>
            {panel.content}
          </div>
        </div>
      ))}

      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <nav className="relative z-30 w-full border-b border-white/[0.06]"
        style={{ backdropFilter: "blur(16px)", background: "rgba(5,11,20,0.65)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="light" size="md" />
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-all px-4 py-2 rounded-lg border border-white/[0.12] hover:border-white/30 hover:bg-white/[0.06]">
              Sign In
            </Link>
            <Link href="/signup"
              className="text-sm font-bold px-5 py-2 rounded-lg bg-white text-brand hover:bg-slate-100 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:-translate-y-px">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero body ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 pt-10 pb-20">

        {/* Status badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI-powered · Personalised · Project-based
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.07] tracking-tight mb-5">
          The AI tutor that
          <br />
          <span style={{
            background: "linear-gradient(135deg, #3388FF 0%, #6366f1 55%, #8B5CF6 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            gets you hired.
          </span>
        </h1>

        <p className="text-center text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
          Get assessed in 30 minutes. Get a personalised plan.
          <br className="hidden sm:block" />
          Build 10–12 real projects. Land the job.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <Link href="/signup"
            className="px-8 py-4 rounded-xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(0,86,206,0.3)] hover:-translate-y-0.5">
            Start for free →
          </Link>
          <Link href="/login"
            className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/[0.08] hover:border-white/40 transition-all">
            Sign in
          </Link>
        </div>

        {/* ── Code Terminal ─────────────────────────────────────────── */}
        <div
          className={`w-full max-w-2xl rounded-2xl overflow-hidden border transition-all duration-700 ${
            isGrading   ? "animate-glow-pulse border-brand/50" :
            isFeedback  ? "border-brand/25 shadow-[0_0_40px_rgba(0,86,206,0.15)]" :
            isDone      ? "border-emerald-500/20" :
            "border-white/[0.10]"
          }`}
          style={{ background: "#0D1117" }}>

          {/* Window chrome */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]"
            style={{ background: "#161B22" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <span className="text-xs text-slate-400 font-mono ml-2 flex-1">assessment.py</span>
            {isGrading && (
              <div className="flex items-center gap-1.5 text-[11px] text-brand">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                AI grading…
              </div>
            )}
            {isDone && <span className="text-[11px] text-emerald-400 font-semibold">✓ Graded</span>}
          </div>

          {/* Code body */}
          <div className="relative p-5 font-mono text-sm" style={{ minHeight: 230 }}>

            {/* Scan beam */}
            {isScanning && (
              <div className="animate-scan absolute left-0 right-0 pointer-events-none z-10"
                style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #0056CE 40%, #6366f1 60%, transparent 100%)" }} />
            )}

            {/* Code lines with line numbers */}
            <div className="leading-[1.75]">
              {CODE_LINES.map((line, lineIdx) => {
                const lineStart = CODE_LINES
                  .slice(0, lineIdx)
                  .reduce((acc, l) => acc + l.map(t => t.text).join("").length + 1, 0);
                const lineText   = line.map(t => t.text).join("");
                const charsTyped = Math.max(0, Math.min(lineText.length, typedCount - lineStart));
                if (charsTyped === 0 && lineIdx > 0 && typedCount < lineStart) return null;

                return (
                  <div key={lineIdx} className="flex items-start">
                    <span className="select-none text-slate-600 text-right mr-5 shrink-0 tabular-nums"
                      style={{ width: 18, fontSize: 11 }}>
                      {lineIdx + 1}
                    </span>
                    {showSyntax ? (
                      <span className="animate-syntax-fade">
                        {line.map((token, ti) => (
                          <span key={ti} style={{ color: token.color }}>{token.text}</span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        {lineText.slice(0, charsTyped)}
                        {lineIdx === currentLine && isTyping && (
                          <span className="inline-block w-0.5 h-4 bg-slate-300 ml-px align-middle"
                            style={{ animation: "cursor-blink 1s step-end infinite" }} />
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grading indicator */}
            {isGrading && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center gap-2 text-xs text-slate-400">
                <span className="text-brand text-base">🤖</span>
                <span>AI analysing your submission</span>
                <div className="flex gap-1 ml-1">
                  <span className="dot-1 w-1.5 h-1.5 rounded-full bg-brand" />
                  <span className="dot-2 w-1.5 h-1.5 rounded-full bg-brand" />
                  <span className="dot-3 w-1.5 h-1.5 rounded-full bg-brand" />
                </div>
              </div>
            )}

            {/* Feedback */}
            {isFeedback && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-1.5">
                {FEEDBACK.map((item, idx) =>
                  idx <= feedbackIdx ? (
                    <div key={idx} className="animate-slide-right flex justify-between items-center text-xs rounded-lg px-3 py-2"
                      style={{
                        background: item.ok ? "rgba(16,185,129,0.09)" : "rgba(239,68,68,0.09)",
                        border: `1px solid ${item.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                        animationDelay: `${idx * 0.05}s`,
                      }}>
                      <span className={item.ok ? "text-emerald-400" : "text-red-400"}>
                        {item.ok ? "✓" : "✗"}  {item.text}
                      </span>
                      <span className={`font-bold tabular-nums ${item.ok ? "text-emerald-400" : "text-red-400"}`}>
                        {item.mark}
                      </span>
                    </div>
                  ) : null
                )}

                {/* Score blocks */}
                {scoreCount > 0 && (
                  <div className="animate-score-pop mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded"
                          style={{
                            background: i < scoreCount
                              ? `linear-gradient(135deg, #0056CE, #6366f1)`
                              : "rgba(255,255,255,0.07)",
                            transition: `background 0.2s ease ${i * 0.05}s`,
                          }} />
                      ))}
                    </div>
                    <span className="text-white font-bold text-sm tabular-nums">
                      Score: <span className="text-brand text-base">{scoreCount}</span>
                      <span className="text-slate-500">/10</span>
                    </span>
                  </div>
                )}

                {/* Loop restart hint */}
                {isDone && (
                  <p className="text-center text-[10px] text-slate-600 pt-1 animate-fade-in-up">
                    Restarting in a moment…
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-600 text-center">
          No credit card · Free assessment · Cancel anytime
        </p>
      </div>
    </section>
  );
}
