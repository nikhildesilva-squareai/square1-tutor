"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const QUESTION = {
  text: "What is the primary purpose of RAG (Retrieval-Augmented Generation)?",
  options: [
    "To make models run faster",
    "To give models access to external, up-to-date knowledge",
    "To reduce the cost of API calls",
    "To improve model safety",
  ],
  correctIndex: 1,
};

const FEEDBACK: Record<number, { correct: boolean; text: string }> = {
  0: {
    correct: false,
    text: "Not quite. Speed is influenced by model size and infrastructure, not RAG. RAG actually adds latency because it requires a retrieval step before generation. The core purpose is grounding the model in external knowledge — try again!",
  },
  1: {
    correct: true,
    text: "Excellent. RAG (Retrieval-Augmented Generation) connects a language model to an external knowledge base, solving the fundamental problem of LLMs being frozen at their training cutoff. The retrieval step fetches relevant chunks, which are injected into the prompt as context — giving the model access to current, domain-specific information without retraining.",
  },
  2: {
    correct: false,
    text: "Close, but not quite. RAG can actually increase costs because it requires embedding generation + vector search on top of the LLM call. Its core purpose is giving the model access to current information it wasn't trained on.",
  },
  3: {
    correct: false,
    text: "Safety is handled separately through RLHF, constitutional AI, and output filters. RAG's purpose is to ground the model's responses in retrieved facts, reducing hallucination and providing access to external knowledge.",
  },
};

export function InteractiveDemo() {
  const [selected, setSelected]           = useState<number | null>(null);
  const [submitted, setSubmitted]         = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [showBanner, setShowBanner]       = useState(false);
  const [streamedText, setStreamedText]   = useState("");
  const streamRef                          = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleSubmit() {
    if (selected === null || isLoading || submitted) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
      setShowBanner(true);
      // Stream feedback text
      const fullText = FEEDBACK[selected].text;
      let i = 0;
      streamRef.current = setInterval(() => {
        i++;
        setStreamedText(fullText.slice(0, i));
        if (i >= fullText.length) clearInterval(streamRef.current!);
      }, 15);
    }, 1200);
  }

  function reset() {
    clearInterval(streamRef.current ?? undefined);
    setSelected(null);
    setSubmitted(false);
    setIsLoading(false);
    setShowBanner(false);
    setStreamedText("");
  }

  useEffect(() => () => { if (streamRef.current) clearInterval(streamRef.current); }, []);

  const fb = selected !== null ? FEEDBACK[selected] : null;

  return (
    <section className="py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8 bg-surface-soft">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
            Try it right now — no sign-up needed
          </h2>
          <p className="mt-3 text-ink-muted text-lg">
            Answer one real assessment question. See exactly how our AI grades your work.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-card overflow-hidden">
          {/* Question header */}
          <div className="px-6 py-4 border-b border-border bg-surface-soft flex items-center justify-between">
            <span className="text-xs font-semibold text-brand uppercase tracking-widest">
              Question 3 of 20 · Generative AI Assessment
            </span>
            {submitted && (
              <button onClick={reset} className="text-xs text-ink-muted hover:text-brand transition-colors">
                Try again ↺
              </button>
            )}
          </div>

          <div className="p-6">
            <p className="text-ink font-semibold text-base mb-5 leading-relaxed">
              {QUESTION.text}
            </p>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {QUESTION.options.map((opt, idx) => {
                let base = "flex items-center gap-3 w-full max-w-xl mx-auto rounded-xl border-2 px-4 py-3 text-sm text-left transition-all cursor-pointer ";
                if (!submitted) {
                  base += selected === idx
                    ? "border-brand bg-surface-tint text-brand font-semibold"
                    : "border-border bg-white text-ink hover:border-brand/40 hover:bg-surface-tint/50";
                } else {
                  if (idx === QUESTION.correctIndex) {
                    base += "border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold";
                  } else if (idx === selected && idx !== QUESTION.correctIndex) {
                    base += "border-red-300 bg-red-50 text-red-600";
                  } else {
                    base += "border-border bg-white text-ink-muted opacity-60 cursor-default";
                  }
                }

                return (
                  <button
                    key={idx}
                    className={base}
                    onClick={() => !submitted && setSelected(idx)}
                    disabled={submitted}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                        submitted && idx === QUESTION.correctIndex
                          ? "border-emerald-400 bg-emerald-400 text-white"
                          : submitted && idx === selected && idx !== QUESTION.correctIndex
                          ? "border-red-400 bg-red-400 text-white"
                          : selected === idx
                          ? "border-brand bg-brand text-white"
                          : "border-border bg-white"
                      }`}
                    >
                      {submitted && idx === QUESTION.correctIndex
                        ? "✓"
                        : submitted && idx === selected && idx !== QUESTION.correctIndex
                        ? "✗"
                        : selected === idx
                        ? "●"
                        : "○"}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Submit button */}
            {!submitted && (
              <button
                onClick={handleSubmit}
                disabled={selected === null || isLoading}
                className="w-full max-w-xl mx-auto block py-3 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Grading…
                  </>
                ) : (
                  "Submit Answer →"
                )}
              </button>
            )}

            {/* Feedback */}
            {submitted && fb && showBanner && (
              <div className="mt-4 space-y-3">
                {/* Banner */}
                <div
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                    fb.correct
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                  style={{ animation: "fadeInUp 0.3s ease-out both" }}
                >
                  {fb.correct ? "✓ Correct! +1 mark" : "✗ Incorrect — 0 marks"}
                </div>
                {/* Streaming explanation */}
                <div
                  className="rounded-xl bg-surface-soft border border-border px-4 py-3 text-sm text-ink-secondary leading-relaxed"
                  style={{ animation: "fadeInUp 0.3s ease-out 0.1s both" }}
                >
                  {streamedText}
                  {streamedText.length < fb.text.length && (
                    <span className="cursor-blink" />
                  )}
                </div>
                {/* CTA */}
                {streamedText.length >= fb.text.length && (
                  <div
                    className="pt-2"
                    style={{ animation: "fadeInUp 0.4s ease-out 0.2s both" }}
                  >
                    <Link
                      href="/signup"
                      className="block w-full text-center py-3 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors"
                    >
                      Want to see your full 20-question assessment? →
                    </Link>
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
