"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { cn } from "@/lib/utils";
import katex from "katex";
import { SaveNoteButton } from "@/components/SaveNoteButton";
import { NovaPanel } from "@/components/NovaPanel";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LessonReference { title: string; url: string; note?: string }
interface AppliedTask { type: "writing" | "design"; prompt: string; model_answer?: string; checklist?: string[] }
interface LessonData {
  id: string; module_id: string; course_id: string; order_index: number;
  title: string; theory_md: string; estimated_minutes: number; learning_objectives: string[];
  case_study?: string | null; reference_links?: LessonReference[] | null;
  applied_task?: AppliedTask | null;
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
  prevLessonId: string | null; nextLessonId: string | null; alreadyCompleted: boolean;
  weakTopics: string[];
}

// ─── Card types ────────────────────────────────────────────────────────────

type CardType = "objectives" | "theory" | "quiz" | "summary" | "casestudy" | "applied" | "practice" | "complete";

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

function renderMarkdownTable(tableBlock: string): string {
  const rows = tableBlock.trim().split("\n").filter(r => r.trim());
  if (rows.length < 2) return tableBlock;

  // Parse cells from a pipe-delimited row
  const parseCells = (row: string) =>
    row.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);

  // Detect separator row (|---|---|)
  const isSeparator = (row: string) => /^\|[\s:-]+\|/.test(row.trim()) && row.includes("-");

  const headerCells = parseCells(rows[0]);
  const hasSeparator = rows.length > 1 && isSeparator(rows[1]);
  const dataRows = hasSeparator ? rows.slice(2) : rows.slice(1);

  let tableHtml = `<div class="my-6 overflow-x-auto rounded-xl border border-border shadow-card">`;
  tableHtml += `<table class="w-full text-sm border-collapse">`;

  // Header
  if (hasSeparator && headerCells.length > 0) {
    tableHtml += `<thead><tr class="bg-brand/5 border-b-2 border-brand/15">`;
    for (const cell of headerCells) {
      tableHtml += `<th class="px-4 py-3 text-left text-xs font-bold text-ink uppercase tracking-wider">${cell}</th>`;
    }
    tableHtml += `</tr></thead>`;
  }

  // Body
  tableHtml += `<tbody>`;
  for (let i = 0; i < dataRows.length; i++) {
    const cells = parseCells(dataRows[i]);
    const stripe = i % 2 === 0 ? "bg-surface" : "bg-surface-soft/50";
    tableHtml += `<tr class="${stripe} border-b border-border/50 last:border-0">`;
    for (let j = 0; j < cells.length; j++) {
      const isFirstCol = j === 0;
      tableHtml += `<td class="px-4 py-3 ${isFirstCol ? "font-semibold text-ink" : "text-ink-secondary"}">${cells[j]}</td>`;
    }
    tableHtml += `</tr>`;
  }
  tableHtml += `</tbody></table></div>`;
  return tableHtml;
}

