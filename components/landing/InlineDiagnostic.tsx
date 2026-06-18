"use client";

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// Foot-in-the-door: one real question, right on the landing page. Answering is a
// micro-commitment that makes the full assessment far more likely. Both outcomes
// are framed positively, then open a curiosity gap → /diagnostic.
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTION = {
  stem: "Quick one — what's the core idea behind “RAG” in modern AI?",
  options: [
    { text: "The model retrieves relevant info first, then answers", correct: true },
    { text: "The model is trained faster", correct: false },
    { text: "It compresses images to save space", correct: false },
    { text: "It encrypts the user's prompt", correct: false },
  ],
};

export function InlineDiagnostic({
  eyebrow = "Test yourself · 10 seconds",
  heading = "Where would you land?",
}: { eyebrow?: string; heading?: string } = {}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const gotItRight = answered && QUESTION.options[picked].correct;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#F4F8FF 100%)" }}>
      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Test yourself · 10 seconds
          </span>
          <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.0]"
            style={{ fontSize: "clamp(26px,4vw,44px)" }}>
            Where would you land?
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(15,28,49,0.08)]">
          <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-5">{QUESTION.stem}</p>

          <div className="space-y-3">
            {QUESTION.options.map((opt, i) => {
              const isThis = picked === i;
              const showCorrect = answered && opt.correct;
              const showWrongPick = answered && isThis && !opt.correct;
              return (
                <button
                  key={i}
                  onClick={() => picked === null && setPicked(i)}
                  disabled={answered}
                  className="w-full text-left rounded-xl px-4 py-3.5 border-2 transition-all flex items-center gap-3 disabled:cursor-default hover:-translate-y-px"
                  style={{
                    borderColor: showCorrect ? "#10B981" : showWrongPick ? "#EF4444" : "rgba(15,28,49,0.10)",
                    background: showCorrect ? "rgba(16,185,129,0.06)" : showWrongPick ? "rgba(239,68,68,0.05)" : "#fff",
                  }}
                >
                  <span className="w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black"
                    style={{
                      borderColor: showCorrect ? "#10B981" : showWrongPick ? "#EF4444" : "rgba(15,28,49,0.15)",
                      color: showCorrect ? "#10B981" : showWrongPick ? "#EF4444" : "#64748B",
                    }}>
                    {showCorrect ? "✓" : showWrongPick ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-slate-800">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Result — positive either way, opens the curiosity gap */}
          {answered && (
            <div className="mt-6 rounded-2xl p-5 border animate-fade-in-up"
              style={{ borderColor: gotItRight ? "rgba(16,185,129,0.25)" : "rgba(0,86,206,0.2)", background: gotItRight ? "rgba(16,185,129,0.05)" : "rgba(0,86,206,0.05)" }}>
              <p className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                {gotItRight ? "Nice — you're already thinking like an engineer. 🎯" : "That's exactly what Nova teaches in week one."}
              </p>
              <p className="text-sm text-slate-600 mb-4">
                {gotItRight
                  ? "One question barely scratches it. The full 3-minute check maps your real level and the gaps between you and the role you want."
                  : "No shame — most people miss it. The full 3-minute check shows your real level and a path to close every gap."}
              </p>
              <Link
                href="/diagnostic"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}
              >
                See your full snapshot — 4 more questions →
              </Link>
            </div>
          )}

          {!answered && (
            <p className="text-center text-[11px] text-slate-400 mt-5">Pick one — no signup, no judgement.</p>
          )}
        </div>
      </div>
    </section>
  );
}
