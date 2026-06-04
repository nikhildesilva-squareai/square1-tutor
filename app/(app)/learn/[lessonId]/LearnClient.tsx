"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LessonData {
  id: string;
  module_id: string;
  course_id: string;
  order_index: number;
  title: string;
  theory_md: string;
  estimated_minutes: number;
  learning_objectives: string[];
}

interface ModuleData {
  id: string;
  title: string;
  order_index: number;
  course_id: string;
}

interface CourseData {
  id: string;
  slug: string;
  title: string;
  total_lessons: number;
}

interface ExerciseData {
  id: string;
  lesson_id: string;
  order_index: number;
  type: "mcq" | "short_answer" | "code";
  title: string;
  prompt_md: string;
  starter_code: string | null;
  marks: number;
  language: string | null;
  options: string[] | null;
  correct_answer: string | null;
}

interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: string;
}

interface LearnClientProps {
  lesson: LessonData;
  module: ModuleData | null;
  course: CourseData | null;
  exercises: ExerciseData[];
  lessonPosition: number;
  totalLessonsInModule: number;
  nextLessonId: string | null;
  alreadyCompleted: boolean;
}

// ─── Simple markdown renderer ────────────────────────────────────────────────

function renderMarkdown(md: string): string {
  if (!md) return "";
  let html = md
    // Code blocks (fenced)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre class="bg-surface-alt rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono text-ink border border-border"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-surface-alt px-1.5 py-0.5 rounded text-sm font-mono text-brand">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-ink mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-ink mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-ink mt-8 mb-4">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-ink-secondary text-sm leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-ink-secondary text-sm leading-relaxed">$1</li>')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[hlupo]|<li|<pre|<code)(.+)$/gm, '<p class="text-sm text-ink-secondary leading-relaxed mb-3">$1</p>')
    // Line breaks
    .replace(/\n\n/g, "");

  return html;
}

// ─── Exercise type labels ────────────────────────────────────────────────────

