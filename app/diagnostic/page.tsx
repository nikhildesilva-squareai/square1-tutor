"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getDiagnostic, scoreDiagnostic, type DiagQuestion } from "@/lib/diagnostic";

// ─── Subjects (mirrors the 12 courses) ────────────────────────────────────────
const SUBJECTS = [
  { slug: "generative-ai", title: "Generative AI", icon: "🤖", role: "AI Engineer", color: "#6366f1" },
  { slug: "machine-learning", title: "Machine Learning", icon: "🧠", role: "ML Engineer", color: "#8b5cf6" },
  { slug: "fullstack-development", title: "Full Stack Dev", icon: "🚀", role: "Full Stack Engineer", color: "#06b6d4" },
  { slug: "cybersecurity", title: "Cybersecurity", icon: "🔐", role: "Security Engineer", color: "#ef4444" },
  { slug: "data-science", title: "Data Science", icon: "📊", role: "Data Scientist", color: "#14b8a6" },
  { slug: "devops-engineering", title: "DevOps", icon: "⚙️", role: "DevOps Engineer", color: "#F97316" },
  { slug: "artificial-intelligence", title: "Artificial Intelligence", icon: "⚡", role: "AI Engineer", color: "#0ea5e9" },
  { slug: "computer-vision", title: "Computer Vision", icon: "👁️", role: "CV Engineer", color: "#10b981" },
  { slug: "llm-agent-architect", title: "LLM Agent Architect", icon: "🛠️", role: "Agent Architect", color: "#7C3AED" },
  { slug: "game-development", title: "Game Development", icon: "🎮", role: "Game Developer", color: "#f59e0b" },
  { slug: "drone-technology", title: "Drone Technology", icon: "🚁", role: "Drone Engineer", color: "#EC4899" },
  { slug: "ai-product-management", title: "AI Product Management", icon: "📋", role: "AI PM", color: "#0EA5E9" },
];

type Stage = "pick" | "quiz" | "result";

export default function DiagnosticPage() {
  const [stage, setStage] = useState<Stage>("pick");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number] | null>(null);
  const [questions, setQuestions] = useState<DiagQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  function chooseSubject(s: (typeof SUBJECTS)[number]) {
    setSubject(s);
    setQuestions(getDiagnostic(s.slug));
    setQIdx(0);
    setAnswers([]);
    setPicked(null);
    setStage("quiz");
  }

  // If arriving with ?subject=slug (e.g. from the hero goal-typer), skip the
  // picker and start that track immediately. Read client-side to avoid a
  // Suspense boundary for useSearchParams.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("subject");
    if (!slug) return;
    const match = SUBJECTS.find((s) => s.slug === slug);
    if (match) chooseSubject(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function answer(optIdx: number) {
    setPicked(optIdx);
    // Brief pause so the selection registers visually, then advance
    setTimeout(() => {
      const nextAnswers = [...answers, optIdx];
      setAnswers(nextAnswers);
      setPicked(null);
      if (qIdx + 1 < questions.length) {
        setQIdx(qIdx + 1);
      } else {
        setStage("result");
      }
    }, 220);
  }

  const accent = subject?.color ?? "#0056CE";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 50%,#F4F8FF 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">

        {/* ── STAGE 1: PICK A SUBJECT ─────────────────────────────────────── */}
        {stage === "pick" && (
          <div className="w-full max-w-3xl text-center animate-fade-in-up">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Free · 3 minutes · No signup
            </span>
            <h1 className="mt-4 mb-3 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px,5vw,56px)" }}>
              Where do you stand?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-10">
              Pick the track you&apos;re aiming for. Five quick questions, an instant skill snapshot — no account needed.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => chooseSubject(s)}
                  className="group rounded-2xl p-4 border text-left transition-all hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}10 0%, #FFFFFF 70%)`,
                    borderColor: `${s.color}25`,
                  }}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <p className="mt-2 text-sm font-bold text-slate-900 leading-tight">{s.title}</p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: s.color }}>{s.role}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STAGE 2: QUIZ ───────────────────────────────────────────────── */}
        {stage === "quiz" && subject && (
          <div key={qIdx} className="w-full max-w-xl animate-fade-in-up">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>
                {subject.icon} {subject.title}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">Question {qIdx + 1} / {questions.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 mb-8 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((qIdx) / questions.length) * 100}%`, background: accent }} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-6">
              {questions[qIdx].stem}
            </h2>

            <div className="space-y-3">
              {questions[qIdx].options.map((opt, i) => {
                const isPicked = picked === i;
                return (
                  <button
                    key={i}
                    onClick={() => picked === null && answer(i)}
                    disabled={picked !== null}
                    className="w-full text-left rounded-xl px-4 py-4 border-2 transition-all flex items-center gap-3 disabled:cursor-default hover:-translate-y-px"
                    style={{
                      borderColor: isPicked ? accent : "rgba(15,28,49,0.10)",
                      background: isPicked ? `${accent}10` : "#fff",
                    }}
                  >
                    <span className="w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ borderColor: isPicked ? accent : "rgba(15,28,49,0.15)", color: isPicked ? accent : "#64748B" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm sm:text-base font-medium text-slate-800">{opt}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-6">
              No wrong-answer shame — this is just to find your starting point.
            </p>
          </div>
        )}

        {/* ── STAGE 3: TEASER RESULT ──────────────────────────────────────── */}
        {stage === "result" && subject && (() => {
          const result = scoreDiagnostic(questions, answers);
          return (
            <div className="w-full max-w-lg text-center animate-fade-in-up">
              <span className="text-[10px] tracking-[0.35em] uppercase text-slate-500 font-bold">
                Your quick snapshot
              </span>

              {/* Level ring */}
              <div className="my-6 flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(15,28,49,0.08)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(result.score / result.total) * 276} 276`} />
                  </svg>
                  <div>
                    <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">{result.score}<span className="text-lg text-slate-400">/{result.total}</span></p>
                  </div>
                </div>
                <span className="mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white" style={{ background: accent }}>
                  {result.level} · {subject.role} track
                </span>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-5 max-w-md mx-auto">
                {result.blurb}
              </p>

              {/* Weak topics */}
              <div className="mb-8">
                <p className="text-[10px] tracking-widest uppercase text-slate-400 font-bold mb-3">Focus areas we spotted</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {result.weakTopics.map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                      style={{ borderColor: `${accent}30`, background: `${accent}0D`, color: "#334155" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Convert → full report */}
              <div className="rounded-2xl p-6 border" style={{ borderColor: `${accent}25`, background: `${accent}08` }}>
                <p className="text-sm text-slate-700 mb-4">
                  This is the 60-second version. The <span className="font-bold text-slate-900">full free assessment</span> grades real code, maps every gap, and builds your personalised plan to <span className="font-bold" style={{ color: accent }}>{subject.role}</span>.
                </p>
                <Link
                  href={`/signup?subject=${subject.slug}`}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-white font-bold text-sm sm:text-base hover:-translate-y-0.5 transition-transform"
                  style={{ background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}
                >
                  Get your free skill report →
                </Link>
                <p className="text-[11px] text-slate-500 mt-3">Free forever · No credit card</p>
              </div>

              <button onClick={() => setStage("pick")} className="mt-6 text-xs text-slate-400 hover:text-slate-700 transition-colors">
                ← Try a different track
              </button>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
