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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSS-ONLY ANIMATIONS (injected once)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  INLINE MARKDOWN → JSX  (handles **bold**, *italic*, `code`, "quotes")   */
/* ═══════════════════════════════════════════════════════════════════════════ */
function renderInlineMd(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, and `code` patterns
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before the match
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }

    if (match[2]) {
      // **bold** → <strong>
      parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic* → <em>
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      // `code` → <code>
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-surface-alt text-sm font-mono text-brand">
          {match[4]}
        </code>
      );
    }

    lastIdx = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}

const ANIM_STYLES = `
@keyframes slideInRight  { from { opacity:0; transform:translateX(60px) }  to { opacity:1; transform:translateX(0) } }
@keyframes slideInLeft   { from { opacity:0; transform:translateX(-60px) } to { opacity:1; transform:translateX(0) } }
@keyframes slideOutLeft  { from { opacity:1; transform:translateX(0) }     to { opacity:0; transform:translateX(-60px) } }
@keyframes slideOutRight { from { opacity:1; transform:translateX(0) }     to { opacity:0; transform:translateX(60px) } }
@keyframes fadeUp        { from { opacity:0; transform:translateY(24px) }  to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn        { from { opacity:0 } to { opacity:1 } }
@keyframes scaleIn       { from { opacity:0; transform:scale(0.95) }       to { opacity:1; transform:scale(1) } }
@keyframes slideUpSpring { from { opacity:0; transform:translateY(100%) }  to { opacity:1; transform:translateY(0) } }
@keyframes pulseGlow     { 0%,100% { box-shadow: 0 0 0 0 rgba(0,86,206,0.3) } 50% { box-shadow: 0 0 0 8px rgba(0,86,206,0) } }
@keyframes ringFill      { from { stroke-dashoffset: 126 } }
@keyframes checkDraw     { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@keyframes confettiBurst { 0% { opacity:1; transform: scale(0) } 50% { opacity:1; transform: scale(1.2) } 100% { opacity:0; transform: scale(1.5) } }

.anim-slide-in-right  { animation: slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both }
.anim-slide-in-left   { animation: slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1) both }
.anim-fade-up         { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both }
.anim-fade-in         { animation: fadeIn 0.3s ease both }
.anim-scale-in        { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both }
.anim-slide-up-spring { animation: slideUpSpring 0.4s cubic-bezier(0.34,1.56,0.64,1) both }
.anim-pulse-glow      { animation: pulseGlow 1.5s ease-in-out 1 }
.delay-1 { animation-delay: 0.05s }
.delay-2 { animation-delay: 0.10s }
.delay-3 { animation-delay: 0.15s }
.delay-4 { animation-delay: 0.20s }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PROGRESS RING                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ProgressRing({ current, total, size = 44 }: { current: number; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? current / total : 0;
  const offset = circ * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="3" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#0056CE" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink tabular-nums">
        {current}/{total}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TIMER                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function Timer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <div className="flex items-center gap-1.5 text-ink-muted">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="text-xs font-mono tabular-nums">
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  QUESTION DOT NAVIGATOR                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
function DotNavigator({
  questions, currentIdx, responses, onSelect,
}: {
  questions: AssessmentQuestion[];
  currentIdx: number;
  responses: Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }>;
  onSelect: (i: number) => void;
}) {
  function isAnswered(q: AssessmentQuestion) {
    const r = responses[q.id];
    if (!r) return false;
    if (q.type === "mcq") return !!r.selectedOption;
    if (q.type === "short_answer") return (r.responseText ?? "").trim().length > 0;
    return (r.codeResponse ?? "").trim().length > 0;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {questions.map((q, i) => {
        const answered = isAnswered(q);
        const active = i === currentIdx;
        return (
          <button
            key={q.id}
            onClick={() => onSelect(i)}
            className={cn(
              "transition-all duration-300 rounded-full",
              active
                ? "w-8 h-3 bg-brand"
                : answered
                ? "w-3 h-3 bg-success hover:scale-125"
                : "w-3 h-3 bg-border hover:bg-ink-muted hover:scale-125"
            )}
            title={`Question ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN ASSESSMENT COMPONENT                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AssessPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const styleRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [animKey, setAnimKey] = useState(0);
  const [responses, setResponses] = useState<Record<string, {
    selectedOption?: string;
    responseText?: string;
    codeResponse?: string;
  }>>({});
  const [startedAt, setStartedAt] = useState(Date.now());

  // Inject animation styles once
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style");
    el.textContent = ANIM_STYLES;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  /* ── API Logic (unchanged) ──────────────────────────────────────────── */
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

  function getResponse(qId: string) { return responses[qId] ?? {}; }

  function updateResponse(qId: string, patch: {
    selectedOption?: string; responseText?: string; codeResponse?: string;
  }) {
    setResponses((prev) => ({ ...prev, [qId]: { ...prev[qId], ...patch } }));
    saveResponse(qId, { ...responses[qId], ...patch });
  }

  function goTo(idx: number) {
    if (idx === currentIdx) return;
    const q = questions[currentIdx];
    if (q && responses[q.id]) saveResponse(q.id, responses[q.id]);
    setSlideDir(idx > currentIdx ? "left" : "right");
    setPrevIdx(currentIdx);
    setCurrentIdx(idx);
    setAnimKey((k) => k + 1);
  }

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
  const currentAnswered = currentQ ? isAnswered(currentQ) : false;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WELCOME SCREEN                                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-soft">
        <div className="relative max-w-md w-full">
          {/* Decorative glow */}
          <div className="absolute -inset-4 bg-gradient-to-br from-brand/5 via-transparent to-brand/5 rounded-3xl blur-2xl" />

          <div className="relative bg-surface border border-border rounded-2xl p-8 sm:p-10 shadow-card anim-scale-in">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center mx-auto mb-6 anim-fade-up">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>

            {/* Badge */}
            <div className="flex justify-center mb-4 anim-fade-up delay-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">Skill Assessment</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink text-center mb-2 anim-fade-up delay-2">
              Ready to show what you know?
            </h1>
            <p className="text-sm text-ink-muted text-center mb-8 anim-fade-up delay-3">
              20 questions across MCQ, short answer, and code. AI-graded instantly.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8 anim-fade-up delay-3">
              {[
                { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, label: "Questions", value: "20" },
                { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: "Duration", value: "~30m" },
                { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, label: "Grading", value: "AI" },
              ].map((s) => (
                <div key={s.label} className="text-center bg-surface-soft rounded-xl p-3 border border-border">
                  <div className="flex justify-center mb-1">{s.svg}</div>
                  <p className="text-sm font-bold text-ink mt-1">{s.value}</p>
                  <p className="text-[10px] text-ink-muted uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-sm text-error bg-error-bg border border-error/20 px-4 py-2.5 rounded-lg mb-4 anim-fade-in">
                {error}
              </p>
            )}

            <button
              onClick={startAssessment}
              disabled={loading}
              className="w-full h-14 rounded-xl bg-brand text-white font-bold text-base transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none anim-fade-up delay-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading...
                </span>
              ) : "Begin Assessment →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SUBMITTING STATE                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-soft">
        <div className="text-center anim-scale-in">
          <div className="w-20 h-20 rounded-full bg-surface-tint border-2 border-brand/20 flex items-center justify-center mx-auto mb-6">
            <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Grading your assessment...</h2>
          <p className="text-ink-muted text-sm">Our AI is reviewing your answers. This takes about 15 seconds.</p>
          <div className="mt-6 flex items-center justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  REVIEW SCREEN                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "review") {
    return (
      <div className="min-h-screen bg-surface-soft">
        {/* Header */}
        <div className="border-b border-border bg-surface px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Review Answers</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-muted">
                <span className="font-bold text-brand">{answeredCount}</span>/{questions.length} answered
              </span>
              <Timer startedAt={startedAt} />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Question grid */}
          <div className="grid grid-cols-1 gap-2 mb-8">
            {questions.map((q, i) => {
              const answered = isAnswered(q);
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(i); setAnimKey(k => k+1); setPhase("question"); }}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all border hover:shadow-card",
                    "anim-fade-up",
                    answered ? "border-border bg-surface" : "border-warning/30 bg-warning-bg/20"
                  )}
                  style={{ animationDelay: `${i * 0.02}s` }}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                    answered ? "bg-success-bg text-success" : "bg-surface-alt text-ink-muted"
                  )}>
                    {answered ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">Q{i + 1}: {q.stem_md.slice(0, 70)}{q.stem_md.length > 70 ? "..." : ""}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        q.type === "mcq" ? "bg-blue-50 text-blue-600" : q.type === "code" ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {q.type === "mcq" ? "MCQ" : q.type === "code" ? "Code" : "Written"}
                      </span>
                      <span className="text-[10px] text-ink-muted">{q.marks}m</span>
                    </div>
                  </div>
                  <span className={cn("text-xs font-semibold", answered ? "text-success" : "text-warning")}>
                    {answered ? "Done" : "Empty"}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-error bg-error-bg border border-error/20 px-4 py-2.5 rounded-lg mb-4">{error}</p>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setPhase("question")}
              className="h-12 px-6 rounded-xl border border-border bg-surface text-ink-secondary font-semibold text-sm hover:bg-surface-alt transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              className="h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20"
            >
              Submit Assessment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  QUESTION SCREEN — THE CORE EXPERIENCE                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (!currentQ) return null;

  const isLast = currentIdx === questions.length - 1;
  const topicTag = currentQ.topic_tags?.[0] ?? "General";
  const difficulty = currentQ.bloom_level === "remember" || currentQ.bloom_level === "understand"
    ? "easy" : currentQ.bloom_level === "apply" || currentQ.bloom_level === "analyze" ? "medium" : "hard";
  const diffColors: Record<string, string> = {
    easy: "bg-emerald-50 text-emerald-600 border-emerald-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    hard: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft">
      {/* ── Minimal Header ─────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <ProgressRing current={currentIdx + 1} total={questions.length} />
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-ink">
              Question {currentIdx + 1}
              <span className="text-ink-muted font-normal"> of {questions.length}</span>
            </p>
          </div>
          <Timer startedAt={startedAt} />
        </div>
      </div>

      {/* ── Question Content (animated) ────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <div
          key={animKey}
          className={cn(
            "flex-1 px-4 sm:px-6 py-6 sm:py-10",
            slideDir === "left" ? "anim-slide-in-right" : "anim-slide-in-left"
          )}
        >
          <div className="max-w-3xl mx-auto">
            {/* Meta badges */}
            <div className="flex items-center gap-2 flex-wrap mb-5 anim-fade-up">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                currentQ.type === "mcq" ? "bg-blue-50 text-blue-600 border-blue-200"
                  : currentQ.type === "code" ? "bg-purple-50 text-purple-600 border-purple-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              )}>
                {currentQ.type === "mcq" ? "Multiple Choice" : currentQ.type === "code" ? "Write Code" : "Written Answer"}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-surface-alt text-ink-muted border border-border">
                {topicTag}
              </span>
              <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border", diffColors[difficulty])}>
                {difficulty}
              </span>
              <span className="text-[10px] text-ink-muted ml-auto font-semibold">{currentQ.marks} marks</span>
            </div>

            {/* Question stem */}
            <h2 className="text-lg sm:text-xl font-semibold text-ink leading-relaxed mb-8 whitespace-pre-wrap">
              {renderInlineMd(currentQ.stem_md)}
            </h2>

            {/* ─── MCQ: Big tappable cards ──────────────────────────────── */}
            {currentQ.type === "mcq" && currentQ.options && (
              <div className="grid gap-3">
                {currentQ.options.map((option, i) => {
                  const letter = ["A", "B", "C", "D"][i] ?? String(i + 1);
                  const isSelected = currentResponse.selectedOption === option;
                  return (
                    <button
                      key={option}
                      onClick={() => updateResponse(currentQ.id, { selectedOption: option })}
                      className={cn(
                        "group w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4",
                        "anim-fade-up",
                        isSelected
                          ? "border-brand bg-surface-tint shadow-md shadow-brand/10 anim-pulse-glow"
                          : "border-border bg-surface hover:border-brand/40 hover:bg-surface-soft hover:shadow-card hover:scale-[1.01] active:scale-[0.99]"
                      )}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <span className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200",
                        isSelected
                          ? "bg-brand text-white scale-110"
                          : "bg-surface-alt text-ink-muted group-hover:bg-brand/10 group-hover:text-brand"
                      )}>
                        {isSelected ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : letter}
                      </span>
                      <span className={cn(
                        "text-sm sm:text-base transition-colors",
                        isSelected ? "text-ink font-medium" : "text-ink-secondary group-hover:text-ink"
                      )}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─── Short Answer: Focused writing zone ──────────────────── */}
            {currentQ.type === "short_answer" && (
              <div className="anim-fade-up">
                <div className={cn(
                  "rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-surface",
                  "focus-within:border-brand focus-within:shadow-lg focus-within:shadow-brand/5",
                  "border-border"
                )}>
                  {/* Writing zone header */}
                  <div className="px-5 py-3 bg-surface-soft border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-muted flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Your answer
                    </span>
                    {/* Character count ring */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs tabular-nums font-medium transition-colors",
                        (currentResponse.responseText ?? "").length > 450 ? "text-warning" : "text-ink-muted"
                      )}>
                        {(currentResponse.responseText ?? "").length}/500
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={currentResponse.responseText ?? ""}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        updateResponse(currentQ.id, { responseText: e.target.value });
                      }
                    }}
                    placeholder="Start typing your answer..."
                    rows={8}
                    className="w-full px-5 py-4 bg-transparent text-ink text-sm leading-relaxed placeholder:text-ink-muted/50 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* ─── Code: Split-pane IDE ─────────────────────────────────── */}
            {currentQ.type === "code" && (
              <div className="anim-fade-up">
                <div className="rounded-2xl border border-border overflow-hidden shadow-card bg-surface">
                  {/* IDE Header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0D1117] border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                      <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                      <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono flex-1">
                      solution.{currentQ.language === "typescript" ? "ts" : currentQ.language === "javascript" ? "js" : "py"}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                      {currentQ.language ?? "python"}
                    </span>
                  </div>
                  {/* Editor */}
                  <CodeEditor
                    value={currentResponse.codeResponse ?? (currentQ.starter_code ?? "")}
                    onChange={(val) => updateResponse(currentQ.id, { codeResponse: val })}
                    language={(currentQ.language as "python" | "typescript" | "javascript") ?? "python"}
                    placeholder="Write your code here..."
                    minHeight="320px"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Dot navigator ────────────────────────────────────────────── */}
        <div className="px-4 py-3 bg-surface border-t border-border">
          <div className="max-w-3xl mx-auto">
            <DotNavigator
              questions={questions}
              currentIdx={currentIdx}
              responses={responses}
              onSelect={goTo}
            />
          </div>
        </div>

        {/* ── Bottom action bar (slides up when answered) ───────────── */}
        <div className="bg-surface border-t border-border px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => goTo(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="h-11 px-5 rounded-xl border border-border text-ink-secondary font-semibold text-sm hover:bg-surface-alt transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
              Back
            </button>

            <div className={cn(
              "transition-all duration-300",
              currentAnswered ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1"
            )}>
              {isLast ? (
                <button
                  onClick={() => setPhase("review")}
                  className="h-11 px-8 rounded-xl bg-brand text-white font-bold text-sm transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  Review & Submit
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ) : (
                <button
                  onClick={() => goTo(currentIdx + 1)}
                  className="h-11 px-8 rounded-xl bg-brand text-white font-bold text-sm transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-error text-white text-sm font-medium shadow-lg anim-slide-up-spring z-50">
          {error}
        </div>
      )}
    </div>
  );
}
