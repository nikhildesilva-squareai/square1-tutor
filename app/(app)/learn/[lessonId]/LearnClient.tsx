"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

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

interface ModuleData { id: string; title: string; order_index: number; course_id: string }
interface CourseData { id: string; slug: string; title: string; total_lessons: number }

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

// ─── Animation styles ──────────────────────────────────────────────────────

const STYLES = `
@keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes scaleIn  { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
@keyframes slideTab { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
@keyframes copiedPop { 0% { transform:scale(0.8); opacity:0 } 50% { transform:scale(1.1) } 100% { transform:scale(1); opacity:1 } }
.anim-fade-up  { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both }
.anim-fade-in  { animation: fadeIn 0.3s ease both }
.anim-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both }
.anim-slide-tab { animation: slideTab 0.35s cubic-bezier(0.16,1,0.3,1) both }
.anim-copied   { animation: copiedPop 0.3s ease both }
`;

// ─── Copy button for code blocks ───────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        "absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
        copied
          ? "bg-emerald-500/20 text-emerald-400 anim-copied"
          : "bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white"
      )}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ─── Rich markdown renderer with styled blocks ─────────────────────────────

function renderTheory(md: string): string {
  if (!md) return "";

  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

    // Code blocks → themed editor style
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
      const language = lang ?? "text";
      const id = "cb_" + Math.random().toString(36).slice(2, 8);
      return `<div class="code-block-wrapper relative rounded-xl overflow-hidden my-5 border border-white/10 shadow-lg" data-code-id="${id}">
        <div class="flex items-center gap-2 px-4 py-2.5" style="background:#161B22">
          <div class="flex gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">${language}</span>
        </div>
        <pre class="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono" style="background:#0D1117;color:#E6EDF3"><code>${code.trim()}</code></pre>
      </div>`;
    })

    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')

    // Headers → section cards
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-ink mt-6 mb-2 flex items-center gap-2"><span class="w-1 h-5 rounded-full bg-brand/30 inline-block"></span>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-ink mt-8 mb-3 flex items-center gap-2"><span class="w-1.5 h-6 rounded-full bg-brand inline-block"></span>$1</h3>')
    .replace(/^## (.+)$/gm, '<div class="mt-10 mb-4 first:mt-0"><h2 class="text-xl font-black text-ink flex items-center gap-3"><span class="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-sm font-black shrink-0">#</span>$1</h2></div>')

    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong class=\"text-ink\">$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")

    // Blockquotes → tip cards
    .replace(/^&gt; (.+)$/gm, `<div class="flex gap-3 my-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
      <span class="text-lg shrink-0">💡</span>
      <p class="text-sm text-amber-800 leading-relaxed">$1</p>
    </div>`)

    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2.5 text-sm text-ink-secondary leading-relaxed py-0.5"><span class="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0"></span><span>$1</span></li>')

    // Ordered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex items-start gap-2.5 text-sm text-ink-secondary leading-relaxed py-0.5"><span class="w-5 h-5 rounded-full bg-surface-tint text-brand text-[10px] font-bold flex items-center justify-center mt-0.5 shrink-0">$1</span><span>$2</span></li>')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline font-medium" target="_blank" rel="noopener">$1</a>')

    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-sm text-ink-secondary leading-relaxed mb-3">')
    .replace(/\n/g, "<br />");

  html = `<p class="text-sm text-ink-secondary leading-relaxed mb-3">${html}</p>`;
  html = html.replace(/<p class="text-sm text-ink-secondary leading-relaxed mb-3"><\/p>/g, "");

  // Wrap consecutive list items
  html = html.replace(/(<li class="flex items-start gap-2.5[\s\S]*?<\/li>(\s*<br \/>)?)+/g, (match) => {
    const cleaned = match.replace(/<br \/>/g, "");
    return `<ul class="my-3 space-y-0.5">${cleaned}</ul>`;
  });

  return html;
}

// ─── Tab button ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: string; label: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all rounded-xl",
        active
          ? "bg-brand text-white shadow-md shadow-brand/20"
          : "text-ink-muted hover:text-ink hover:bg-surface-alt"
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          active ? "bg-white/20 text-white" : "bg-surface-alt text-ink-muted"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Progress ring ─────────────────────────────────────────────────────────

