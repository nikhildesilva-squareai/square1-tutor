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
import { ProductTour } from "@/components/ProductTour";

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
// Prompt Lab: a short_answer exercise with language='prompt' — the student writes
// the PROMPT they'd send an AI assistant for a scenario, and Nova grades the prompt.
interface PromptGrade {
  total: number;
  dimensions: { key: string; label: string; score: number; tip: string }[];
  strength: string;
  improved_prompt: string;
}
const PROMPT_LAB_MAX_TRIES = 3;

interface OutlineLesson { id: string; title: string; completed: boolean; reachable: boolean }
interface OutlineModule { id: string; title: string; orderIndex: number; lessons: OutlineLesson[] }

interface LearnClientProps {
  lesson: LessonData; module: ModuleData | null; course: CourseData | null;
  exercises: ExerciseData[]; lessonPosition: number; totalLessonsInModule: number;
  prevLessonId: string | null; nextLessonId: string | null; alreadyCompleted: boolean;
  outline: OutlineModule[];
  weakTopics: string[];
  advancedCourse?: { slug: string; title: string } | null;
  /** True when this student has never completed ANY lesson — unlocks the
   *  "first win" milestone card ~5 minutes in (see parseTheoryIntoCards). */
  firstEverLesson?: boolean;
}

// ─── Card types ────────────────────────────────────────────────────────────

type CardType = "objectives" | "theory" | "quiz" | "summary" | "casestudy" | "applied" | "practice" | "complete" | "milestone";

