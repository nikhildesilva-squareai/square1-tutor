"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { cn } from "@/lib/utils";
import { SaveNoteButton } from "@/components/SaveNoteButton";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LessonData {
  id: string; module_id: string; course_id: string; order_index: number;
  title: string; theory_md: string; estimated_minutes: number; learning_objectives: string[];
}
interface ModuleData { id: string; title: string; order_index: number; course_id: string }
interface CourseData { id: string; slug: string; title: string; total_lessons: number }
interface ExerciseData {
  id: string; lesson_id: string; order_index: number;
  type: "mcq" | "short_answer" | "code"; title: string; prompt_md: string;
  starter_code: string | null; marks: number; language: string | null;
  options: string[] | null; correct_answer: string | null;
}
interface ExerciseResult { exerciseId: string; correct: boolean; score: number; maxScore: number; feedback: string }

interface LearnClientProps {
  lesson: LessonData; module: ModuleData | null; course: CourseData | null;
  exercises: ExerciseData[]; lessonPosition: number; totalLessonsInModule: number;
  nextLessonId: string | null; alreadyCompleted: boolean;
}

// ─── Card types ────────────────────────────────────────────────────────────

type CardType = "objectives" | "theory" | "quiz" | "summary" | "practice" | "complete";

interface LessonCard {
  type: CardType;
  title: string;
  content?: string;       // rendered HTML for theory cards
  rawContent?: string;    // raw markdown section
  exercise?: ExerciseData; // for quiz/practice cards
}

// ─── Styles ────────────────────────────────────────────────────────────────

const STYLES = `
@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideIn { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
@keyframes slideOut { from { opacity:1; transform:translateX(0) } to { opacity:0; transform:translateX(-40px) } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
@keyframes pulseCheck { 0% { transform:scale(0) } 50% { transform:scale(1.2) } 100% { transform:scale(1) } }
.card-enter { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both }
.card-fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both }
.card-scale { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both }
.check-pop { animation: pulseCheck 0.4s cubic-bezier(0.16,1,0.3,1) both }
`;

// ─── Rich markdown renderer ───────────────────────────────────────────────

