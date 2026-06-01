"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ── Syntax-highlighted code tokens ──────────────────────────────────────────
// Each line is an array of { text, color } segments — no external library needed
const PURPLE = "#C792EA";  // keywords
const BLUE   = "#82AAFF";  // functions / objects
const GREEN  = "#C3E88D";  // strings / types
const YELLOW = "#FFCB6B";  // params / vars
const ORANGE = "#F78C6C";  // numbers
const CYAN   = "#89DDFF";  // operators
const GREY   = "#BFC7D5";  // punctuation / default

const CODE_LINES: { text: string; color: string }[][] = [
  [
    { text: "def ",          color: PURPLE },
    { text: "chat_with_ai",  color: BLUE   },
    { text: "(",             color: GREY   },
    { text: "message",       color: YELLOW },
    { text: ": ",            color: GREY   },
    { text: "str",           color: GREEN  },
    { text: ", ",            color: GREY   },
    { text: "history",       color: YELLOW },
    { text: ": ",            color: GREY   },
    { text: "list",          color: GREEN  },
    { text: ") -> ",         color: GREY   },
    { text: "str",           color: GREEN  },
    { text: ":",             color: GREY   },
  ],
  [
    { text: "    client",    color: GREY   },
    { text: " = ",           color: CYAN   },
    { text: "Anthropic",     color: YELLOW },
    { text: "()",            color: GREY   },
  ],
  [
    { text: "    response",  color: GREY   },
    { text: " = ",           color: CYAN   },
    { text: "client",        color: BLUE   },
    { text: ".messages.",    color: GREY   },
    { text: "create",        color: BLUE   },
    { text: "(",             color: GREY   },
  ],
  [
    { text: '        model', color: GREY   },
    { text: "=",             color: CYAN   },
    { text: '"claude-sonnet-4-5"', color: GREEN },
    { text: ",",             color: GREY   },
  ],
  [
    { text: "        messages", color: GREY   },
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
    { text: "    )",          color: GREY   },
  ],
  [
    { text: "    ",           color: GREY   },
    { text: "return ",        color: PURPLE },
    { text: "response",       color: BLUE   },
    { text: ".content[",      color: GREY   },
    { text: "0",              color: ORANGE },
    { text: "].text",         color: GREY   },
  ],
];

// Flatten to a plain string for the char-by-char typing phase
const CODE_PLAIN = CODE_LINES.map(line =>
  line.map(t => t.text).join("")
).join("\n");

// ── Feedback items ───────────────────────────────────────────────────────────
const FEEDBACK = [
  { ok: true,  text: "Good use of type hints",                    mark: "+1 mark" },
  { ok: true,  text: "Correct Anthropic client initialisation",   mark: "+1 mark" },
  { ok: false, text: "Missing error handling for rate limits",     mark: "-1 mark" },
  { ok: false, text: "History not validated before passing to API",mark: "-1 mark" },
];

// ── Project cards ────────────────────────────────────────────────────────────
const CARDS = [
  {
    emoji: "🤖", title: "AI Chatbot",    status: "Deployed", statusColor: "text-emerald-400",
    glow: "card-glow-green", anim: "animate-float-1",
    detail: "⭐ 47 stars · 2d ago",
    pos: "top-[30%] left-4 xl:left-16",
  },
  {
    emoji: "🔍", title: "RAG Pipeline",  status: "Deployed", statusColor: "text-emerald-400",
    glow: "card-glow-green", anim: "animate-float-2",
    detail: "⭐ 31 stars · 5d ago",
    pos: "top-[55%] left-4 xl:left-20",
  },
  {
    emoji: "🤖", title: "Research Agent",status: "Building", statusColor: "text-amber-400",
    glow: "card-glow-amber", anim: "animate-float-3",
    detail: "Progress: 73%",
    pos: "top-[30%] right-4 xl:right-16",
  },
  {
    emoji: "🛡️", title: "Vuln Scanner",  status: "Locked",  statusColor: "text-slate-500",
    glow: "card-glow-none",  anim: "animate-float-4",
    detail: "Unlocks Month 4",
    pos: "top-[55%] right-4 xl:right-20",
  },
];

// ── Animation phases ─────────────────────────────────────────────────────────
type Phase = "typing" | "scanning" | "grading" | "feedback" | "done";