function renderSection(md: string): string {
  if (!md) return "";

  // ── Step 1: Extract fenced code blocks to protect them ──
  const codeBlocks: string[] = [];
  let processed = md.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
    const language = lang ?? "text";
    const block = `<div class="relative rounded-xl overflow-hidden my-6 border border-white/10 shadow-lg">
        <div class="flex items-center gap-2 px-4 py-2.5" style="background:#161B22">
          <div class="flex gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">${language}</span>
        </div>
        <pre class="p-5 overflow-x-auto text-[13px] leading-[1.75] font-mono" style="background:#0D1117;color:#E6EDF3"><code>${code.trim()}</code></pre>
      </div>`;
    codeBlocks.push(block);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // ── Step 1.5: Extract math ($$ block + $ inline) and render with KaTeX ──
  const mathBlocks: string[] = [];
  const renderMath = (tex: string, displayMode: boolean) => {
    try { return katex.renderToString(tex.trim(), { displayMode, throwOnError: false, output: "html" }); }
    catch { return tex; }
  };
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
    mathBlocks.push(`<div class="my-5 overflow-x-auto text-center">${renderMath(tex, true)}</div>`);
    return `\x00MATH${mathBlocks.length - 1}\x00`;
  });
  processed = processed.replace(/\$([^$\n]+?)\$/g, (_m, tex: string) => {
    mathBlocks.push(renderMath(tex, false));
    return `\x00MATH${mathBlocks.length - 1}\x00`;
  });

  // ── Step 2: Extract markdown tables ──
  const tableBlocks: string[] = [];
  processed = processed.replace(/((?:^\|.+\|\s*\n){2,})/gm, (tableMatch) => {
    tableBlocks.push(renderMarkdownTable(tableMatch));
    return `\x00TABLE${tableBlocks.length - 1}\x00`;
  });

  // ── Step 3: Escape HTML ──
  processed = processed
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ── Step 4: Inline + block formatting ──
  let html = processed
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

  // ── Step 5: Restore code blocks and tables ──
  for (let i = 0; i < codeBlocks.length; i++) {
    html = html.replace(`\x00CODE${i}\x00`, codeBlocks[i]);
  }
  for (let i = 0; i < tableBlocks.length; i++) {
    html = html.replace(`\x00TABLE${i}\x00`, tableBlocks[i]);
  }
  for (let i = 0; i < mathBlocks.length; i++) {
    html = html.replace(`\x00MATH${i}\x00`, mathBlocks[i]);
  }

  return html;
}

// ─── Parse theory into cards ───────────────────────────────────────────────