function renderSection(md: string): string {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
      const language = lang ?? "text";
      return `<div class="relative rounded-xl overflow-hidden my-6 border border-white/10 shadow-lg">
        <div class="flex items-center gap-2 px-4 py-2.5" style="background:#161B22">
          <div class="flex gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">${language}</span>
        </div>
        <pre class="p-5 overflow-x-auto text-[13px] leading-[1.75] font-mono" style="background:#0D1117;color:#E6EDF3"><code>${code.trim()}</code></pre>
      </div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-ink mt-6 mb-2 flex items-center gap-2"><span class="w-1 h-5 rounded-full bg-brand/30"></span>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-extrabold text-ink mt-8 mb-3 flex items-center gap-2"><span class="w-1.5 h-6 rounded-full bg-brand"></span>$1</h3>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^&gt; (.+)$/gm, `<div class="flex gap-3 my-5 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
      <svg class="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 7a4 4 0 014 4c0 1.5-.8 2.8-2 3.4V16H10v-1.6C8.8 13.8 8 12.5 8 11a4 4 0 014-4z"/></svg>
      <p class="text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-medium">$1</p>
    </div>`)
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-3 leading-relaxed py-1"><span class="w-1.5 h-1.5 rounded-full bg-brand mt-[9px] shrink-0"></span><span>$1</span></li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-3 leading-relaxed py-1"><span class="w-6 h-6 rounded-lg bg-surface-tint text-brand text-[11px] font-bold flex items-center justify-center mt-0.5 shrink-0">·</span><span>$1</span></li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline font-medium" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, '</p><p class="lc-para">')
    .replace(/\n/g, "<br />");
  html = `<p class="lc-para">${html}</p>`;
  html = html.replace(/<p class="lc-para"><\/p>/g, "");
  return html;
}

// ─── Parse theory into cards ───────────────────────────────────────────────

function parseTheoryIntoCards(theory: string, exercises: ExerciseData[], objectives: string[]): LessonCard[] {
  const cards: LessonCard[] = [];

  // 1. Objectives card (if any)
  if (objectives && objectives.length > 0) {
    cards.push({ type: "objectives", title: "What You'll Learn" });
  }

  // 2. Split theory on ## headers into sections
  const sections: { title: string; content: string }[] = [];
  const parts = theory.split(/^## /gm);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const firstNewline = trimmed.indexOf("\n");
    if (firstNewline === -1) {
      sections.push({ title: trimmed, content: "" });
    } else {
      sections.push({
        title: trimmed.substring(0, firstNewline).trim(),
        content: trimmed.substring(firstNewline + 1).trim(),
      });
    }
  }

  // 3. Add theory cards with inline quizzes after every 2 sections
  const mcqExercises = exercises.filter(e => e.type === "mcq");
  let quizIdx = 0;

  sections.forEach((section, i) => {
    cards.push({
      type: "theory",
      title: section.title,
      content: renderSection(section.content),
      rawContent: section.content,
    });

    // Insert an inline quiz after every 2 theory sections
    if ((i + 1) % 2 === 0 && quizIdx < mcqExercises.length) {
      cards.push({
        type: "quiz",
        title: "Quick Check",
        exercise: mcqExercises[quizIdx],
      });
      quizIdx++;
    }
  });

  // 4. Summary card
  cards.push({ type: "summary", title: "Key Takeaways" });

  // 5. Practice cards (non-MCQ exercises)
  const practiceExercises = exercises.filter(e => e.type !== "mcq");
  for (const ex of practiceExercises) {
    cards.push({ type: "practice", title: ex.title, exercise: ex });
  }

  // 6. Completion card
  cards.push({ type: "complete", title: "Lesson Complete" });

  return cards;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LearnClient({
  lesson, module, course, exercises,
  lessonPosition, totalLessonsInModule, nextLessonId, alreadyCompleted,
}: LearnClientProps) {
  const router = useRouter();
  const styleRef = useRef(false);

  // Parse theory into cards
  const cards = parseTheoryIntoCards(lesson.theory_md ?? "", exercises, lesson.learning_objectives);
  const [currentCard, setCurrentCard] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [visitedCards, setVisitedCards] = useState<Set<number>>(new Set([0]));

  // Exercise state
  const [responses, setResponses] = useState<Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }>>(() => {
    const init: Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }> = {};
    exercises.forEach(ex => { init[ex.id] = { selectedOption: undefined, responseText: "", codeResponse: ex.starter_code ?? "" }; });
    return init;
  });
  const [quizAnswered, setQuizAnswered] = useState<Record<string, boolean>>({});
  const [quizCorrect, setQuizCorrect] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ExerciseResult[] | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [error, setError] = useState<string | null>(null);

  // Time tracking
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  // Inject styles
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style"); el.textContent = STYLES; document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  // Navigation
  function goToCard(idx: number) {
    if (idx < 0 || idx >= cards.length) return;
    setCurrentCard(idx);
    setVisitedCards(prev => new Set([...prev, idx]));
    setAnimKey(k => k + 1);
  }

  // Estimated time remaining
  const cardsRemaining = cards.length - currentCard - 1;
  const minutesPerCard = (lesson.estimated_minutes || 25) / Math.max(cards.length, 1);
  const minutesLeft = Math.max(1, Math.round(cardsRemaining * minutesPerCard));

  // Check inline quiz answer
  function checkQuizAnswer(exerciseId: string, selected: string, correct: string) {
    setResponses(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], selectedOption: selected } }));
    setQuizAnswered(prev => ({ ...prev, [exerciseId]: true }));
    setQuizCorrect(prev => ({ ...prev, [exerciseId]: selected.trim().toLowerCase() === correct.trim().toLowerCase() }));
  }

  // Submit practice exercises
  async function handleSubmit() {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/learn/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          exercises: exercises.map(ex => ({
            exerciseId: ex.id, type: ex.type,
            selectedOption: responses[ex.id]?.selectedOption,
            responseText: responses[ex.id]?.responseText,
            codeResponse: responses[ex.id]?.codeResponse,
          })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const data = await res.json();
      setResults(data.results);
      goToCard(cards.length - 1); // Go to completion card
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSubmitting(false); }
  }

  async function handleComplete() {
    setCompleting(true); setError(null);
    try {
      const res = await fetch("/api/learn/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setCompleted(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setCompleting(false); }
  }

  const card = cards[currentCard];
  const progressPct = cards.length > 0 ? ((currentCard + 1) / cards.length) * 100 : 0;
  const isLastCard = currentCard === cards.length - 1;
  const totalScore = results?.reduce((s, r) => s + r.score, 0) ?? 0;
  const maxScore = results?.reduce((s, r) => s + r.maxScore, 0) ?? 1;

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goToCard(currentCard + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goToCard(currentCard - 1); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div className="min-h-full bg-surface-soft flex flex-col">
      {/* ── Fixed header ──────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Top row */}
          <div className="flex items-center gap-3 mb-2.5">
            <Link href={course ? `/courses/${course.slug}` : "/courses"} className="text-ink-muted hover:text-brand transition-colors shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-muted truncate">
                {module ? `Module ${module.order_index + 1}` : ""} · Lesson {lessonPosition}/{totalLessonsInModule}
              </p>
              <h1 className="text-sm font-bold text-ink truncate">{lesson.title}</h1>
            </div>
            {/* Time + card counter */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] text-ink-muted font-medium">{minutesLeft}m left</span>
              <span className="text-xs font-bold text-ink tabular-nums">{currentCard + 1}/{cards.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full bg-surface-alt overflow-hidden">
            <div className="h-full rounded-full bg-brand transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1 mt-2 overflow-x-auto scrollbar-none">
            {cards.map((c, i) => (
              <button key={i} onClick={() => goToCard(i)}
                className={cn(
                  "shrink-0 rounded-full transition-all duration-300",
                  i === currentCard ? "w-6 h-2 bg-brand" :
                  visitedCards.has(i) ? "w-2 h-2 bg-brand/40" :
                  c.type === "quiz" ? "w-2 h-2 bg-amber-300" :
                  c.type === "practice" ? "w-2 h-2 bg-violet-300" :
                  c.type === "complete" ? "w-2 h-2 bg-emerald-300" :
                  "w-2 h-2 bg-border"
                )}
                title={c.title}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Card content ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div key={animKey} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 card-enter">
          <div className="max-w-3xl mx-auto">

            {/* ═══ OBJECTIVES CARD ═══ */}
            {card.type === "objectives" && (
              <div className="card-fade-up">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                  </div>
                  <h2 className="text-xl font-black text-ink mb-1">{lesson.title}</h2>
                  <p className="text-sm text-ink-muted">Here's what you'll learn in this lesson</p>
                </div>
                <div className="space-y-3">
                  {lesson.learning_objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 bg-surface rounded-xl border border-border p-4 card-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <p className="text-sm text-ink leading-relaxed pt-1">{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ THEORY CARD ═══ */}
            {card.type === "theory" && (
              <div className="card-fade-up">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center text-sm font-black shrink-0 shadow-md shadow-brand/20">
                    {cards.slice(0, currentCard + 1).filter(c => c.type === "theory").length}
                  </span>
                  <div>
                    <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider">Section</p>
                    <h2 className="text-xl font-black text-ink leading-tight">{card.title}</h2>
                  </div>
                </div>

                {/* Rendered content — larger text for readability */}
                <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card lesson-content"
                  dangerouslySetInnerHTML={{ __html: card.content ?? "" }} />

                {/* Actions: Ask Nova + Save */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <Link href={`/tutor?topic=${encodeURIComponent(card.title)}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand/20 bg-surface-tint text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Ask Nova
                  </Link>
                  <SaveNoteButton
                    content={card.rawContent ?? card.title}
                    type="highlight"
                    variant="inline"
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    moduleTitle={module?.title}
                    courseId={lesson.course_id}
                    sectionTitle={card.title}
                  />
                </div>
              </div>
            )}

            {/* ═══ INLINE QUIZ CARD ═══ */}
            {card.type === "quiz" && card.exercise && (() => {
              const ex = card.exercise;
              const answered = quizAnswered[ex.id];
              const isCorrect = quizCorrect[ex.id];
              return (
                <div className="card-scale">
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                      Quick Check
                    </span>
                  </div>

                  <div className="bg-surface rounded-2xl border border-border p-6 shadow-card">
                    <p className="text-base font-semibold text-ink leading-relaxed mb-5">{ex.prompt_md}</p>

                    {ex.options && (
                      <div className="grid gap-3">
                        {ex.options.map((opt, i) => {
                          const sel = responses[ex.id]?.selectedOption === opt;
                          const correctOpt = answered && ex.correct_answer?.trim().toLowerCase() === opt.trim().toLowerCase();
                          const wrongSel = answered && sel && !isCorrect;
                          return (
                            <button key={i}
                              onClick={() => !answered && checkQuizAnswer(ex.id, opt, ex.correct_answer ?? "")}
                              disabled={!!answered}
                              className={cn(
                                "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4",
                                correctOpt ? "border-emerald-400 bg-emerald-50" :
                                wrongSel ? "border-red-400 bg-red-50" :
                                sel && !answered ? "border-brand bg-surface-tint" :
                                "border-border bg-surface hover:border-brand/30 hover:scale-[1.01]",
                                answered ? "cursor-default" : "cursor-pointer"
                              )}>
                              <span className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all",
                                correctOpt ? "bg-emerald-500 text-white check-pop" :
                                wrongSel ? "bg-red-500 text-white" :
                                sel ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                              )}>
                                {correctOpt ? "✓" : wrongSel ? "✗" : String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm text-ink">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Feedback */}
                    {answered && (
                      <div className={cn(
                        "mt-5 px-5 py-4 rounded-xl text-sm card-fade-up",
                        isCorrect ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
                      )}>
                        <p className="font-bold mb-1">{isCorrect ? "Correct!" : "Not quite"}</p>
                        <p className="text-ink-secondary">
                          {isCorrect ? "Great recall — you understood this section." : `The correct answer is: ${ex.correct_answer}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ═══ SUMMARY CARD ═══ */}
            {card.type === "summary" && (
              <div className="card-fade-up">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black text-ink mb-1">Key Takeaways</h2>
                  <p className="text-sm text-ink-muted">Here's what you covered in this lesson</p>
                </div>

                <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-3">
                  {cards.filter(c => c.type === "theory").map((c, i) => (
                    <div key={i} className="flex items-start gap-3 card-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                      <span className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-ink font-medium">{c.title}</p>
                    </div>
                  ))}
                </div>

                {/* Quiz score summary */}
                {Object.keys(quizAnswered).length > 0 && (
                  <div className="mt-4 bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black",
                      Object.values(quizCorrect).filter(Boolean).length === Object.keys(quizCorrect).length
                        ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {Object.values(quizCorrect).filter(Boolean).length}/{Object.keys(quizCorrect).length}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Quick Check Score</p>
                      <p className="text-xs text-ink-muted">
                        {Object.values(quizCorrect).filter(Boolean).length === Object.keys(quizCorrect).length
                          ? "Perfect recall!" : "Review the sections you missed"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ PRACTICE CARD ═══ */}
            {card.type === "practice" && card.exercise && (() => {
              const ex = card.exercise;
              const result = results?.find(r => r.exerciseId === ex.id);
              return (
                <div className="card-fade-up">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      {ex.type === "code" ? "Build It" : "Explain"}
                    </span>
                    <span className="text-xs text-ink-muted ml-auto">{ex.marks} marks</span>
                  </div>

                  <div className="bg-surface rounded-2xl border border-border p-6 shadow-card">
                    <p className="text-base font-medium text-ink leading-relaxed mb-5">{ex.prompt_md}</p>

                    {ex.type === "short_answer" && (
                      <textarea
                        value={responses[ex.id]?.responseText ?? ""}
                        onChange={e => { if (!results) setResponses(p => ({...p, [ex.id]: {...p[ex.id], responseText: e.target.value}})); }}
                        disabled={!!results}
                        placeholder="Write your answer..."
                        rows={5}
                        className="w-full px-5 py-4 rounded-xl border-2 border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand resize-none"
                      />
                    )}

                    {ex.type === "code" && (
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#0D1117] border-b border-white/10">
                          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" /></div>
                          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">{ex.language ?? "python"}</span>
                        </div>
                        <CodeEditor
                          value={responses[ex.id]?.codeResponse ?? ""}
                          onChange={val => { if (!results) setResponses(p => ({...p, [ex.id]: {...p[ex.id], codeResponse: val}})); }}
                          language={(ex.language as "python" | "typescript" | "javascript") ?? "python"}
                          readOnly={!!results} minHeight="200px"
                        />
                      </div>
                    )}

                    {result && (
                      <div className={cn("mt-5 px-5 py-4 rounded-xl text-sm card-fade-up",
                        result.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
                      )}>
                        <p className={cn("font-bold mb-1", result.correct ? "text-emerald-700" : "text-red-700")}>
                          {result.correct ? "✓ Correct" : "✗ Needs work"} · {result.score}/{result.maxScore}
                        </p>
                        <p className="text-ink-secondary">{result.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ═══ COMPLETION CARD ═══ */}
            {card.type === "complete" && (
              <div className="card-scale text-center py-6">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 check-pop",
                  completed ? "bg-emerald-100" : "bg-surface-alt"
                )}>
                  {completed ? (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  )}
                </div>

                <h2 className="text-2xl font-black text-ink mb-2">
                  {completed ? "Lesson Complete!" : "Ready to finish?"}
                </h2>
                <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto">
                  {completed
                    ? "Great work. This lesson is in your progress."
                    : `You covered ${cards.filter(c => c.type === "theory").length} sections in ${Math.round(elapsed / 60)} minutes.`}
                </p>

                {/* Score summary */}
                {results && (
                  <div className="bg-surface rounded-xl border border-border p-5 max-w-xs mx-auto mb-6">
                    <p className="text-3xl font-black text-ink mb-1">{Math.round((totalScore / maxScore) * 100)}%</p>
                    <p className="text-xs text-ink-muted">{totalScore}/{maxScore} marks</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {!completed && !results && exercises.filter(e => e.type !== "mcq").length > 0 && (
                    <Button onClick={handleSubmit} loading={submitting} disabled={submitting} className="rounded-xl">
                      Submit Exercises
                    </Button>
                  )}
                  {!completed && (results || exercises.filter(e => e.type !== "mcq").length === 0) && (
                    <Button onClick={handleComplete} loading={completing} disabled={completing} className="rounded-xl">
                      Mark Complete
                    </Button>
                  )}
                  {completed && nextLessonId && (
                    <button onClick={() => router.push(`/learn/${nextLessonId}`)}
                      className="h-11 px-6 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
                      Next Lesson
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  )}
                  {completed && !nextLessonId && (
                    <Link href={course ? `/courses/${course.slug}` : "/dashboard"}
                      className="h-11 px-6 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all inline-flex items-center gap-2">
                      Back to Course
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom navigation ────────────────────────────────────── */}
        <div className="bg-surface border-t border-border px-4 sm:px-6 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => goToCard(currentCard - 1)} disabled={currentCard === 0}
              className="h-10 px-4 rounded-xl border border-border text-ink-secondary text-sm font-semibold disabled:opacity-30 hover:bg-surface-alt transition-all flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
              Back
            </button>

            {/* Card type indicator */}
            <span className="text-[10px] text-ink-muted font-medium uppercase tracking-wider">
              {card.type === "objectives" ? "Introduction" :
               card.type === "theory" ? "Learn" :
               card.type === "quiz" ? "Quick Check" :
               card.type === "summary" ? "Review" :
               card.type === "practice" ? "Practice" : "Complete"}
            </span>

            {!isLastCard ? (
              <button onClick={() => goToCard(currentCard + 1)}
                className="h-10 px-5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all flex items-center gap-2">
                Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ) : (
              <div className="w-24" /> /* spacer */
            )}
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-medium shadow-lg z-50 card-fade-up">
          {error}
        </div>
      )}
    </div>
  );
}
