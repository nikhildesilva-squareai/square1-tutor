"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const CODE_SNIPPET = `def chat_with_ai(message: str, history: list) -> str:
    client = Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-5",
        messages=history + [{"role": "user", "content": message}]
    )
    return response.content[0].text`;

const FEEDBACK_LINES = [
  { ok: true,  text: "Good use of type hints",                      mark: "+1 mark" },
  { ok: true,  text: "Correct Anthropic client initialisation",      mark: "+1 mark" },
  { ok: false, text: "Missing error handling for rate limits",        mark: "-1 mark" },
  { ok: false, text: "History not validated before passing to API",   mark: "-1 mark" },
];

const PROJECT_CARDS = [
  { emoji: "🤖", title: "AI Chatbot",     status: "Deployed", statusClass: "text-emerald-400", anim: "animate-float-1", pos: "top-[140px] right-4 lg:right-20" },
  { emoji: "🔍", title: "RAG Pipeline",   status: "Deployed", statusClass: "text-emerald-400", anim: "animate-float-2", pos: "top-[280px] right-4 lg:right-6"  },
  { emoji: "🤖", title: "Research Agent", status: "Building", statusClass: "text-amber-400",   anim: "animate-float-3", pos: "top-[420px] right-4 lg:right-16" },
  { emoji: "🛡️", title: "Vuln Scanner",   status: "Locked",   statusClass: "text-slate-500",   anim: "animate-float-4", pos: "top-[560px] right-4 lg:right-4"  },
];

const STATUS_ICONS: Record<string, string> = {
  Deployed: "✅",
  Building: "🔨",
  Locked:   "🔒",
};

export function HeroSection() {
  const [typedCode, setTypedCode]         = useState("");
  const [codeComplete, setCodeComplete]   = useState(false);
  const [showFeedback, setShowFeedback]   = useState(false);
  const [feedbackIdx, setFeedbackIdx]     = useState(-1);
  const intervalRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setTypedCode(CODE_SNIPPET.slice(0, i));
      if (i >= CODE_SNIPPET.length) {
        clearInterval(intervalRef.current!);
        setCodeComplete(true);
        // After 1.5s delay, show feedback lines one by one
        setTimeout(() => {
          setShowFeedback(true);
          let idx = 0;
          const fb = setInterval(() => {
            setFeedbackIdx(idx);
            idx++;
            if (idx >= FEEDBACK_LINES.length) clearInterval(fb);
          }, 300);
        }, 1500);
      }
    }, 25);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <section
      className="relative overflow-hidden min-h-screen flex flex-col"
      style={{ background: "#050B14" }}
    >
      {/* Blob 1 — brand blue */}
      <div
        className="animate-blob-1 pointer-events-none absolute -top-40 -left-40 rounded-full opacity-20"
        style={{
          width: 600, height: 600,
          background: "radial-gradient(circle, #0056CE 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Blob 2 — indigo */}
      <div
        className="animate-blob-2 pointer-events-none absolute -bottom-48 -right-20 rounded-full opacity-15"
        style={{
          width: 500, height: 500,
          background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Floating project cards */}
      {PROJECT_CARDS.map((card) => (
        <div
          key={card.title}
          className={`hidden lg:flex absolute z-20 flex-col gap-1 ${card.anim} ${card.pos}`}
          style={{ width: 200 }}
        >
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{card.emoji}</span>
              <span className="text-sm font-semibold text-white truncate">{card.title}</span>
            </div>
            <span className={`text-xs font-medium ${card.statusClass}`}>
              {STATUS_ICONS[card.status]} {card.status}
            </span>
          </div>
        </div>
      ))}

      {/* Top Nav */}
      <nav className="relative z-30 max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <Logo variant="light" size="md" />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-white/20"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 rounded-lg bg-white text-brand font-bold hover:bg-slate-100 transition-colors shadow-sm"
          >
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 pt-12 pb-24">
        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight">
            The AI tutor that
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              gets you hired.
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Get assessed in 30 minutes. Get a plan. Build 10–12 real projects. Land the job.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-colors shadow-lg"
          >
            Start for free →
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 hover:border-white/50 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Code Terminal */}
        <div
          className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          style={{ background: "#0D1117" }}
        >
          {/* Tab bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ background: "#161B22" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-slate-400 font-mono ml-2">assessment.py</span>
          </div>

          {/* Code area */}
          <div className="p-5 font-mono text-sm">
            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              <span>{typedCode}</span>
              {!codeComplete && <span className="cursor-blink" />}
            </pre>

            {/* AI Feedback */}
            {showFeedback && (
              <div
                className="mt-4 pt-4 border-t border-white/10"
                style={{ animation: "fadeInUp 0.4s ease-out forwards" }}
              >
                {FEEDBACK_LINES.map((line, idx) =>
                  idx <= feedbackIdx ? (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-1 text-xs"
                      style={{ animation: "fadeInUp 0.3s ease-out forwards" }}
                    >
                      <span className={line.ok ? "text-emerald-400" : "text-red-400"}>
                        {line.ok ? "✓" : "✗"} {line.text}
                      </span>
                      <span className={`font-semibold ${line.ok ? "text-emerald-400" : "text-red-400"}`}>
                        {line.mark}
                      </span>
                    </div>
                  ) : null
                )}
                {feedbackIdx >= FEEDBACK_LINES.length - 1 && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-slate-400">─────────────────────────────</span>
                    <span className="text-white font-bold">Score: 7/10 → See full feedback below</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
