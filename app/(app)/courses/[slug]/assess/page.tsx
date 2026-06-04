"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssessmentQuestion } from "@/types/database";
import { CodeEditor } from "@/components/ui/code-editor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type Phase = "welcome" | "question" | "review" | "submitting";

/* ─── Progress bar ────────────────────────────────────────────────────────── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-surface-alt rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full bg-brand transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─── Timer (counts UP) ──────────────────────────────────────────────────── */
function Timer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="text-xs text-ink-muted font-mono tabular-nums">
      {h > 0 && `${String(h).padStart(2, "0")}:`}
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

/* ─── Difficulty badge ────────────────────────────────────────────────────── */
function DifficultyBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    easy: { bg: "bg-success-bg", text: "text-success", label: "Easy" },
    medium: { bg: "bg-warning-bg", text: "text-warning", label: "Medium" },
    hard: { bg: "bg-error-bg", text: "text-error", label: "Hard" },
  };
  const c = config[level.toLowerCase()] ?? config.medium;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", c.bg, c.text)}>
      {c.label}
    </span>
  );
}

/* ─── Question type badge ─────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const label = type === "mcq" ? "MCQ" : type === "short_answer" ? "Short Answer" : "Code";
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-tint text-brand">
      {label}
    </span>
  );
}

/* ─── Question Navigator (mobile = horizontal scroll, desktop = sidebar) ── */
function QuestionNavigator({
  questions,
  currentIdx,
  responses,
  onSelect,
  className,
}: {
  questions: AssessmentQuestion[];
  currentIdx: number;
  responses: Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }>;
  onSelect: (idx: number) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const btn = scrollRef.current.children[currentIdx] as HTMLElement;
      btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentIdx]);

  function isAnswered(q: AssessmentQuestion) {
    const r = responses[q.id];
    if (!r) return false;
    if (q.type === "mcq") return !!r.selectedOption;
    if (q.type === "short_answer") return (r.responseText ?? "").trim().length > 0;
    return (r.codeResponse ?? "").trim().length > 0;
  }

  return (
    <div ref={scrollRef} className={cn("flex gap-1.5 overflow-x-auto scrollbar-none", className)}>
      {questions.map((q, i) => {
        const answered = isAnswered(q);
        const isCurrent = i === currentIdx;
        return (
          <button
            key={q.id}
            onClick={() => onSelect(i)}
            className={cn(
              "shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-all",
              isCurrent
                ? "bg-brand text-white shadow-card-hover"
                : answered
                ? "bg-success-bg text-success hover:bg-success-bg/80"
                : "bg-surface-alt text-ink-muted hover:bg-border hover:text-ink-secondary"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AssessPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, {
    selectedOption?: string;
    responseText?: string;
    codeResponse?: string;
  }>>({});
  const [startedAt, setStartedAt] = useState(Date.now());

  /* ── Start assessment ──────────────────────────────────────────────────── */
  async function startAssessment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assess/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start assessment");
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setStartedAt(Date.now());
      setPhase("question");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* ── Auto-save response ────────────────────────────────────────────────── */
  const saveResponse = useCallback(async (questionId: string, payload: {
    selectedOption?: string;
    responseText?: string;
    codeResponse?: string;
  }) => {
    try {
      await fetch("/api/assess/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId, ...payload }),
      });
    } catch {
      // non-blocking save
    }
  }, [attemptId]);

  function getResponse(questionId: string) {
    return responses[questionId] ?? {};
  }

  function updateResponse(questionId: string, patch: {
    selectedOption?: string;
    responseText?: string;
    codeResponse?: string;
  }) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch },
    }));
    saveResponse(questionId, { ...responses[questionId], ...patch });
  }

  /* ── Navigate with auto-save ───────────────────────────────────────────── */
  function goTo(idx: number) {
    // Save current answer before navigating
    const q = questions[currentIdx];
    if (q && responses[q.id]) {
      saveResponse(q.id, responses[q.id]);
    }
    setCurrentIdx(idx);
  }

  /* ── Submit ────────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    setPhase("submitting");
    try {
      const q = questions[currentIdx];
      if (q) await saveResponse(q.id, responses[q.id] ?? {});

      const res = await fetch("/api/assess/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      router.push(`/courses/${slug}/report/${data.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setPhase("question");
    }
  }

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function isAnswered(q: AssessmentQuestion) {
    const r = responses[q.id];
    if (!r) return false;
    if (q.type === "mcq") return !!r.selectedOption;
    if (q.type === "short_answer") return (r.responseText ?? "").trim().length > 0;
    return (r.codeResponse ?? "").trim().length > 0;
  }

  const currentQ = questions[currentIdx] ?? null;
  const currentResponse = currentQ ? getResponse(currentQ.id) : {};
  const answeredCount = questions.filter(isAnswered).length;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WELCOME SCREEN                                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="relative max-w-lg w-full bg-surface border border-border rounded-2xl p-8 sm:p-10 text-center shadow-card">
          {/* Course icon */}
          <div className="w-20 h-20 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-6">
            <span className="drop-shadow-lg" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-ink mb-2">Skill Assessment</h1>

          {/* Pill eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-surface-tint mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
              Diagnostic Test
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-ink-muted mb-8 flex-wrap">
            <span>20 Questions</span>
            <span className="w-1 h-1 rounded-full bg-border-mid" />
            <span>~30 minutes</span>
            <span className="w-1 h-1 rounded-full bg-border-mid" />
            <span>MCQ + Short Answer + Code</span>
          </div>

          <div className="rounded-xl bg-surface-soft border border-border p-5 text-left space-y-4 mb-8">
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>, text: "Your answers are graded by Claude AI" },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, text: "Results are instant - you'll get a full skill report" },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>, text: "MCQ + Short Answer + Code exercises" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="shrink-0">{item.icon}</span>
                <p className="text-sm text-ink-secondary">{item.text}</p>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-error bg-error-bg border border-error/20 px-4 py-2.5 rounded-lg mb-4">
              {error}
            </p>
          )}

          <button
            onClick={startAssessment}
            disabled={loading}
            className="w-full h-14 rounded-xl bg-brand text-white font-bold text-base transition-all hover:bg-brand-dark disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Starting...
              </span>
            ) : (
              "Start Assessment →"
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SUBMITTING STATE                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Submitting your assessment...</h2>
          <p className="text-ink-muted text-sm">Hang tight, this will only take a moment.</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  REVIEW SCREEN                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "review") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-border px-6 py-4 bg-surface">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Review Your Answers</h2>
            <Timer startedAt={startedAt} />
          </div>
        </div>

        <div className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-ink-muted text-sm mb-6">
              {answeredCount} of {questions.length} questions answered.
              {answeredCount < questions.length && " Unanswered questions will receive 0 marks."}
            </p>

            <div className="space-y-2 mb-8">
              {questions.map((q, i) => {
                const answered = isAnswered(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIdx(i); setPhase("question"); }}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all",
                      "border hover:border-brand/30",
                      answered
                        ? "border-border bg-surface"
                        : "border-warning/30 bg-warning-bg/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                      answered ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                    )}>
                      {answered ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">Q{i + 1}: {q.stem_md.slice(0, 80)}{q.stem_md.length > 80 ? "..." : ""}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <TypeBadge type={q.type} />
                        <span className="text-[10px] text-ink-muted">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className={cn("text-xs font-semibold", answered ? "text-success" : "text-warning")}>
                      {answered ? "Answered" : "Skipped"}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-error bg-error-bg border border-error/20 px-4 py-2.5 rounded-lg mb-4">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setPhase("question")}
                className="border border-border text-ink-secondary hover:text-ink hover:bg-surface-alt"
              >
                Back to Questions
              </Button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm transition-all hover:bg-brand-dark disabled:opacity-50"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  QUESTION SCREEN                                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (!currentQ) return null;

  const isLast = currentIdx === questions.length - 1;

  // Determine difficulty from bloom_level or fallback
  const difficulty = currentQ.bloom_level === "remember" || currentQ.bloom_level === "understand"
    ? "Easy"
    : currentQ.bloom_level === "apply" || currentQ.bloom_level === "analyze"
    ? "Medium"
    : "Hard";

  // Get first topic tag
  const topicTag = currentQ.topic_tags?.[0] ?? "General";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-secondary">
              Question {currentIdx + 1} of {questions.length}
            </p>
            <Timer startedAt={startedAt} />
          </div>
          <ProgressBar current={currentIdx + 1} total={questions.length} />
          {/* Mobile question navigator */}
          <div className="sm:hidden">
            <QuestionNavigator
              questions={questions}
              currentIdx={currentIdx}
              responses={responses}
              onSelect={goTo}
            />
          </div>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="flex-1 flex">
        {/* Desktop sidebar navigator */}
        <div className="hidden sm:flex flex-col gap-1.5 p-4 border-r border-border overflow-y-auto bg-surface"
          style={{ width: "60px" }}>
          {questions.map((q, i) => {
            const answered = isAnswered(q);
            const isCurrent = i === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all mx-auto",
                  isCurrent
                    ? "bg-brand text-white shadow-card-hover"
                    : answered
                    ? "bg-success-bg text-success hover:bg-success-bg/80"
                    : "bg-surface-alt text-ink-muted hover:bg-border"
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question content */}
        <div className="flex-1 px-4 sm:px-8 py-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Topic + difficulty + type */}
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={currentQ.type} />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-alt text-ink-muted">
                {topicTag}
              </span>
              <DifficultyBadge level={difficulty} />
              <span className="text-[10px] text-ink-muted ml-auto">{currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}</span>
            </div>

            {/* Question stem */}
            <p className="text-base sm:text-lg font-medium text-ink leading-relaxed whitespace-pre-wrap">
              {currentQ.stem_md}
            </p>

            {/* ─── MCQ Options ──────────────────────────────────────────── */}
            {currentQ.type === "mcq" && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option, i) => {
                  const letter = ["A", "B", "C", "D"][i] ?? String(i + 1);
                  const isSelected = currentResponse.selectedOption === option;
                  return (
                    <button
                      key={option}
                      onClick={() => updateResponse(currentQ.id, { selectedOption: option })}
                      className={cn(
                        "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-start gap-4",
                        isSelected
                          ? "border-brand bg-surface-tint"
                          : "border-border bg-surface hover:border-brand/30 hover:bg-surface-soft"
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isSelected ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                      )}>
                        {letter}
                      </span>
                      <span className={cn("text-sm pt-1", isSelected ? "text-ink font-medium" : "text-ink-secondary")}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─── Short Answer ─────────────────────────────────────────── */}
            {currentQ.type === "short_answer" && (
              <div>
                <textarea
                  value={currentResponse.responseText ?? ""}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      updateResponse(currentQ.id, { responseText: e.target.value });
                    }
                  }}
                  placeholder="Type your answer..."
                  rows={8}
                  className="w-full px-5 py-4 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-ink-muted">You can use **bold** and `code`</span>
                  <span className={cn(
                    "text-xs tabular-nums",
                    (currentResponse.responseText ?? "").length > 450 ? "text-warning" : "text-ink-muted"
                  )}>
                    {(currentResponse.responseText ?? "").length}/500
                  </span>
                </div>
              </div>
            )}

            {/* ─── Code Editor ──────────────────────────────────────────── */}
            {currentQ.type === "code" && (
              <div>
                {/* Language badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-surface-alt text-ink-muted">
                    {currentQ.language ?? "python"}
                  </span>
                </div>
                {/* CodeMirror editor */}
                <CodeEditor
                  value={currentResponse.codeResponse ?? (currentQ.starter_code ?? "")}
                  onChange={(val) => updateResponse(currentQ.id, { codeResponse: val })}
                  language={(currentQ.language as "python" | "typescript" | "javascript") ?? "python"}
                  placeholder="Write your code here..."
                  minHeight="300px"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-error bg-error-bg border border-error/20 px-4 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            {/* ─── Navigation ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => goTo(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="border border-border text-ink-secondary hover:text-ink hover:bg-surface-alt disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
                Previous
              </Button>

              {isLast ? (
                <button
                  onClick={() => setPhase("review")}
                  className="h-11 px-6 rounded-xl bg-brand text-white font-semibold text-sm transition-all hover:bg-brand-dark"
                >
                  Review & Submit
                </button>
              ) : (
                <Button
                  onClick={() => goTo(currentIdx + 1)}
                  className="bg-brand hover:bg-brand-dark"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
