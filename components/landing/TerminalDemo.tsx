"use client";
import { useEffect, useRef, useState, useCallback } from "react";

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

export function TerminalDemo() {
  const [phase,       setPhase]       = useState<Phase>("typing");
  const [typedCount,  setTypedCount]  = useState(0);
  const [showSyntax,  setShowSyntax]  = useState(false);
  const [feedbackIdx, setFeedbackIdx] = useState(-1);
  const [scoreCount,  setScoreCount]  = useState(0);
  const [loopKey,     setLoopKey]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const restartSequence = useCallback(() => {
    clearAllTimers();
    setPhase("typing");
    setTypedCount(0);
    setShowSyntax(false);
    setFeedbackIdx(-1);
    setScoreCount(0);
    setLoopKey(k => k + 1);
  }, [clearAllTimers]);

  useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      i++;
      setTypedCount(i);
      if (i >= CODE_PLAIN.length) {
        clearInterval(typing);
        setShowSyntax(true);

        timerRef.current = setTimeout(() => {
          setPhase("scanning");

          timerRef.current = setTimeout(() => {
            setPhase("grading");

            timerRef.current = setTimeout(() => {
              setPhase("feedback");
              let idx = 0;
              const fb = setInterval(() => {
                setFeedbackIdx(idx);
                idx++;
                if (idx >= FEEDBACK.length) {
                  clearInterval(fb);
                  let s = 0;
                  const sc = setInterval(() => {
                    s++;
                    setScoreCount(s);
                    if (s >= 7) {
                      clearInterval(sc);
                      setPhase("done");
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
  }, [loopKey]);

  const typedSoFar  = CODE_PLAIN.slice(0, typedCount);
  const currentLine = typedSoFar.split("\n").length - 1;
  const isTyping    = phase === "typing";
  const isScanning  = phase === "scanning";
  const isGrading   = phase === "grading";
  const isFeedback  = phase === "feedback" || phase === "done";
  const isDone      = phase === "done";

  return (
    <section style={{ background: "#050B14" }} className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">

        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-black text-white leading-tight tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            AI grades your code.{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #6366f1 50%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Instantly.
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Not just ticking boxes. Real feedback on real code.
          </p>
        </div>

        {/* Terminal card */}
        <div
          className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border transition-all duration-700 ${
            isGrading   ? "animate-glow-pulse border-brand/50" :
            isFeedback  ? "border-brand/25 shadow-[0_0_40px_rgba(0,86,206,0.15)]" :
            isDone      ? "border-emerald-500/20" :
            "border-white/[0.10]"
          }`}
          style={{ background: "#0D1117" }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]"
            style={{ background: "#161B22" }}
          >
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
          <div className="relative p-3 sm:p-5 font-mono text-xs sm:text-sm min-h-0 sm:min-h-[230px]">

            {/* Scan beam */}
            {isScanning && (
              <div
                className="animate-scan absolute left-0 right-0 pointer-events-none z-10"
                style={{
                  height: 2,
                  background: "linear-gradient(90deg, transparent 0%, #0056CE 40%, #6366f1 60%, transparent 100%)",
                }}
              />
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
                    <span
                      className="hidden sm:inline select-none text-slate-600 text-right mr-5 shrink-0 tabular-nums"
                      style={{ width: 18, fontSize: 11 }}
                    >
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
                          <span
                            className="inline-block w-0.5 h-4 bg-slate-300 ml-px align-middle"
                            style={{ animation: "cursor-blink 1s step-end infinite" }}
                          />
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
                    <div
                      key={idx}
                      className="animate-slide-right flex justify-between items-center text-xs rounded-lg px-3 py-2"
                      style={{
                        background: item.ok ? "rgba(16,185,129,0.09)" : "rgba(239,68,68,0.09)",
                        border: `1px solid ${item.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                        animationDelay: `${idx * 0.05}s`,
                      }}
                    >
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
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{
                            background: i < scoreCount
                              ? "linear-gradient(135deg, #0056CE, #6366f1)"
                              : "rgba(255,255,255,0.07)",
                            transition: `background 0.2s ease ${i * 0.05}s`,
                          }}
                        />
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