function exerciseTypeLabel(type: string): string {
  switch (type) {
    case "mcq": return "Quick Check";
    case "short_answer": return "Explain";
    case "code": return "Build It";
    default: return type;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LearnClient({
  lesson,
  module,
  course,
  exercises,
  lessonPosition,
  totalLessonsInModule,
  nextLessonId,
  alreadyCompleted,
}: LearnClientProps) {
  const router = useRouter();

  // Exercise responses state
  const [responses, setResponses] = useState<Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }>>(() => {
    const init: Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }> = {};
    exercises.forEach((ex) => {
      init[ex.id] = {
        selectedOption: undefined,
        responseText: "",
        codeResponse: ex.starter_code ?? "",
      };
    });
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ExerciseResult[] | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [error, setError] = useState<string | null>(null);

  // ── Submit exercises ──────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        lessonId: lesson.id,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.id,
          type: ex.type,
          selectedOption: responses[ex.id]?.selectedOption,
          responseText: responses[ex.id]?.responseText,
          codeResponse: responses[ex.id]?.codeResponse,
        })),
      };

      const res = await fetch("/api/learn/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit");
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Mark lesson complete ──────────────────────────────────────────

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to mark complete");
      }

      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCompleting(false);
    }
  }

  // ── Progress bar width ────────────────────────────────────────────
  const progressPercent = totalLessonsInModule > 0 ? (lessonPosition / totalLessonsInModule) * 100 : 0;

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-3xl mx-auto pb-24">
      {/* Back link */}
      <Link
        href={course ? `/courses/${course.slug}` : "/courses"}
        className="text-sm text-brand hover:underline mb-6 inline-block"
      >
        &larr; Back to course
      </Link>

      {/* Lesson header */}
      <div className="mb-8">
        <p className="text-xs text-ink-muted uppercase tracking-widest font-semibold mb-1">
          {module ? `Module ${module.order_index + 1}` : "Module"} &middot; Lesson {lessonPosition} of {totalLessonsInModule}
        </p>
        <h1 className="text-2xl font-bold text-ink mb-4">{lesson.title}</h1>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface-alt rounded-full h-2">
            <div
              className="h-2 rounded-full bg-brand transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-ink-muted font-medium shrink-0">
            {lessonPosition}/{totalLessonsInModule}
          </span>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border mb-8" />

      {/* Theory section */}
      <section className="mb-10">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">
          Theory
        </p>
        {lesson.theory_md ? (
          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.theory_md) }}
          />
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-ink-muted">
              Lesson content is being prepared. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Exercises section */}
      {exercises.length > 0 && (
        <>
          <hr className="border-border mb-8" />
          <section className="mb-10">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-6">
              Exercises
            </p>

            <div className="space-y-6">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center text-xs font-bold text-brand">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-ink">{ex.title}</h3>
                    <span className="text-xs text-ink-muted ml-auto">
                      {exerciseTypeLabel(ex.type)} &middot; {ex.marks} marks
                    </span>
                  </div>

                  {/* Prompt */}
                  <div
                    className="text-sm text-ink-secondary mb-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(ex.prompt_md) }}
                  />

                  {/* MCQ */}
                  {ex.type === "mcq" && ex.options && (
                    <div className="space-y-2">
                      {ex.options.map((opt, oi) => {
                        const selected = responses[ex.id]?.selectedOption === opt;
                        const resultForThis = results?.find((r) => r.exerciseId === ex.id);
                        const isCorrectAnswer = resultForThis && ex.correct_answer === opt;
                        const isWrongSelection = resultForThis && selected && !resultForThis.correct;
                        return (
                          <button
                            key={oi}
                            onClick={() => {
                              if (results) return; // locked after submit
                              setResponses((prev) => ({
                                ...prev,
                                [ex.id]: { ...prev[ex.id], selectedOption: opt },
                              }));
                            }}
                            disabled={!!results}
                            className={[
                              "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                              selected && !results
                                ? "border-brand bg-surface-tint text-brand font-medium"
                                : "border-border bg-surface text-ink-secondary hover:bg-surface-alt",
                              isCorrectAnswer ? "border-success bg-success-bg text-success" : "",
                              isWrongSelection ? "border-error bg-error-bg text-error" : "",
                            ].join(" ")}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short answer */}
                  {ex.type === "short_answer" && (
                    <textarea
                      value={responses[ex.id]?.responseText ?? ""}
                      onChange={(e) => {
                        if (results) return;
                        setResponses((prev) => ({
                          ...prev,
                          [ex.id]: { ...prev[ex.id], responseText: e.target.value },
                        }));
                      }}
                      disabled={!!results}
                      placeholder="Write your answer here..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                    />
                  )}

                  {/* Code */}
                  {ex.type === "code" && (
                    <CodeEditor
                      value={responses[ex.id]?.codeResponse ?? ""}
                      onChange={(value) => {
                        if (results) return;
                        setResponses((prev) => ({
                          ...prev,
                          [ex.id]: { ...prev[ex.id], codeResponse: value },
                        }));
                      }}
                      language={(ex.language as "python" | "typescript" | "javascript") ?? "python"}
                      placeholder="Write your code here..."
                      readOnly={!!results}
                      minHeight="200px"
                    />
                  )}

                  {/* Result feedback */}
                  {results && (
                    (() => {
                      const r = results.find((r) => r.exerciseId === ex.id);
                      if (!r) return null;
                      return (
                        <div
                          className={[
                            "mt-4 px-4 py-3 rounded-xl border text-sm",
                            r.correct
                              ? "border-success/30 bg-success-bg text-success"
                              : "border-error/30 bg-error-bg text-error",
                          ].join(" ")}
                        >
                          <p className="font-semibold mb-1">
                            {r.correct ? "Correct" : "Needs improvement"} &middot; {r.score}/{r.maxScore} marks
                          </p>
                          <p className="text-ink-secondary text-sm">{r.feedback}</p>
                        </div>
                      );
                    })()
                  )}
                </div>
              ))}
            </div>

            {/* Submit button */}
            {!results && (
              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Submit Exercises
                </Button>
              </div>
            )}
          </section>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-error/30 bg-error-bg text-error text-sm">
          {error}
        </div>
      )}

      {/* AI Feedback summary + completion actions */}
      {(results || exercises.length === 0) && (
        <>
          <hr className="border-border mb-8" />
          <section>
            {results && (
              <div className="mb-6">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
                  Results Summary
                </p>
                <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black text-ink">
                        {results.reduce((s, r) => s + r.score, 0)}/{results.reduce((s, r) => s + r.maxScore, 0)}
                      </p>
                      <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">Total Score</p>
                    </div>
                    <div className="flex-1 bg-surface-alt rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-brand transition-all"
                        style={{
                          width: `${(results.reduce((s, r) => s + r.score, 0) / Math.max(1, results.reduce((s, r) => s + r.maxScore, 0))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {!completed && (
                <Button
                  onClick={handleComplete}
                  loading={completing}
                  disabled={completing}
                  size="lg"
                >
                  Mark Lesson Complete
                </Button>
              )}
              {completed && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success-bg text-success text-sm font-semibold">
                  Lesson completed
                </span>
              )}
              {nextLessonId && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push(`/learn/${nextLessonId}`)}
                >
                  Next Lesson &rarr;
                </Button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