export function HeroSection() {
  const [phase,       setPhase]       = useState<Phase>("typing");
  const [typedCount,  setTypedCount]  = useState(0);
  const [showSyntax,  setShowSyntax]  = useState(false);
  const [feedbackIdx, setFeedbackIdx] = useState(-1);
  const [scoreCount,  setScoreCount]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Phase 1: type characters
    let i = 0;
    const typing = setInterval(() => {
      i++;
      setTypedCount(i);
      if (i >= CODE_PLAIN.length) {
        clearInterval(typing);
        setShowSyntax(true); // crossfade to coloured syntax

        // Phase 2: scanning line (visual only — CSS animation handles it)
        timerRef.current = setTimeout(() => {
          setPhase("scanning");

          // Phase 3: grading state
          timerRef.current = setTimeout(() => {
            setPhase("grading");

            // Phase 4: feedback lines appear one by one
            timerRef.current = setTimeout(() => {
              setPhase("feedback");
              let idx = 0;
              const fb = setInterval(() => {
                setFeedbackIdx(idx);
                idx++;
                if (idx >= FEEDBACK.length) {
                  clearInterval(fb);
                  // Score counter 0→7
                  let s = 0;
                  const sc = setInterval(() => {
                    s++;
                    setScoreCount(s);
                    if (s >= 7) { clearInterval(sc); setPhase("done"); }
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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Which line of code the cursor is currently on
  const typedSoFar  = CODE_PLAIN.slice(0, typedCount);
  const currentLine = typedSoFar.split("\n").length - 1;
  const isTyping    = phase === "typing";
  const isScanning  = phase === "scanning";
  const isGrading   = phase === "grading";
  const isFeedback  = phase === "feedback" || phase === "done";
  const isDone      = phase === "done";

  return (
    <section
      className="relative overflow-hidden min-h-screen flex flex-col"
      style={{ background: "#050B14" }}
    >
      {/* ── Gradient blobs ──────────────────────────────────────────────── */}
      <div className="animate-blob-1 pointer-events-none absolute -top-40 -left-40 rounded-full"
        style={{ width: 700, height: 700, opacity: 0.18,
          background: "radial-gradient(circle, #0056CE 0%, transparent 70%)",
          filter: "blur(90px)" }} />
      <div className="animate-blob-2 pointer-events-none absolute -bottom-48 -right-20 rounded-full"
        style={{ width: 600, height: 600, opacity: 0.14,
          background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)",
          filter: "blur(100px)" }} />
      {/* Third accent blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 400, height: 400, opacity: 0.06,
          background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
          filter: "blur(80px)" }} />

      {/* ── Floating project cards ───────────────────────────────────────── */}
      {CARDS.map((card, i) => (
        <div key={card.title}
          className={`hidden xl:block absolute z-20 ${card.anim} ${card.pos}`}
          style={{ width: 210, animationDelay: `${i * 0.3}s` }}>
          <div className={`${card.glow} bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 transition-transform hover:scale-105 hover:border-white/20 cursor-default`}>
            {/* Progress bar for building card */}
            {card.status === "Building" && (
              <div className="mb-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: "73%", transition: "width 1s ease" }} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{card.emoji}</span>
              <span className="text-sm font-semibold text-white truncate">{card.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${card.statusColor}`}>
                {card.status === "Deployed" ? "✅" : card.status === "Building" ? "🔨" : "🔒"} {card.status}
              </span>
              <span className="text-[10px] text-slate-500">{card.detail}</span>
            </div>
          </div>
        </div>
      ))}

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <nav className="relative z-30 w-full border-b border-white/5"
        style={{ backdropFilter: "blur(12px)", background: "rgba(5,11,20,0.6)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Logo variant="light" size="md" />

          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/25 hover:bg-white/5">
              Sign In
            </Link>
            <Link href="/signup"
              className="text-sm font-bold px-5 py-2 rounded-lg bg-white text-brand hover:bg-slate-100 transition-all shadow-lg hover:shadow-blue-500/20">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero body ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 pt-10 pb-20">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI-powered · Personalised · Project-based
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.07] tracking-tight mb-5">
          The AI tutor that
          <br />
          <span style={{
            background: "linear-gradient(135deg, #3388FF 0%, #6366f1 60%, #8B5CF6 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            gets you hired.
          </span>
        </h1>

        <p className="text-center text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
          Get assessed in 30 minutes. Get a personalised plan. Build 10–12 real projects. Land the job.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <Link href="/signup"
            className="px-8 py-4 rounded-xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-all shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
            Start for free →
          </Link>
          <Link href="/login"
            className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/8 hover:border-white/40 transition-all">
            Sign in
          </Link>
        </div>

        {/* ── Code Terminal ─────────────────────────────────────────────── */}
        <div
          className={`w-full max-w-2xl rounded-2xl overflow-hidden border transition-all duration-500 ${
            isGrading ? "animate-glow-pulse border-brand/40" :
            isFeedback ? "border-brand/20" :
            "border-white/10"
          }`}
          style={{ background: "#0D1117" }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8"
            style={{ background: "#161B22" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-slate-400 font-mono ml-2 flex-1">assessment.py</span>
            {/* Phase indicator */}
            {isGrading && (
              <div className="flex items-center gap-2 text-xs text-brand">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                AI grading…
              </div>
            )}
            {isDone && (
              <span className="text-xs text-emerald-400 font-semibold">✓ Graded</span>
            )}
          </div>

          {/* Code + scan + feedback area */}
          <div className="relative p-5 font-mono text-sm" style={{ minHeight: 220 }}>

            {/* Scanning line */}
            {isScanning && (
              <div className="animate-scan absolute left-0 right-0 pointer-events-none z-10"
                style={{ height: 2, background: "linear-gradient(90deg, transparent, #0056CE, #6366f1, transparent)" }} />
            )}

            {/* Line numbers + code */}
            <div className="leading-relaxed">
              {CODE_LINES.map((line, lineIdx) => {
                // How many chars of this line are typed
                const lineStart = CODE_LINES.slice(0, lineIdx).map(l => l.map(t => t.text).join("")).join("\n").length + (lineIdx > 0 ? 1 : 0);
                const lineText  = line.map(t => t.text).join("");
                const lineEnd   = lineStart + lineText.length;
                const charsTyped = Math.max(0, Math.min(lineText.length, typedCount - lineStart));
                const lineVisible = charsTyped > 0 || lineIdx === 0;

                if (!lineVisible) return null;

                return (
                  <div key={lineIdx} className="flex items-start">
                    {/* Line number */}
                    <span className="select-none text-slate-600 text-right mr-4 shrink-0" style={{ width: 20 }}>
                      {lineIdx + 1}
                    </span>

                    {/* Code — plain white while typing, then syntax highlighted */}
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
                          <span className="cursor-blink" />
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grading dots */}
            {isGrading && (
              <div className="mt-4 pt-4 border-t border-white/8 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-brand text-sm">🤖</span>
                <span>AI analysing your code</span>
                <span className="dot-1 w-1.5 h-1.5 rounded-full bg-brand inline-block ml-1" />
                <span className="dot-2 w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                <span className="dot-3 w-1.5 h-1.5 rounded-full bg-brand inline-block" />
              </div>
            )}

            {/* Feedback lines */}
            {isFeedback && (
              <div className="mt-4 pt-4 border-t border-white/8 space-y-1.5">
                {FEEDBACK.map((item, idx) =>
                  idx <= feedbackIdx ? (
                    <div key={idx}
                      className="animate-slide-right flex justify-between items-center text-xs rounded-lg px-3 py-2"
                      style={{
                        background: item.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                        animationDelay: `${idx * 0.05}s`,
                      }}>
                      <span className={item.ok ? "text-emerald-400" : "text-red-400"}>
                        {item.ok ? "✓" : "✗"} {item.text}
                      </span>
                      <span className={`font-bold tabular-nums ${item.ok ? "text-emerald-400" : "text-red-400"}`}>
                        {item.mark}
                      </span>
                    </div>
                  ) : null
                )}

                {/* Score */}
                {scoreCount > 0 && (
                  <div className="animate-score-pop mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-sm ${i < scoreCount ? "bg-brand" : "bg-white/10"}`} />
                      ))}
                    </div>
                    <span className="text-white font-bold text-sm">
                      Score: <span className="text-brand text-base">{scoreCount}</span>/10
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trusted by note */}
        <p className="mt-6 text-xs text-slate-600 text-center">
          No credit card · Free assessment · Cancel anytime
        </p>
      </div>
    </section>
  );
}