function LessonProgressRing({ position, total, size = 40 }: { position: number; total: number; size?: number }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? position / total : 0;
  const offset = circ * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0056CE" strokeWidth="2.5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ink tabular-nums">
        {position}/{total}
      </span>
    </div>
  );
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

  type Tab = "theory" | "practice" | "quiz";
  const [activeTab, setActiveTab] = useState<Tab>("theory");
  const [tabKey, setTabKey] = useState(0);

  // Exercise state
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }>>(() => {
    const init: Record<string, { selectedOption?: string; responseText?: string; codeResponse?: string }> = {};
    exercises.forEach((ex) => {
      init[ex.id] = { selectedOption: undefined, responseText: "", codeResponse: ex.starter_code ?? "" };
    });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ExerciseResult[] | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [error, setError] = useState<string | null>(null);

  // Code block copy buttons — attach after render
  const theoryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!theoryRef.current) return;
    theoryRef.current.querySelectorAll(".code-block-wrapper").forEach((wrapper) => {
      if (wrapper.querySelector(".copy-btn-attached")) return;
      const pre = wrapper.querySelector("pre code");
      if (!pre) return;
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      btn.className = "copy-btn-attached absolute top-10 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white transition-all cursor-pointer";
      btn.onclick = () => {
        navigator.clipboard.writeText(pre.textContent ?? "");
        btn.textContent = "✓ Copied";
        btn.classList.add("bg-emerald-500/20", "text-emerald-400");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("bg-emerald-500/20", "text-emerald-400");
        }, 2000);
      };
      (wrapper as HTMLElement).style.position = "relative";
      wrapper.appendChild(btn);
    });
  }, [activeTab, lesson.theory_md]);

  // Inject styles
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setTabKey(k => k + 1);
  }

  // ── Submit exercises ──────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          exercises: exercises.map((ex) => ({
            exerciseId: ex.id, type: ex.type,
            selectedOption: responses[ex.id]?.selectedOption,
            responseText: responses[ex.id]?.responseText,
            codeResponse: responses[ex.id]?.codeResponse,
          })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to submit"); }
      const data = await res.json();
      setResults(data.results);
      switchTab("quiz"); // Auto-switch to results tab
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Mark complete ──────────────────────────────────────────
  async function handleComplete() {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to mark complete"); }
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCompleting(false);
    }
  }

  const currentEx = exercises[currentExIdx] ?? null;
  const totalScore = results?.reduce((s, r) => s + r.score, 0) ?? 0;
  const maxScore = results?.reduce((s, r) => s + r.maxScore, 0) ?? 0;

  return (
    <div className="min-h-full bg-surface-soft">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Top row */}
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={course ? `/courses/${course.slug}` : "/courses"}
              className="text-ink-muted hover:text-brand transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-ink-muted uppercase tracking-widest font-semibold">
                {module ? `Module ${module.order_index + 1}` : "Module"} &middot; Lesson {lessonPosition} of {totalLessonsInModule}
              </p>
              <h1 className="text-lg font-bold text-ink truncate">{lesson.title}</h1>
            </div>
            <LessonProgressRing position={lessonPosition} total={totalLessonsInModule} />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 bg-surface-soft rounded-2xl p-1.5">
            <TabButton active={activeTab === "theory"} onClick={() => switchTab("theory")} icon="📖" label="Theory" />
            <TabButton active={activeTab === "practice"} onClick={() => switchTab("practice")} icon="⚡" label="Practice" badge={String(exercises.length)} />
            <TabButton active={activeTab === "quiz"} onClick={() => switchTab("quiz")} icon="✅" label="Results"
              badge={results ? `${totalScore}/${maxScore}` : undefined} />
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div key={tabKey} className="max-w-4xl mx-auto px-4 sm:px-6 py-8 anim-slide-tab">

        {/* ═══ THEORY TAB ═══ */}
        {activeTab === "theory" && (
          <div>
            {/* Learning objectives */}
            {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
              <div className="mb-8 p-5 rounded-2xl bg-surface border border-border shadow-card anim-fade-up">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>🎯</span> Learning Objectives
                </p>
                <div className="space-y-2">
                  {lesson.learning_objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                      <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center mt-0.5 shrink-0">{i + 1}</span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Theory content */}
            {lesson.theory_md ? (
              <div
                ref={theoryRef}
                className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8 anim-fade-up"
                dangerouslySetInnerHTML={{ __html: renderTheory(lesson.theory_md) }}
              />
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-10 text-center anim-fade-up">
                <span className="text-4xl mb-4 block">📚</span>
                <p className="text-sm text-ink-muted">Lesson content is being prepared. Check back soon!</p>
              </div>
            )}

            {/* Continue to practice CTA */}
            {exercises.length > 0 && (
              <div className="mt-8 text-center anim-fade-up">
                <button
                  onClick={() => switchTab("practice")}
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5"
                >
                  <span>⚡</span> Start Practice
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ PRACTICE TAB — Flashcard-style exercises ═══ */}
        {activeTab === "practice" && exercises.length > 0 && currentEx && (
          <div>
            {/* Exercise header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-sm font-black">
                  {currentExIdx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{currentEx.title}</p>
                  <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
                    {currentEx.type === "mcq" ? "Quick Check" : currentEx.type === "code" ? "Build It" : "Explain"} &middot; {currentEx.marks} marks
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                currentEx.type === "mcq" ? "bg-blue-50 text-blue-600 border-blue-200"
                  : currentEx.type === "code" ? "bg-purple-50 text-purple-600 border-purple-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              )}>
                {currentEx.type === "mcq" ? "MCQ" : currentEx.type === "code" ? "Code" : "Written"}
              </span>
            </div>

            {/* Exercise card */}
            <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8 anim-scale-in">
              {/* Question */}
              <p className="text-base font-medium text-ink leading-relaxed mb-6">{currentEx.prompt_md}</p>

              {/* MCQ */}
              {currentEx.type === "mcq" && currentEx.options && (
                <div className="grid gap-3">
                  {currentEx.options.map((opt, oi) => {
                    const sel = responses[currentEx.id]?.selectedOption === opt;
                    const resultForThis = results?.find(r => r.exerciseId === currentEx.id);
                    const isCorrect = resultForThis && currentEx.correct_answer === opt;
                    const isWrong = resultForThis && sel && !resultForThis.correct;
                    return (
                      <button
                        key={oi}
                        onClick={() => { if (results) return; setResponses(p => ({...p, [currentEx.id]: {...p[currentEx.id], selectedOption: opt}})); }}
                        disabled={!!results}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4",
                          isCorrect ? "border-emerald-400 bg-emerald-50" :
                          isWrong ? "border-red-400 bg-red-50" :
                          sel ? "border-brand bg-surface-tint hover:shadow-md" :
                          "border-border bg-surface hover:border-brand/30 hover:scale-[1.01]"
                        )}
                      >
                        <span className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                          isCorrect ? "bg-emerald-500 text-white" :
                          isWrong ? "bg-red-500 text-white" :
                          sel ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                        )}>
                          {isCorrect ? "✓" : isWrong ? "✗" : String.fromCharCode(65 + oi)}
                        </span>
                        <span className={cn("text-sm", sel ? "font-medium text-ink" : "text-ink-secondary")}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short answer */}
              {currentEx.type === "short_answer" && (
                <div className={cn("rounded-xl border-2 overflow-hidden transition-all", "focus-within:border-brand border-border")}>
                  <textarea
                    value={responses[currentEx.id]?.responseText ?? ""}
                    onChange={(e) => {
                      if (results) return;
                      setResponses(p => ({...p, [currentEx.id]: {...p[currentEx.id], responseText: e.target.value}}));
                    }}
                    disabled={!!results}
                    placeholder="Write your answer..."
                    rows={5}
                    className="w-full px-5 py-4 bg-transparent text-ink text-sm leading-relaxed placeholder:text-ink-muted/50 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Code */}
              {currentEx.type === "code" && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1117] border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">{currentEx.language ?? "python"}</span>
                  </div>
                  <CodeEditor
                    value={responses[currentEx.id]?.codeResponse ?? ""}
                    onChange={(val) => {
                      if (results) return;
                      setResponses(p => ({...p, [currentEx.id]: {...p[currentEx.id], codeResponse: val}}));
                    }}
                    language={(currentEx.language as "python" | "typescript" | "javascript") ?? "python"}
                    placeholder="Write your code..."
                    readOnly={!!results}
                    minHeight="220px"
                  />
                </div>
              )}

              {/* Result feedback */}
              {results && (() => {
                const r = results.find(r => r.exerciseId === currentEx.id);
                if (!r) return null;
                return (
                  <div className={cn(
                    "mt-6 px-5 py-4 rounded-xl border text-sm anim-fade-up",
                    r.correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  )}>
                    <p className={cn("font-bold mb-1", r.correct ? "text-emerald-700" : "text-red-700")}>
                      {r.correct ? "✓ Correct" : "✗ Needs work"} &middot; {r.score}/{r.maxScore} marks
                    </p>
                    <p className="text-ink-secondary">{r.feedback}</p>
                  </div>
                );
              })()}
            </div>

            {/* Exercise navigator dots + nav buttons */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentExIdx(i => Math.max(0, i - 1))}
                disabled={currentExIdx === 0}
                className="h-10 px-4 rounded-xl border border-border text-ink-secondary text-sm font-semibold hover:bg-surface-alt disabled:opacity-30 transition-all"
              >
                ← Prev
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {exercises.map((_, i) => (
                  <button key={i} onClick={() => setCurrentExIdx(i)}
                    className={cn(
                      "transition-all rounded-full",
                      i === currentExIdx ? "w-6 h-2.5 bg-brand" : "w-2.5 h-2.5 bg-border hover:bg-ink-muted"
                    )} />
                ))}
              </div>

              {currentExIdx === exercises.length - 1 && !results ? (
                <Button onClick={handleSubmit} loading={submitting} disabled={submitting} className="h-10 px-6 rounded-xl text-sm">
                  Submit All →
                </Button>
              ) : (
                <button
                  onClick={() => setCurrentExIdx(i => Math.min(exercises.length - 1, i + 1))}
                  disabled={currentExIdx === exercises.length - 1}
                  className="h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-30 transition-all"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "practice" && exercises.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center anim-fade-up">
            <span className="text-4xl mb-4 block">✨</span>
            <p className="text-sm text-ink-muted">No exercises for this lesson. Read the theory and mark complete!</p>
          </div>
        )}

        {/* ═══ QUIZ/RESULTS TAB ═══ */}
        {activeTab === "quiz" && (
          <div className="anim-fade-up">
            {results ? (
              <div className="space-y-6">
                {/* Score card */}
                <div className="bg-surface rounded-2xl border border-border shadow-card p-8 text-center">
                  <div className={cn(
                    "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black",
                    totalScore / Math.max(1, maxScore) >= 0.7
                      ? "bg-emerald-100 text-emerald-600"
                      : totalScore / Math.max(1, maxScore) >= 0.4
                      ? "bg-amber-100 text-amber-600"
                      : "bg-red-100 text-red-600"
                  )}>
                    {Math.round((totalScore / Math.max(1, maxScore)) * 100)}%
                  </div>
                  <p className="text-xl font-bold text-ink mb-1">{totalScore}/{maxScore} marks</p>
                  <p className="text-sm text-ink-muted">
                    {totalScore / Math.max(1, maxScore) >= 0.7 ? "Great work! You've got a solid understanding." :
                     totalScore / Math.max(1, maxScore) >= 0.4 ? "Good effort! Review the theory for the ones you missed." :
                     "Keep going! Re-read the theory and try again."}
                  </p>
                </div>

                {/* Per-exercise breakdown */}
                <div className="space-y-3">
                  {exercises.map((ex, i) => {
                    const r = results.find(r => r.exerciseId === ex.id);
                    if (!r) return null;
                    return (
                      <div key={ex.id} className={cn(
                        "flex items-center gap-4 px-5 py-4 rounded-xl border bg-surface",
                        r.correct ? "border-emerald-200" : "border-red-200"
                      )}>
                        <span className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold",
                          r.correct ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {r.correct ? "✓" : "✗"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{ex.title}</p>
                          <p className="text-[10px] text-ink-muted">{r.feedback.slice(0, 80)}{r.feedback.length > 80 ? "..." : ""}</p>
                        </div>
                        <span className="text-sm font-bold text-ink tabular-nums">{r.score}/{r.maxScore}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-10 text-center">
                <span className="text-4xl mb-4 block">📊</span>
                <p className="text-sm text-ink-muted mb-4">Complete the practice exercises to see your results here.</p>
                <button
                  onClick={() => switchTab("practice")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all"
                >
                  <span>⚡</span> Go to Practice
                </button>
              </div>
            )}

            {/* Completion actions */}
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              {!completed && (
                <Button onClick={handleComplete} loading={completing} disabled={completing} size="lg" className="rounded-xl">
                  ✓ Mark Lesson Complete
                </Button>
              )}
              {completed && (
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  Lesson completed
                </span>
              )}
              {nextLessonId && (
                <button
                  onClick={() => router.push(`/learn/${nextLessonId}`)}
                  className="h-12 px-6 rounded-xl border border-border bg-surface text-ink font-semibold text-sm hover:bg-surface-alt transition-all flex items-center gap-2"
                >
                  Next Lesson →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-medium shadow-lg z-50 anim-fade-up">
          {error}
        </div>
      )}
    </div>
  );
}
