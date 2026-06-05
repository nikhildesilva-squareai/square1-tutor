"use client";

import { useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/ui/code-editor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type Phase = "intro" | "loading" | "question" | "submitting" | "results";

interface Question {
  id: string;
  number: number;
  type: "mcq" | "short_answer" | "code";
  stem_md: string;
  options: string[] | null;
  marks: number;
  language: string | null;
  starter_code: string | null;
  topic_tags: string[];
}

interface Result {
  score: number;
  maxScore: number;
  percentage: number;
  previousPercentage: number | null;
  topicResults: { topic: string; score: number; max: number }[];
}

export default function ReassessPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, {
    selectedOption?: string; responseText?: string; codeResponse?: string;
  }>>({});
  const [result, setResult] = useState<Result | null>(null);

  /* ── Start re-assessment (reuses the same assess/start API) ──── */
  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assess/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      setAttemptId(data.attemptId);
      // Take first 5 questions for re-assessment (mini test)
      setQuestions(data.questions.slice(0, 5));
      setPhase("question");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* ── Save response ──────────────────────────────────────────── */
  const saveResponse = useCallback(async (questionId: string, payload: {
    selectedOption?: string; responseText?: string; codeResponse?: string;
  }) => {
    try {
      await fetch("/api/assess/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId, ...payload }),
      });
    } catch { /* non-blocking */ }
  }, [attemptId]);

  function updateResponse(qId: string, patch: {
    selectedOption?: string; responseText?: string; codeResponse?: string;
  }) {
    setResponses((prev) => ({ ...prev, [qId]: { ...prev[qId], ...patch } }));
    saveResponse(qId, { ...responses[qId], ...patch });
  }

  /* ── Submit ─────────────────────────────────────────────────── */
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

      // Fetch the report for results
      const reportRes = await fetch(`/api/grade/${data.attemptId}`, { method: "POST" });
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setResult({
          score: reportData.score ?? 0,
          maxScore: reportData.maxScore ?? 0,
          percentage: reportData.percentage ?? 0,
          previousPercentage: null,
          topicResults: [],
        });
      }
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setPhase("question");
    }
  }

  function isAnswered(q: Question) {
    const r = responses[q.id];
    if (!r) return false;
    if (q.type === "mcq") return !!r.selectedOption;
    if (q.type === "short_answer") return (r.responseText ?? "").trim().length > 0;
    return (r.codeResponse ?? "").trim().length > 0;
  }

  const currentQ = questions[currentIdx] ?? null;
  const currentResponse = currentQ ? (responses[currentQ.id] ?? {}) : {};
  const answeredCount = questions.filter(isAnswered).length;

  /* ═══ INTRO ═══ */
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-soft">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-ink mb-2">Module Re-Assessment</h1>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Test how much you&apos;ve improved since your initial assessment. 5 questions, ~10 minutes.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-surface-soft rounded-xl p-3 border border-border">
              <p className="text-lg font-black text-ink">5</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Questions</p>
            </div>
            <div className="bg-surface-soft rounded-xl p-3 border border-border">
              <p className="text-lg font-black text-ink">~10</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Minutes</p>
            </div>
            <div className="bg-surface-soft rounded-xl p-3 border border-border">
              <p className="text-lg font-black text-ink">AI</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Graded</p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-error bg-error-bg border border-error/20 px-4 py-2.5 rounded-lg mb-4">{error}</p>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 disabled:opacity-50 transition-all"
          >
            {loading ? "Starting..." : "Start Re-Assessment"}
          </button>

          <button
            onClick={() => router.push(`/courses/${slug}`)}
            className="mt-3 text-sm text-ink-muted hover:text-brand transition-colors"
          >
            Back to course
          </button>
        </div>
      </div>
    );
  }

  /* ═══ SUBMITTING ═══ */
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-soft">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tint flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">Grading your re-assessment...</h2>
          <p className="text-sm text-ink-muted">Comparing with your previous results.</p>
        </div>
      </div>
    );
  }

  /* ═══ RESULTS ═══ */
  if (phase === "results") {
    const pct = result?.percentage ?? 0;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-soft">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-card text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4",
            pct >= 70 ? "bg-emerald-100 text-emerald-600" : pct >= 50 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
          )}>
            {pct}%
          </div>

          <h2 className="text-xl font-bold text-ink mb-2">Re-Assessment Complete</h2>
          <p className="text-sm text-ink-muted mb-6">
            You scored {result?.score ?? 0}/{result?.maxScore ?? 0}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/courses/${slug}`)}
              className="flex-1 h-11 rounded-xl border border-border text-ink-secondary font-semibold text-sm hover:bg-surface-alt transition-all"
            >
              Back to Course
            </button>
            <button
              onClick={() => router.push("/progress")}
              className="flex-1 h-11 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all"
            >
              View Progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ QUESTION SCREEN ═══ */
  if (!currentQ) return null;
  const isLast = currentIdx === questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            Question {currentIdx + 1} <span className="text-ink-muted font-normal">of {questions.length}</span>
          </p>
          <span className="text-xs text-ink-muted">{answeredCount}/{questions.length} answered</span>
        </div>
        {/* Progress */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full h-1.5 rounded-full bg-surface-alt overflow-hidden">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
              currentQ.type === "mcq" ? "bg-blue-50 text-blue-600 border-blue-200"
                : currentQ.type === "code" ? "bg-purple-50 text-purple-600 border-purple-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            )}>
              {currentQ.type === "mcq" ? "Multiple Choice" : currentQ.type === "code" ? "Code" : "Written"}
            </span>
            <span className="text-[10px] text-ink-muted ml-auto">{currentQ.marks} marks</span>
          </div>

          <h2 className="text-lg font-semibold text-ink leading-relaxed mb-6 whitespace-pre-wrap">{currentQ.stem_md}</h2>

          {/* MCQ */}
          {currentQ.type === "mcq" && currentQ.options && (
            <div className="grid gap-3">
              {currentQ.options.map((opt, i) => {
                const sel = currentResponse.selectedOption === opt;
                return (
                  <button key={opt} onClick={() => updateResponse(currentQ.id, { selectedOption: opt })}
                    className={cn("w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4",
                      sel ? "border-brand bg-surface-tint" : "border-border bg-surface hover:border-brand/30 hover:scale-[1.01]"
                    )}>
                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                      sel ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                    )}>{sel ? "✓" : String.fromCharCode(65 + i)}</span>
                    <span className={cn("text-sm", sel ? "font-medium text-ink" : "text-ink-secondary")}>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short answer */}
          {currentQ.type === "short_answer" && (
            <textarea
              value={currentResponse.responseText ?? ""}
              onChange={(e) => updateResponse(currentQ.id, { responseText: e.target.value })}
              placeholder="Type your answer..."
              rows={6}
              className="w-full px-5 py-4 rounded-xl border-2 border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand resize-none"
            />
          )}

          {/* Code */}
          {currentQ.type === "code" && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2 bg-[#0D1117] border-b border-white/10 flex items-center gap-2">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" /></div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">{currentQ.language ?? "python"}</span>
              </div>
              <CodeEditor
                value={currentResponse.codeResponse ?? (currentQ.starter_code ?? "")}
                onChange={(val) => updateResponse(currentQ.id, { codeResponse: val })}
                language={(currentQ.language as "python" | "typescript" | "javascript") ?? "python"}
                minHeight="250px"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-surface border-t border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="h-10 px-5 rounded-xl border border-border text-ink-secondary text-sm font-semibold disabled:opacity-30 hover:bg-surface-alt transition-all"
          >
            ← Back
          </button>
          {isLast ? (
            <button onClick={handleSubmit}
              className="h-10 px-6 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all">
              Submit →
            </button>
          ) : (
            <button onClick={() => setCurrentIdx(i => i + 1)}
              className="h-10 px-6 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