function parseTheoryIntoCards(theory: string, exercises: ExerciseData[], objectives: string[], caseStudy: string, references: LessonReference[], hasAppliedTask: boolean): LessonCard[] {
  const cards: LessonCard[] = [];

  // 1. Objectives card (if any)
  if (objectives && objectives.length > 0) {
    cards.push({ type: "objectives", title: "What You'll Learn" });
  }

  // 2. Split theory on ## headers into sections.
  //    Strip the leading "# Title" block first — it duplicates the lesson header
  //    and would otherwise render as an empty first step (showing a literal "#").
  const theoryBody = theory.replace(/^\s*#(?!#)\s+.*(?:\r?\n)+/, "");
  const sections: { title: string; content: string }[] = [];
  const parts = theoryBody.split(/^## /gm);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const firstNewline = trimmed.indexOf("\n");
    const rawTitle = firstNewline === -1 ? trimmed : trimmed.substring(0, firstNewline);
    const title = rawTitle.replace(/^#+\s*/, "").trim();           // never show a literal "#"
    const content = firstNewline === -1 ? "" : trimmed.substring(firstNewline + 1).trim();
    sections.push({ title, content });
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

  // 4b. Real-world case study (how companies use this) — shown after the recap.
  if ((caseStudy && caseStudy.trim()) || (references && references.length > 0)) {
    cards.push({ type: "casestudy", title: "Real-World Case Study" });
  }

  // 4c. Applied "Apply It" task — reflective (not graded), optional Nova feedback.
  if (hasAppliedTask) {
    cards.push({ type: "applied", title: "Apply It" });
  }

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
  lessonPosition, totalLessonsInModule, prevLessonId, nextLessonId, alreadyCompleted,
  weakTopics,
}: LearnClientProps) {
  const router = useRouter();
  const styleRef = useRef(false);

  // Parse theory into cards
  const references = lesson.reference_links ?? [];
  const appliedTask = lesson.applied_task ?? null;
  const cards = parseTheoryIntoCards(lesson.theory_md ?? "", exercises, lesson.learning_objectives, lesson.case_study ?? "", references, !!(appliedTask && appliedTask.prompt));
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
  const [quizAttempts, setQuizAttempts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [appliedAnswer, setAppliedAnswer] = useState("");
  const [appliedRevealed, setAppliedRevealed] = useState(false);

  // ── Nova in-lesson panel ──
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaSeed, setNovaSeed] = useState<{ text: string; nonce: number } | null>(null);
  const novaNonce = useRef(0);
  // Snapshot the learner's own code / short answers so Nova can react to what
  // they've actually written (not just the lesson text). Skips empty fields and
  // untouched starter code so we don't waste tokens or confuse the model.
  const currentWork = exercises
    .filter((ex) => ex.type !== "mcq")
    .map((ex) => {
      const r = responses[ex.id];
      if (!r) return null;
      const code = (r.codeResponse ?? "").trim();
      const text = (r.responseText ?? "").trim();
      const starter = (ex.starter_code ?? "").trim();
      const body = ex.type === "code" ? (code && code !== starter ? code : "") : text;
      if (!body) return null;
      return `Exercise "${ex.title}" (${ex.type}):\n${body.slice(0, 1200)}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 3500);

  const novaContext = {
    courseTitle: course?.title ?? "your course",
    currentLessonTitle: lesson.title,
    lessonObjectives: lesson.learning_objectives,
    lessonContentSummary: (lesson.theory_md ?? "").slice(0, 1500),
    weakTopics,
    currentWork: currentWork || undefined,
  };
  function openNova(seedText?: string) {
    if (seedText) {
      novaNonce.current += 1;
      setNovaSeed({ text: seedText, nonce: novaNonce.current });
    }
    setNovaOpen(true);
  }
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

  // Inline quiz pick — retry-aware. A wrong answer no longer locks the question;
  // the student gets a nudge and can try again. After the 2nd miss we reveal the
  // correct answer and offer "Ask Nova" so the mistake becomes a teaching moment.
  function handleQuizPick(exerciseId: string, selected: string, correct: string) {
    if (quizAnswered[exerciseId]) return; // already locked (correct or 2 misses)
    const isRight = selected.trim().toLowerCase() === correct.trim().toLowerCase();
    setResponses(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], selectedOption: selected } }));

    if (isRight) {
      setQuizAnswered(prev => ({ ...prev, [exerciseId]: true }));
      setQuizCorrect(prev => ({ ...prev, [exerciseId]: true }));
      return;
    }

    const attempts = (quizAttempts[exerciseId] ?? 0) + 1;
    setQuizAttempts(prev => ({ ...prev, [exerciseId]: attempts }));
    if (attempts >= 2) {
      // Lock after second miss, reveal correct answer
      setQuizAnswered(prev => ({ ...prev, [exerciseId]: true }));
      setQuizCorrect(prev => ({ ...prev, [exerciseId]: false }));
    }
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
      // Send answers for every engaged MCQ so the server can verify the
      // comprehension checks were actually completed (anti-spoof gate).
      const answers: Record<string, string> = {};
      for (const ex of exercises) {
        if (ex.type === "mcq" && quizAnswered[ex.id] && ex.correct_answer) {
          answers[ex.id] = ex.correct_answer;
        }
      }
      const res = await fetch("/api/learn/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, answers }),
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
          {/* Lesson-to-lesson nav — review any lesson, flows across modules */}
          {(prevLessonId || nextLessonId) && (
            <div className="flex items-center justify-between mb-2">
              {prevLessonId ? (
                <button onClick={() => router.push(`/learn/${prevLessonId}`)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-brand transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  Previous lesson
                </button>
              ) : <span />}
              {nextLessonId ? (
                <button onClick={() => router.push(`/learn/${nextLessonId}`)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-brand transition-colors">
                  Next lesson
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              ) : <span />}
            </div>
          )}
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
            {/* Nova + Time + card counter */}
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => openNova()}
                className="flex items-center gap-1.5 px-3 h-8 rounded-full text-white text-xs font-bold shrink-0 hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#7C3AED)" }}
                title="Ask Nova about this lesson">
                <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-black">N</span>
                Nova
              </button>
              <span className="hidden sm:inline text-[10px] text-ink-muted font-medium">{minutesLeft}m left</span>
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
                  c.type === "casestudy" ? "w-2 h-2 bg-sky-300" :
                  c.type === "applied" ? "w-2 h-2 bg-fuchsia-300" :
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
                  <button onClick={() => openNova(`Explain this section more simply: "${card.title}".`)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand/20 bg-surface-tint text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Ask Nova
                  </button>
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
              const attempts = quizAttempts[ex.id] ?? 0;
              const lastPick = responses[ex.id]?.selectedOption;
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
                          const isThis = lastPick === opt;
                          // Reveal correct only once locked
                          const correctOpt = answered && ex.correct_answer?.trim().toLowerCase() === opt.trim().toLowerCase();
                          // The locked-in wrong final pick
                          const wrongLocked = answered && isThis && !isCorrect;
                          // A wrong pick mid-retry (not yet locked)
                          const wrongTry = !answered && isThis && attempts > 0;
                          return (
                            <button key={i}
                              onClick={() => !answered && handleQuizPick(ex.id, opt, ex.correct_answer ?? "")}
                              disabled={!!answered}
                              className={cn(
                                "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4",
                                correctOpt ? "border-emerald-400 bg-emerald-50" :
                                wrongLocked || wrongTry ? "border-red-400 bg-red-50" :
                                "border-border bg-surface hover:border-brand/30 hover:scale-[1.01]",
                                answered ? "cursor-default" : "cursor-pointer"
                              )}>
                              <span className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all",
                                correctOpt ? "bg-emerald-500 text-white check-pop" :
                                wrongLocked || wrongTry ? "bg-red-500 text-white" :
                                "bg-surface-alt text-ink-muted"
                              )}>
                                {correctOpt ? "✓" : wrongLocked || wrongTry ? "✗" : String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm text-ink">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Feedback */}
                    {isCorrect && (
                      <div className="mt-5 px-5 py-4 rounded-xl text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 card-fade-up">
                        <p className="font-bold mb-1">Correct!</p>
                        <p className="text-ink-secondary">Great recall — you understood this section.</p>
                      </div>
                    )}

                    {/* First miss — nudge, allow retry */}
                    {!answered && attempts === 1 && (
                      <div className="mt-5 px-5 py-4 rounded-xl text-sm bg-amber-50 border border-amber-200 text-amber-800 card-fade-up">
                        <p className="font-bold mb-1">Not quite — take another look.</p>
                        <p className="text-amber-700/90">Re-read the options and try once more. You&apos;ve got this.</p>
                      </div>
                    )}

                    {/* Second miss — reveal + Ask Nova */}
                    {answered && !isCorrect && (
                      <div className="mt-5 px-5 py-4 rounded-xl text-sm bg-red-50 border border-red-200 card-fade-up">
                        <p className="font-bold text-red-700 mb-1">The correct answer is: {ex.correct_answer}</p>
                        <p className="text-ink-secondary mb-3">Don&apos;t just memorise it — make sure you understand <em>why</em>.</p>
                        <button
                          onClick={() => openNova(`I got this quiz question wrong: "${ex.prompt_md}" — the answer is "${ex.correct_answer}". Explain why that's correct and why the other options aren't, simply.`)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                          Ask Nova why
                        </button>
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

            {/* ═══ CASE STUDY CARD ═══ */}
            {card.type === "casestudy" && (
              <div className="card-fade-up">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                    Real-World Case Study
                  </span>
                  <h2 className="text-xl font-black text-ink mt-3">How this is used in the real world</h2>
                </div>

                {lesson.case_study && lesson.case_study.trim() && (
                  <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card lesson-content"
                    dangerouslySetInnerHTML={{ __html: renderSection(lesson.case_study) }} />
                )}

                {references.length > 0 && (
                  <div className="mt-5 bg-surface rounded-2xl border border-border p-6 shadow-card">
                    <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                      Further reading
                    </h3>
                    <ul className="space-y-3">
                      {references.map((r, i) => (
                        <li key={i}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:underline">{r.title} ↗</a>
                          {r.note && <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{r.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-center">
                  <button onClick={() => openNova(`Give me another real-world example of how "${lesson.title}" is used in industry.`)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand/20 bg-surface-tint text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    Ask Nova for another example
                  </button>
                </div>
              </div>
            )}

            {/* ═══ APPLY-IT CARD ═══ */}
            {card.type === "applied" && appliedTask && (
              <div className="card-fade-up">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700 text-xs font-bold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    {appliedTask.type === "design" ? "Design Task" : "Writing Task"}
                  </span>
                  <h2 className="text-xl font-black text-ink mt-3">Apply it</h2>
                  <p className="text-sm text-ink-muted">Practice on a real scenario — for your own learning, not graded.</p>
                </div>

                <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card">
                  <div className="lesson-content" dangerouslySetInnerHTML={{ __html: renderSection(appliedTask.prompt) }} />

                  <textarea
                    value={appliedAnswer}
                    onChange={(e) => setAppliedAnswer(e.target.value)}
                    placeholder={appliedTask.type === "design" ? "Outline your design / approach…" : "Write your answer…"}
                    rows={7}
                    className="mt-4 w-full px-5 py-4 rounded-xl border-2 border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand resize-none"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button onClick={() => setAppliedRevealed(v => !v)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink-secondary hover:bg-surface-alt transition-all">
                      {appliedRevealed ? "Hide model answer" : "Reveal what a strong answer includes"}
                    </button>
                    <button onClick={() => openNova(`I'm doing this ${appliedTask.type} task for the lesson "${lesson.title}":\n\n${appliedTask.prompt}\n\nHere is my answer:\n${appliedAnswer || "(I haven't written anything yet — give me a hint to get started.)"}\n\nGive me concise, constructive feedback.`)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                      Get Nova&apos;s feedback
                    </button>
                  </div>

                  {appliedRevealed && (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 card-fade-up">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">What a strong answer includes</p>
                      {appliedTask.model_answer && (
                        <div className="lesson-content text-sm" dangerouslySetInnerHTML={{ __html: renderSection(appliedTask.model_answer) }} />
                      )}
                      {appliedTask.checklist && appliedTask.checklist.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {appliedTask.checklist.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-ink-muted mt-4">This task isn&apos;t graded and won&apos;t block completion — it&apos;s deliberate practice. Nova feedback is optional.</p>
                </div>
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

                {/* Comprehension check gate */}
                {!completed && exercises.length > 0 && (() => {
                  const mcqExercises = exercises.filter(e => e.type === "mcq");
                  const nonMcqExercises = exercises.filter(e => e.type !== "mcq");
                  const mcqsDone = mcqExercises.every(e => quizAnswered[e.id]);
                  const nonMcqsDone = nonMcqExercises.length === 0 || !!results;
                  const allDone = mcqsDone && nonMcqsDone;

                  if (!allDone) {
                    const remaining: string[] = [];
                    if (!mcqsDone) remaining.push(`${mcqExercises.filter(e => !quizAnswered[e.id]).length} quiz question${mcqExercises.filter(e => !quizAnswered[e.id]).length > 1 ? "s" : ""}`);
                    if (!nonMcqsDone) remaining.push(`${nonMcqExercises.length} exercise${nonMcqExercises.length > 1 ? "s" : ""}`);
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 max-w-sm mx-auto">
                        <p className="text-xs font-semibold text-amber-800 flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          Complete {remaining.join(" and ")} first
                        </p>
                        <p className="text-[10px] text-amber-700 mt-1">Answer all exercises to unlock lesson completion.</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {!completed && !results && exercises.filter(e => e.type !== "mcq").length > 0 && (
                    <Button onClick={handleSubmit} loading={submitting} disabled={submitting} className="rounded-xl">
                      Submit Exercises
                    </Button>
                  )}
                  {!completed && (() => {
                    const mcqsDone = exercises.filter(e => e.type === "mcq").every(e => quizAnswered[e.id]);
                    const nonMcqsDone = exercises.filter(e => e.type !== "mcq").length === 0 || !!results;
                    return mcqsDone && nonMcqsDone;
                  })() && (
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
               card.type === "casestudy" ? "Case Study" :
               card.type === "applied" ? "Apply It" :
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

      {/* In-lesson Nova slide-over */}
      <NovaPanel open={novaOpen} onClose={() => setNovaOpen(false)} context={novaContext} seed={novaSeed} />
    </div>
  );
}