interface LessonCard {
  type: CardType;
  title: string;
  content?: string;       // rendered HTML for theory cards
  rawContent?: string;    // raw markdown section
  exercise?: ExerciseData; // for quiz/practice cards
  takeaway?: string;      // optional one-line "In short" section takeaway
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
.ring-progress { transition: stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1), stroke 0.3s ease }
@keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.02) } }
.cta-breathe { animation: breathe 2s ease-in-out infinite }
@keyframes riseIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
.rise-in { animation: riseIn 0.35s cubic-bezier(0.16,1,0.3,1) both }
@media (prefers-reduced-motion: reduce) { .cta-breathe, .rise-in { animation:none } .ring-progress { transition:none } }
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
    const encoded = encodeURIComponent(code.trim());
    const btn = "flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer";
    const block = `<div class="relative rounded-xl overflow-hidden my-6 border border-white/10 shadow-lg">
        <div class="flex items-center gap-2 px-4 py-2.5" style="background:#161B22">
          <div class="flex gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">${language}</span>
          <div class="ml-auto flex items-center gap-1">
            <button type="button" data-code-action="copy" data-code="${encoded}" class="${btn}">Copy</button>
            <button type="button" data-code-action="save" data-code="${encoded}" data-lang="${language}" class="${btn}" title="Save to your Study Hub cheatsheet">Save ➜ Hub</button>
          </div>
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

// Inline-only markdown for short strings (exercise prompts): escapes HTML, then
// renders `code`, ***bold italic***, **bold**, *italic*. No block elements, so
// it can live safely inside the prompt's <p> without breaking its typography.
function renderInlineMd(md: string): string {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

// ─── Parse theory into cards ───────────────────────────────────────────────

function parseTheoryIntoCards(theory: string, exercises: ExerciseData[], objectives: string[], caseStudy: string, references: LessonReference[], hasAppliedTask: boolean, firstEverLesson = false): LessonCard[] {
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

  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    // Anything before the FIRST "## " is the lesson's lead-in paragraph, not a section
    // heading. It must render as body copy: dropping it into the section <h2> would
    // show the whole paragraph as one bold block with literal "**" markers, and leave
    // the card body empty. (Only fires when parts[0] is non-empty — a lesson whose
    // theory starts straight at "## " yields an empty parts[0], which is skipped.)
    if (idx === 0) {
      sections.push({ title: "Overview", content: trimmed });
      return;
    }
    const firstNewline = trimmed.indexOf("\n");
    const rawTitle = firstNewline === -1 ? trimmed : trimmed.substring(0, firstNewline);
    const title = rawTitle.replace(/^#+\s*/, "").trim();           // never show a literal "#"
    // Strip the `---` section separators that glue to the section body when we
    // split on `##` — renderSection prints them as literal dashes otherwise.
    const content = (firstNewline === -1 ? "" : trimmed.substring(firstNewline + 1))
      .replace(/(?:\r?\n)\s*-{3,}\s*$/, "")   // trailing separator
      .replace(/^\s*-{3,}\s*(?:\r?\n)/, "")    // leading separator
      .trim();
    sections.push({ title, content });
  });

  // 3. Add theory cards with inline quizzes after every 2 sections
  const mcqExercises = exercises.filter(e => e.type === "mcq");
  let quizIdx = 0;

  sections.forEach((section, i) => {
    // Lift an optional author takeaway from the FIRST non-empty line —
    // `**In short:** …` or `> [!KEY] …` — into a chip and strip it from the body.
    let takeaway: string | undefined;
    let body = section.content;
    const bodyLines = body.split(/\r?\n/);
    const firstIdx = bodyLines.findIndex((l) => l.trim().length > 0);
    if (firstIdx !== -1) {
      const m = bodyLines[firstIdx].match(/^\s*(?:\*\*In short:\*\*|>\s*\[!KEY\])\s*(.+?)\s*$/i);
      if (m) {
        takeaway = m[1].trim();
        bodyLines.splice(firstIdx, 1);
        body = bodyLines.join("\n").replace(/^\s+/, "");
      }
    }
    cards.push({
      type: "theory",
      title: section.title,
      content: renderSection(body),
      rawContent: body,
      takeaway,
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

  // 3b. First-win milestone — ONLY on a student's very first lesson. The full
  // lesson is a 30–40 minute ask; the honest "5-minute first win" is the first
  // concept + its quick check. Right there we celebrate and offer a clean exit
  // (momentum by choice, not by trap). Placed after the first quiz card, or
  // after the opening cards when a lesson has no MCQs.
  if (firstEverLesson && cards.length > 1) {
    const firstQuiz = cards.findIndex((c) => c.type === "quiz");
    const anchor = firstQuiz !== -1 ? firstQuiz + 1 : Math.min(cards.length, 3);
    cards.splice(anchor, 0, { type: "milestone", title: "First win" });
  }

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
//  Phone → computer bridge
// ═══════════════════════════════════════════════════════════════════════════
// Code exercises are painful on a phone keyboard. On small screens each code
// exercise carries a one-tap "Email me this lesson" so the student can finish
// on a computer without losing their place (deep link via /api/learn/email-link).
function EmailLessonLinkButton({ lessonId }: { lessonId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function send() {
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/learn/email-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }
  return (
    <button
      type="button"
      onClick={send}
      disabled={status === "sending" || status === "sent"}
      className="shrink-0 text-[11px] font-bold text-amber-900 underline underline-offset-2 disabled:no-underline disabled:opacity-80"
    >
      {status === "sent" ? "✓ Sent to your inbox" : status === "sending" ? "Sending…" : status === "error" ? "Failed — tap to retry" : "Email me this lesson"}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LearnClient({
  lesson, module, course, exercises,
  lessonPosition, totalLessonsInModule, prevLessonId, nextLessonId, alreadyCompleted,
  outline, weakTopics, advancedCourse, firstEverLesson = false,
}: LearnClientProps) {
  const router = useRouter();
  const styleRef = useRef(false);

  // Jump menu — reach any lesson in the course (especially already-covered ones)
  // from inside a lesson, without going back out to the course page.
  const [jumpOpen, setJumpOpen] = useState(false);
  const jumpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jumpOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (jumpRef.current && !jumpRef.current.contains(e.target as Node)) setJumpOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setJumpOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [jumpOpen]);

  // Parse theory into cards
  const references = lesson.reference_links ?? [];
  const appliedTask = lesson.applied_task ?? null;
  const cards = parseTheoryIntoCards(lesson.theory_md ?? "", exercises, lesson.learning_objectives, lesson.case_study ?? "", references, !!(appliedTask && appliedTask.prompt), firstEverLesson);
  const [currentCard, setCurrentCard] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [visitedCards, setVisitedCards] = useState<Set<number>>(new Set([0]));

  // Exercise state
  const [responses, setResponses] = useState<Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }>>(() => {
    const init: Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }> = {};
    exercises.forEach(ex => { init[ex.id] = { selectedOption: undefined, responseText: "", codeResponse: ex.starter_code ?? "" }; });
    return init;
  });
  // MCQ options are stored with the correct answer overwhelmingly first — shuffle
  // per mount so option order carries no signal. Grading compares option TEXT, so
  // this is safe; computed once in the initializer so re-renders never reshuffle.
  const [shuffledOptions] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    exercises.forEach(ex => {
      if (ex.type === "mcq" && ex.options) {
        map[ex.id] = [...ex.options]
          .map(o => ({ o, r: Math.random() }))
          .sort((a, b) => a.r - b.r)
          .map(x => x.o);
      }
    });
    return map;
  });
  const [quizAnswered, setQuizAnswered] = useState<Record<string, boolean>>({});
  const [quizCorrect, setQuizCorrect] = useState<Record<string, boolean>>({});
  const [quizAttempts, setQuizAttempts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [appliedAnswer, setAppliedAnswer] = useState("");
  const [appliedRevealed, setAppliedRevealed] = useState(false);

  // ── Prompt Lab state ──
  const [promptGrades, setPromptGrades] = useState<Record<string, PromptGrade>>({});
  const [promptGrading, setPromptGrading] = useState<Record<string, boolean>>({});
  const [promptTries, setPromptTries] = useState<Record<string, number>>({});
  const [promptErrors, setPromptErrors] = useState<Record<string, string | null>>({});
  const [promptImprovedOpen, setPromptImprovedOpen] = useState<Record<string, boolean>>({});

  // ── Session memory: resume exactly where the student stopped ──────────────
  // Card position, typed answers, and locked quick-check results survive
  // leaving the lesson (tab close, navigation, the phone→computer bridge).
  // localStorage per lesson; restored once on mount, cleared on completion.
  // MCQ restore is safe across the per-mount option shuffle because answers
  // are stored as option TEXT, not index.
  const [resumed, setResumed] = useState(false);
  const restoredRef = useRef(false);

  async function gradePromptDrill(exId: string) {
    const text = (responses[exId]?.responseText ?? "").trim();
    if (text.length < 10) {
      setPromptErrors(p => ({ ...p, [exId]: "Write your prompt first (at least a sentence)." }));
      return;
    }
    setPromptErrors(p => ({ ...p, [exId]: null }));
    setPromptGrading(p => ({ ...p, [exId]: true }));
    try {
      const res = await fetch("/api/learn/grade-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exId, promptText: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.grade) {
        setPromptErrors(p => ({ ...p, [exId]: data.error ?? "Grading failed — try again." }));
        return;
      }
      setPromptGrades(p => ({ ...p, [exId]: data.grade as PromptGrade }));
      setPromptTries(p => ({ ...p, [exId]: (p[exId] ?? 0) + 1 }));
      setPromptImprovedOpen(p => ({ ...p, [exId]: false }));
    } catch {
      setPromptErrors(p => ({ ...p, [exId]: "Network error — try again." }));
    } finally {
      setPromptGrading(p => ({ ...p, [exId]: false }));
    }
  }

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

  // Ask Nova about a SPECIFIC section — seeds the prompt with the section text
  // (capped) so answers are grounded in that section, not just its title.
  function openNovaForSection(card: LessonCard, intent: "explain" | "example" | "quiz") {
    const body = (card.rawContent ?? "").slice(0, 1200);
    const ask =
      intent === "explain" ? "Explain this section more simply." :
      intent === "example" ? "Give me another concrete example for this section." :
                             "Quiz me with 2 quick questions on this section, then wait for my answers.";
    openNova(`${ask}\n\nSection: "${card.title}"\n\n${body}`);
  }

  // ── Code-block toolbar (delegated) ──
  // Lesson code blocks are rendered as HTML strings; their Copy / Save➜Hub
  // buttons carry the code in data attributes and clicks are handled here,
  // where lesson/course context is available.
  const handleCodeAction = useCallback(async (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest?.("[data-code-action]") as HTMLElement | null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const code = decodeURIComponent(btn.dataset.code ?? "");
    if (!code) return;
    const original = btn.textContent;
    const flash = (label: string) => {
      btn.textContent = label;
      setTimeout(() => { btn.textContent = original; }, 2000);
    };
    if (btn.dataset.codeAction === "copy") {
      try { await navigator.clipboard.writeText(code); flash("Copied ✓"); } catch { flash("Copy failed"); }
      return;
    }
    // save → Study Hub as a fenced snippet with language + lesson context
    const lang = btn.dataset.lang && btn.dataset.lang !== "text" ? btn.dataset.lang : "";
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "code_snippet",
          title: `${lesson.title}${lang ? ` — ${lang}` : ""}`,
          content: "```" + lang + "\n" + code + "\n```",
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleTitle: module?.title,
          courseId: lesson.course_id,
          courseTitle: course?.title,
          tags: ["cheatsheet"],
        }),
      });
      flash(res.ok ? "Saved ✓" : "Failed");
    } catch {
      flash("Failed");
    }
  }, [lesson, module, course]);
  const [results, setResults] = useState<ExerciseResult[] | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);

  // Restore the saved session once, before any interaction. Merge order puts
  // live state last so anything the student has already done this visit wins.
  useEffect(() => {
    if (restoredRef.current || alreadyCompleted || cards.length === 0) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(`s1-lesson-pos-${lesson.id}`);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        card?: number;
        responses?: typeof responses;
        quizAnswered?: Record<string, boolean>;
        quizCorrect?: Record<string, boolean>;
        quizAttempts?: Record<string, number>;
        results?: ExerciseResult[] | null;
        appliedAnswer?: string;
      };
      if (!saved || typeof saved.card !== "number") return;
      const card = Math.min(Math.max(0, saved.card), cards.length - 1);
      if (saved.responses && typeof saved.responses === "object") {
        setResponses(p => {
          const merged = { ...p };
          for (const [id, r] of Object.entries(saved.responses!)) {
            if (merged[id]) merged[id] = { ...merged[id], ...r };
          }
          return merged;
        });
      }
      if (saved.quizAnswered) setQuizAnswered(p => ({ ...saved.quizAnswered, ...p }));
      if (saved.quizCorrect) setQuizCorrect(p => ({ ...saved.quizCorrect, ...p }));
      if (saved.quizAttempts) setQuizAttempts(p => ({ ...saved.quizAttempts, ...p }));
      if (Array.isArray(saved.results) && saved.results.length > 0) setResults(saved.results);
      if (typeof saved.appliedAnswer === "string" && saved.appliedAnswer) setAppliedAnswer(saved.appliedAnswer);
      if (card > 0) {
        setCurrentCard(card);
        setVisitedCards(new Set(Array.from({ length: card + 1 }, (_, i) => i)));
        setResumed(true);
      }
    } catch { /* corrupt or blocked storage — start from the top */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, alreadyCompleted, lesson.id]);

  // Save on every meaningful change. Cheap (a few KB), synchronous, and only
  // after the restore has run so a fresh mount can't clobber a saved session.
  useEffect(() => {
    if (!restoredRef.current || completed) return;
    try {
      localStorage.setItem(`s1-lesson-pos-${lesson.id}`, JSON.stringify({
        card: currentCard, responses, quizAnswered, quizCorrect, quizAttempts, results, appliedAnswer,
      }));
    } catch { /* storage full/blocked — resume just won't work this session */ }
  }, [currentCard, responses, quizAnswered, quizCorrect, quizAttempts, results, appliedAnswer, completed, lesson.id]);
  // Milestone facts from /api/learn/complete. isFirstWin drives the celebration
  // for lesson ONE — the highest-leverage screen a new learner ever sees.
  const [isFirstWin, setIsFirstWin] = useState(false);
  const [lessonsDone, setLessonsDone] = useState<number | null>(null);
  const [nextMinutes, setNextMinutes] = useState<number | null>(null);
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
      const data = await res.json().catch(() => null);
      if (data?.isFirstLesson) setIsFirstWin(true);
      if (typeof data?.lessonsCompleted === "number") setLessonsDone(data.lessonsCompleted);
      if (typeof data?.nextLessonMinutes === "number") setNextMinutes(data.nextLessonMinutes);
      setCompleted(true);
      // The lesson is banked — the saved session has done its job.
      try { localStorage.removeItem(`s1-lesson-pos-${lesson.id}`); } catch { /* ignore */ }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setCompleting(false); }
  }

  const card = cards[currentCard];
  const progressPct = cards.length > 0 ? ((currentCard + 1) / cards.length) * 100 : 0;
  const isLastCard = currentCard === cards.length - 1;
  const totalScore = results?.reduce((s, r) => s + r.score, 0) ?? 0;
  const maxScore = results?.reduce((s, r) => s + r.maxScore, 0) ?? 1;

  // ── Completion-card progress model ─────────────────────────────────
  // MCQ counts as done once answered inline; short-answer/code count as
  // done only after Nova has graded a submission (results !== null).
  const isExDone = (ex: ExerciseData) => (ex.type === "mcq" ? !!quizAnswered[ex.id] : !!results);
  const hasDraft = (ex: ExerciseData) => {
    const r = responses[ex.id];
    return !!(r?.responseText?.trim() || r?.codeResponse?.trim());
  };
  const exDoneCount = exercises.filter(isExDone).length;
  const exMcqsDone = exercises.filter(e => e.type === "mcq").every(e => quizAnswered[e.id]);
  const exPractices = exercises.filter(e => e.type !== "mcq");
  const exAllDone = exMcqsDone && (exPractices.length === 0 || !!results);
  const exReadyToSubmit = !results && exPractices.length > 0 && exPractices.every(hasDraft);
  const totalMarksAvailable = exercises.reduce((s, e) => s + (e.marks ?? 0), 0);
  // Next stop, module-aware: crossing into a NEW module is a milestone
  // moment and gets its own celebratory CTA on the completion card.
  const nextModule = nextLessonId ? outline.find(m => m.lessons.some(l => l.id === nextLessonId)) ?? null : null;
  const nextLessonTitle = nextModule?.lessons.find(l => l.id === nextLessonId)?.title ?? null;
  const nextIsNewModule = !!nextModule && !!module && nextModule.id !== module.id;

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
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
            <div ref={jumpRef} className="flex-1 min-w-0 relative">
              <button onClick={() => setJumpOpen((v) => !v)}
                aria-expanded={jumpOpen} aria-haspopup="true"
                title="Jump to any lesson"
                className="w-full text-left group">
                <p className="text-xs text-ink-muted truncate flex items-center gap-1">
                  {/* order_index IS the module number (Module 0 = the foundations
                      on-ramp); +1 would label Module 0 as "Module 1". */}
                  {module ? `Module ${module.order_index}` : ""} · Lesson {lessonPosition}/{totalLessonsInModule}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={cn("transition-transform group-hover:text-brand", jumpOpen && "rotate-180")}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </p>
                <h1 className="text-sm font-bold text-ink truncate group-hover:text-brand transition-colors">{lesson.title}</h1>
              </button>

              {jumpOpen && (
                <div className="absolute left-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto bg-surface border border-border rounded-xl shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-border sticky top-0 bg-surface">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Jump to lesson</p>
                  </div>
                  {outline.map((m) => (
                    <div key={m.id} className="border-b border-border last:border-0">
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-ink-muted uppercase tracking-wide truncate">
                        {m.title}
                      </p>
                      {m.lessons.map((l, li) => {
                        const isCurrent = l.id === lesson.id;
                        // Not yet reached — show it (so the shape of the course is
                        // visible) but don't offer it.
                        const locked = !l.reachable && !isCurrent;
                        return (
                          <button key={l.id}
                            disabled={locked}
                            title={locked ? "You'll unlock this as you progress" : undefined}
                            onClick={() => { if (locked) return; setJumpOpen(false); if (!isCurrent) router.push(`/learn/${l.id}`); }}
                            className={cn(
                              "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors",
                              locked ? "opacity-45 cursor-not-allowed" : isCurrent ? "bg-surface-tint" : "hover:bg-surface-alt",
                            )}>
                            <span className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                              l.completed ? "bg-emerald-100" : isCurrent ? "bg-brand" : "bg-surface-alt",
                            )}>
                              {l.completed ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : isCurrent ? (
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                              ) : (
                                <span className="text-[9px] font-bold text-ink-muted">{li + 1}</span>
                              )}
                            </span>
                            <span className={cn("text-xs truncate flex-1", isCurrent ? "text-brand font-bold" : "text-ink-secondary")}>
                              {l.title}
                            </span>
                            {l.completed && !isCurrent && (
                              <span className="text-[9px] font-bold text-brand shrink-0">Review</span>
                            )}
                            {locked && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
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
              <button key={i} onClick={() => goToCard(i)} aria-label={c.title}
                className={cn(
                  "shrink-0 min-h-0 rounded-full transition-all duration-300",
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
          {/* Resume chip — tells the student their place was kept, with an
              escape hatch back to the top of the lesson. */}
          {resumed && (
            <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/[0.05] px-4 py-2.5 card-fade-up">
              <p className="text-xs font-semibold text-ink">
                ↩ Picked up where you left off — card {currentCard + 1} of {cards.length}.
              </p>
              <button
                onClick={() => { setResumed(false); goToCard(0); }}
                className="text-[11px] font-bold text-brand hover:underline shrink-0">
                Start from the top
              </button>
            </div>
          )}
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

                {/* Per-section "In short" takeaway — lands the point before the prose */}
                {card.takeaway && (
                  <div data-tour="lesson-takeaway" className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-surface-tint px-4 py-3">
                    <span className="mt-0.5 shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-brand">In short</span>
                    <span className="text-[14.5px] font-medium leading-snug text-ink">{card.takeaway}</span>
                  </div>
                )}

                {/* Rendered content — larger text for readability */}
                <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card lesson-content"
                  onClick={handleCodeAction}
                  dangerouslySetInnerHTML={{ __html: card.content ?? "" }} />

                {/* Ask Nova about THIS section — 3 grounded actions + Save */}
                <div data-tour="lesson-nova" className="mt-5 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-extrabold text-white">N</span>
                      <span className="text-[13px] font-bold text-ink">Ask Nova <span className="font-medium text-ink-muted">about this section</span></span>
                    </div>
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
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openNovaForSection(card, "explain")}
                      className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-indigo-500/40 hover:bg-indigo-500/[0.06] transition-colors">Explain this simpler</button>
                    <button onClick={() => openNovaForSection(card, "example")}
                      className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-indigo-500/40 hover:bg-indigo-500/[0.06] transition-colors">Show another example</button>
                    <button onClick={() => openNovaForSection(card, "quiz")}
                      className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-indigo-500/40 hover:bg-indigo-500/[0.06] transition-colors">Quiz me on this</button>
                  </div>
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
                    <span data-tour="lesson-quiz" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                      Quick Check
                    </span>
                  </div>

                  <div className="bg-surface rounded-2xl border border-border p-6 shadow-card">
                    <p className="text-base font-semibold text-ink leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: renderInlineMd(ex.prompt_md) }} />

                    {ex.options && (
                      <div className="grid gap-3">
                        {(shuffledOptions[ex.id] ?? ex.options).map((opt, i) => {
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

            {/* ═══ FIRST-WIN MILESTONE (first-ever lesson only) ═══ */}
            {card.type === "milestone" && (
              <div className="max-w-2xl mx-auto text-center py-10 card-fade-up">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl mb-5 check-pop">🎉</div>
                <h2 className="text-2xl sm:text-3xl font-black text-ink mb-3">First win — banked.</h2>
                <p className="text-ink-secondary max-w-md mx-auto mb-2">
                  You just learned your first {course?.title ?? ""} concept and proved it with a check —
                  about five minutes in. That&apos;s further than most people who sign up anywhere ever get.
                </p>
                <p className="text-sm text-ink-muted max-w-md mx-auto mb-8">
                  Keep the momentum now, or stop here — this lesson stays one tap away on your dashboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => goToCard(currentCard + 1)}
                    className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors"
                  >
                    Keep going →
                  </button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-border text-ink-secondary font-semibold text-sm hover:text-ink hover:border-border-mid transition-colors"
                  >
                    I&apos;m done for today
                  </Link>
                </div>
              </div>
            )}

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
                    onClick={handleCodeAction}
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
                  <div className="lesson-content" onClick={handleCodeAction} dangerouslySetInnerHTML={{ __html: renderSection(appliedTask.prompt) }} />

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
                        <div className="lesson-content text-sm" onClick={handleCodeAction} dangerouslySetInnerHTML={{ __html: renderSection(appliedTask.model_answer) }} />
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
                      {ex.type === "code" ? "Build It" : ex.type === "short_answer" && ex.language === "prompt" ? "Prompt Lab — Nova grades your prompt" : "Explain"}
                    </span>
                    <span className="text-xs text-ink-muted ml-auto">{ex.marks} marks</span>
                  </div>

                  <div className="bg-surface rounded-2xl border border-border p-6 shadow-card">
                    <p className="text-base font-medium text-ink leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: renderInlineMd(ex.prompt_md) }} />

                    {ex.type === "short_answer" && (
                      <textarea
                        value={responses[ex.id]?.responseText ?? ""}
                        onChange={e => { if (!results) setResponses(p => ({...p, [ex.id]: {...p[ex.id], responseText: e.target.value}})); }}
                        disabled={!!results}
                        placeholder={ex.language === "prompt" ? "Write the exact prompt you would send to the AI assistant..." : "Write your answer..."}
                        rows={5}
                        className="w-full px-5 py-4 rounded-xl border-2 border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand resize-none"
                      />
                    )}

                    {/* ── Prompt Lab: grade the prompt itself with Nova ── */}
                    {ex.type === "short_answer" && ex.language === "prompt" && (() => {
                      const grade = promptGrades[ex.id];
                      const tries = promptTries[ex.id] ?? 0;
                      const grading = !!promptGrading[ex.id];
                      const triesLeft = PROMPT_LAB_MAX_TRIES - tries;
                      return (
                        <div className="mt-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => gradePromptDrill(ex.id)}
                              disabled={grading || triesLeft <= 0 || !!results}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                              {grading ? "Nova is grading..." : grade ? "Re-grade my prompt" : "Grade my prompt"}
                            </button>
                            <span className="text-[11px] text-ink-muted">
                              {triesLeft > 0 ? `${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left — improve and re-grade` : "No tries left for this drill"}
                            </span>
                          </div>
                          {promptErrors[ex.id] && (
                            <p className="mt-2 text-xs font-semibold text-red-600">{promptErrors[ex.id]}</p>
                          )}

                          {grade && (
                            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-5 card-fade-up">
                              <div className="flex items-baseline justify-between mb-4">
                                <p className="text-xs font-bold text-violet-700 uppercase tracking-widest">Nova&apos;s verdict</p>
                                <p className="text-2xl font-black text-ink">{grade.total}<span className="text-sm font-bold text-ink-muted">/100</span></p>
                              </div>
                              <div className="space-y-2.5">
                                {grade.dimensions.map(d => (
                                  <div key={d.key}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-ink">{d.label}</span>
                                      <span className={cn("text-xs font-bold", d.score >= 15 ? "text-emerald-600" : d.score >= 9 ? "text-amber-600" : "text-red-500")}>{d.score}/20</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-violet-100 overflow-hidden">
                                      <div className={cn("h-full rounded-full transition-all", d.score >= 15 ? "bg-emerald-500" : d.score >= 9 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${(d.score / 20) * 100}%` }} />
                                    </div>
                                    {d.tip && <p className="mt-1 text-[11.5px] leading-snug text-ink-secondary">{d.tip}</p>}
                                  </div>
                                ))}
                              </div>
                              {grade.strength && (
                                <p className="mt-4 text-xs text-emerald-700 font-semibold">✓ {grade.strength}</p>
                              )}
                              {grade.improved_prompt && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => setPromptImprovedOpen(p => ({ ...p, [ex.id]: !p[ex.id] }))}
                                    className="text-xs font-bold text-violet-700 hover:underline"
                                  >
                                    {promptImprovedOpen[ex.id] ? "Hide" : "Show"} a ~100-scoring version of your prompt
                                  </button>
                                  {promptImprovedOpen[ex.id] && (
                                    <div className="mt-2 rounded-lg border border-violet-200 bg-white px-4 py-3 text-[12.5px] leading-relaxed text-ink-secondary whitespace-pre-wrap">
                                      {grade.improved_prompt}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {ex.type === "code" && (
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#0D1117] border-b border-white/10">
                          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" /></div>
                          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">{ex.language ?? "python"}</span>
                        </div>
                        {/* Phone → computer bridge — writing code on a phone
                            keyboard is the silent killer of these exercises.
                            Hidden on lg+ where a real keyboard is likely. */}
                        <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200">
                          <span className="text-[11px] text-amber-900">💻 Easiest on a computer</span>
                          <EmailLessonLinkButton lessonId={lesson.id} />
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
                {completed ? (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 check-pop bg-emerald-100">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                ) : (
                  /* Progress ring — fills live as exercises are answered, flips
                     emerald with a pop the moment everything is done. */
                  <div className="relative w-28 h-28 mx-auto mb-5">
                    <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" stroke="currentColor" className="text-border" />
                      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round" stroke="currentColor"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - (exercises.length === 0 ? 1 : exDoneCount / exercises.length))}
                        className={cn("ring-progress", exAllDone ? "text-emerald-500" : "text-brand")} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {exAllDone ? (
                        <svg className="check-pop" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <>
                          <span className="text-xl font-black text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>{exDoneCount}/{exercises.length}</span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-muted">answered</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-black text-ink mb-2">
                  {completed
                    ? isFirstWin
                      ? "That's your first lesson done."
                      : "Lesson Complete!"
                    : exAllDone
                      ? "Everything's answered — lock it in"
                      : exReadyToSubmit && exMcqsDone
                        ? "All answers in. Ready for grading?"
                        : "Almost there"}
                </h2>
                <p className="text-sm text-ink-muted mb-5 max-w-sm mx-auto">
                  {completed
                    ? isFirstWin
                      ? "You just did the thing most people who sign up never do — you finished something. Everything from here builds on it."
                      : lessonsDone
                        ? `Great work. That's ${lessonsDone} lessons done.`
                        : "Great work. This lesson is in your progress."
                    : exAllDone
                      ? results
                        ? `Nova scored you ${Math.round((totalScore / maxScore) * 100)}% — mark the lesson complete to bank it.`
                        : "Every check is done. Mark the lesson complete to bank it."
                      : exReadyToSubmit && exMcqsDone
                        ? `Nova grades instantly — ${totalMarksAvailable} marks on the table.`
                        : `${exercises.length - exDoneCount} of ${exercises.length} to go — tap one below to jump straight to it.`}
                </p>

                {/* Session stat chips */}
                {!completed && (
                  <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-surface-alt border border-border text-[11px] font-semibold text-ink-secondary">{cards.filter(c => c.type === "theory").length} sections read</span>
                    <span className="px-3 py-1 rounded-full bg-surface-alt border border-border text-[11px] font-semibold text-ink-secondary">{Math.max(1, Math.round(elapsed / 60))} min in</span>
                    <span className="px-3 py-1 rounded-full bg-surface-alt border border-border text-[11px] font-semibold text-ink-secondary">{totalMarksAvailable} marks available</span>
                  </div>
                )}

                {/* First-win milestone — real facts only: what they just did,
                    and how long the next one takes. No invented stats. */}
                {completed && isFirstWin && (
                  <div className="max-w-sm mx-auto mb-6 rounded-2xl border border-brand/20 bg-brand/[0.04] p-5 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand mb-3">
                      What you just banked
                    </p>
                    <ul className="space-y-2 text-[13px] text-ink">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-emerald-600">✓</span>
                        <span>
                          {cards.filter(c => c.type === "theory").length} sections read in {Math.round(elapsed / 60)} minutes
                        </span>
                      </li>
                      {results && (
                        <li className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-emerald-600">✓</span>
                          <span>{totalScore}/{maxScore} marks on the exercises, graded by Nova</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-emerald-600">✓</span>
                        <span>This lesson&apos;s key ideas are now in your review deck for tomorrow</span>
                      </li>
                    </ul>
                    {nextLessonId && (
                      <p className="mt-4 pt-3 border-t border-brand/15 text-xs text-ink-muted">
                        {nextMinutes
                          ? `The next lesson takes about ${nextMinutes} minutes. Two in a row is how this starts to stick.`
                          : "Two in a row is how this starts to stick."}
                      </p>
                    )}
                  </div>
                )}

                {/* Score summary */}
                {results && (
                  <div className="bg-surface rounded-xl border border-border p-5 max-w-xs mx-auto mb-6">
                    <p className="text-3xl font-black text-ink mb-1">{Math.round((totalScore / maxScore) * 100)}%</p>
                    <p className="text-xs text-ink-muted">{totalScore}/{maxScore} marks</p>
                  </div>
                )}

                {/* Error-journal nudge — only when this lesson had real coding work */}
                {results && exercises.some(e => e.type === "code") && (
                  <a href="/notes#log-error"
                    className="inline-flex items-center gap-2 mx-auto mb-6 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/60 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18h6M10 22h4M12 2v1M12 7a4 4 0 014 4c0 1.5-.8 2.8-2 3.4V16H10v-1.6C8.8 13.8 8 12.5 8 11a4 4 0 014-4z" /></svg>
                    Hit a bug you solved? Log it to your Study Hub
                  </a>
                )}

                {/* Interactive exercise checklist — every row is a shortcut
                    straight to that exercise's card. Replaces the old dead-end
                    amber warning with a path to action. */}
                {!completed && exercises.length > 0 && (
                  <div className="max-w-sm mx-auto mb-5 text-left space-y-2">
                    {exercises.map((ex, i) => {
                      const done = isExDone(ex);
                      const draft = !done && ex.type !== "mcq" && hasDraft(ex);
                      const cardIdx = cards.findIndex(c => c.exercise?.id === ex.id);
                      return (
                        <button key={ex.id} type="button"
                          onClick={() => { if (cardIdx >= 0) goToCard(cardIdx); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all group rise-in",
                            done
                              ? "border-emerald-200 bg-emerald-50/60"
                              : draft
                                ? "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:shadow-sm"
                                : "border-border bg-surface hover:border-brand/40 hover:shadow-sm"
                          )}
                          style={{ animationDelay: `${i * 50}ms` }}>
                          {done ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 check-pop">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                          ) : draft ? (
                            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full border-2 border-border shrink-0" />
                          )}
                          <span className="flex-1 min-w-0">
                            <span className={cn("block text-[13px] font-semibold truncate", done ? "text-emerald-800" : "text-ink")}>
                              {ex.title || (ex.type === "mcq" ? `Quick check ${i + 1}` : `Exercise ${i + 1}`)}
                            </span>
                            <span className="block text-[10px] text-ink-muted">
                              {ex.marks} mark{ex.marks === 1 ? "" : "s"} · {done ? "done" : draft ? "drafted — submit to grade" : ex.type === "mcq" ? "not answered yet" : "not started"}
                            </span>
                          </span>
                          {!done && (
                            <svg className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-brand" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Anticipation panel — what finishing unlocks, in real terms. */}
                {!completed && (
                  <div className="max-w-sm mx-auto mb-6 rounded-2xl border border-brand/15 bg-brand/[0.04] px-5 py-4 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand mb-2.5">When you finish this lesson</p>
                    <ul className="space-y-2 text-xs text-ink-secondary">
                      {!results && exPractices.length > 0 && (
                        <li className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-brand">•</span>
                          <span>Nova grades your answers instantly — {totalMarksAvailable} marks feed your skill report</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-brand">•</span>
                        <span>This lesson&apos;s key ideas join tomorrow&apos;s review deck</span>
                      </li>
                      {nextLessonId && (
                        <li className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-brand">•</span>
                          <span>
                            {nextIsNewModule
                              ? <>You unlock the next module: <strong className="text-ink">{nextModule?.title}</strong></>
                              : <>Up next: <strong className="text-ink">{nextLessonTitle ?? "the next lesson"}</strong>{nextMinutes ? ` · ~${nextMinutes} min` : ""}</>}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {!completed && !results && exercises.filter(e => e.type !== "mcq").length > 0 && (
                    <Button onClick={handleSubmit} loading={submitting} disabled={submitting}
                      className={cn("rounded-xl", exReadyToSubmit && exMcqsDone && "cta-breathe")}>
                      {exReadyToSubmit ? `Submit for grading · ${totalMarksAvailable} marks` : "Submit Exercises"}
                    </Button>
                  )}
                  {!completed && exAllDone && (
                    <Button onClick={handleComplete} loading={completing} disabled={completing} className="rounded-xl cta-breathe">
                      Mark Complete
                    </Button>
                  )}
                  {completed && nextLessonId && (
                    nextIsNewModule ? (
                      /* Module hand-off — crossing into a new module is a
                         milestone, not just another lesson hop. */
                      <button onClick={() => router.push(`/learn/${nextLessonId}`)}
                        className="group px-6 py-3 rounded-2xl text-white text-left transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-4"
                        style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 mb-0.5">Next module unlocked</p>
                          <p className="text-sm font-bold">{nextModule?.title}</p>
                        </div>
                        <svg className="transition-transform group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    ) : (
                      <button onClick={() => router.push(`/learn/${nextLessonId}`)}
                        className="group h-11 px-6 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
                        Next Lesson{nextMinutes ? ` · ~${nextMinutes} min` : ""}
                        <svg className="transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    )
                  )}
                  {completed && !nextLessonId && (
                    <Link href={course ? `/courses/${course.slug}` : "/dashboard"}
                      className="h-11 px-6 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all inline-flex items-center gap-2">
                      Back to Course
                    </Link>
                  )}
                </div>

                {/* Advanced course upsell — fires on final lesson completion */}
                {completed && !nextLessonId && advancedCourse && (
                  <div className="mt-6 rounded-xl p-5 text-white max-w-xs mx-auto"
                    style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">What&apos;s Next</p>
                    <h3 className="text-sm font-bold mb-1">{advancedCourse.title}</h3>
                    <p className="text-xs text-white/70 mb-3">6 senior modules · capstone · certificate. Included in your plan.</p>
                    <Link href={`/courses/${advancedCourse.slug}`}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-white/90 transition-all">
                      Start Advanced
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </Link>
                  </div>
                )}
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

      {/* First-lesson walkthrough — the lesson player is where learners spend
          most of their time, and its two best features (grounded Nova actions
          per section, and quick checks that become flashcards) are easy to
          scroll straight past. Shown once, on whichever lesson they open first;
          steps whose target is not on this particular lesson are skipped. */}
      <ProductTour
        id="lesson-player"
        steps={[
          {
            title: "This is where the learning happens",
            body:
              "A lesson is short sections of theory broken up by quick checks. Read, answer, move on — it is designed to be done in one sitting of about half an hour.",
          },
          {
            target: "lesson-takeaway",
            title: "The point, before the detail",
            body:
              "Each section opens with the one thing it wants you to remember. If you read nothing else, read this — then the prose underneath explains why.",
          },
          {
            target: "lesson-nova",
            title: "Stuck on a section? Ask about that section",
            body:
              "These three buttons send Nova the section you are reading, so the answer is grounded in it rather than generic. Explain it simpler, get another example, or have Nova quiz you on it.",
          },
          {
            target: "lesson-quiz",
            title: "Quick checks are not busywork",
            body:
              "You must answer these to complete the lesson — and every one of them becomes a flashcard in your Study Hub, due tomorrow. Getting one wrong is useful: that is the card you will see most.",
          },
          {
            title: "Finish, and it schedules your revision",
            body:
              "Complete the lesson and the platform advances you to the next one and files your flashcards. Come back tomorrow and the review is already waiting.",
          },
        ]}
      />
    </div>
  );
}
