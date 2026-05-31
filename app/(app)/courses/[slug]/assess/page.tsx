"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import type { AssessmentQuestion } from "@/types/database";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface PageProps {
  params: Promise<{ slug: string }>;
}

type Phase = "welcome" | "question" | "submitting";

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-surface-alt rounded-full h-1.5">
      <div
        className="bg-brand h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Timer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <span className="text-xs text-ink-muted font-mono">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function AssessPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<string>("");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, {
    selectedOption?: string;
    responseText?: string;
    codeResponse?: string;
  }>>({});
  const [startedAt, setStartedAt] = useState<number>(Date.now());

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
      // non-blocking
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
    saveResponse(questionId, patch);
  }

  async function handleSubmit() {
    setPhase("submitting");
    try {
      // Save current response first
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

  const currentQ = questions[currentIdx] ?? null;
  const currentResponse = currentQ ? getResponse(currentQ.id) : {};

  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-surface rounded-[var(--radius-xl)] border border-border shadow-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tint flex items-center justify-center text-3xl mx-auto mb-6">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Skill Assessment</h1>
          <p className="text-ink-muted text-sm mb-6">
            20 Questions · ~30 minutes · MCQ + Short Answer + Code
          </p>

          <div className="bg-surface-soft rounded-[var(--radius-lg)] p-4 text-left space-y-3 mb-8">
            {[
              { icon: "📝", text: "Multiple choice questions with 4 options" },
              { icon: "✍️", text: "Short answer questions (200 words max)" },
              { icon: "💻", text: "Code exercises with a live editor" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm text-ink-secondary">{item.text}</p>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-error bg-error-bg px-3 py-2 rounded-[var(--radius-md)] mb-4">
              {error}
            </p>
          )}

          <Button onClick={startAssessment} loading={loading} size="lg" className="w-full">
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tint flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
            ⚡
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Submitting your assessment...</h2>
          <p className="text-ink-muted text-sm">Hang tight, this will only take a moment.</p>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const isLast = currentIdx === questions.length - 1;

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-ink-muted">
                Question {currentIdx + 1} of {questions.length}
              </p>
              <Timer startedAt={startedAt} />
            </div>
            <ProgressBar current={currentIdx + 1} total={questions.length} />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Question stem */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                {currentQ.type === "mcq" ? "Multiple Choice" :
                 currentQ.type === "short_answer" ? "Short Answer" : "Code"}
              </span>
              <span className="text-xs text-ink-muted">· {currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}</span>
            </div>
            <p className="text-base font-medium text-ink leading-relaxed whitespace-pre-wrap">
              {currentQ.stem_md}
            </p>
          </div>

          {/* MCQ options */}
          {currentQ.type === "mcq" && currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((option, i) => {
                const letter = ["A", "B", "C", "D"][i] ?? String(i + 1);
                const isSelected = currentResponse.selectedOption === option;
                return (
                  <button
                    key={option}
                    onClick={() => updateResponse(currentQ.id, { selectedOption: option })}
                    className={[
                      "w-full text-left px-4 py-3.5 rounded-[var(--radius-lg)] border-2 transition-all flex items-start gap-3",
                      isSelected
                        ? "border-brand bg-surface-tint"
                        : "border-border bg-surface hover:border-brand/40 hover:bg-surface-tint/50",
                    ].join(" ")}
                  >
                    <span className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                      isSelected ? "bg-brand text-white" : "bg-surface-alt text-ink-secondary",
                    ].join(" ")}>
                      {letter}
                    </span>
                    <span className="text-sm text-ink">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short answer */}
          {currentQ.type === "short_answer" && (
            <div>
              <textarea
                value={currentResponse.responseText ?? ""}
                onChange={(e) => updateResponse(currentQ.id, { responseText: e.target.value })}
                placeholder="Write your answer here... (aim for 100–200 words)"
                rows={8}
                className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-border bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
              />
              <p className="text-xs text-ink-muted mt-1.5 text-right">
                {(currentResponse.responseText ?? "").split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          )}

          {/* Code editor */}
          {currentQ.type === "code" && (
            <div className="rounded-[var(--radius-lg)] overflow-hidden border border-border">
              <div className="bg-brand-deep px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="text-xs text-white/50 ml-2 font-mono">
                  {currentQ.language ?? "python"}
                </span>
              </div>
              <MonacoEditor
                height="320px"
                language={currentQ.language ?? "python"}
                value={currentResponse.codeResponse ?? (currentQ.starter_code ?? "")}
                onChange={(val) => updateResponse(currentQ.id, { codeResponse: val ?? "" })}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-error bg-error-bg px-3 py-2 rounded-[var(--radius-md)]">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentIdx((i) => i - 1)}
              disabled={currentIdx === 0}
            >
              ← Previous
            </Button>

            {isLast ? (
              <Button onClick={handleSubmit} loading={loading} size="lg">
                Submit Assessment
              </Button>
            ) : (
              <Button onClick={() => setCurrentIdx((i) => i + 1)}>
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
