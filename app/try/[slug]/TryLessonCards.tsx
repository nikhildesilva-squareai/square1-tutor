"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RichContent } from "@/components/ui/rich-content";

// ═══════════════════════════════════════════════════════════════════════════
// /try card player — the free lesson as the PRODUCT, not an article.
//
// The old page was a wall of reading: it held visitors for ~24s while the
// real in-app lesson player holds them for ~123s. This mirrors the player's
// card rhythm for anonymous visitors: read a short section → tap a real quick
// check → get instant feedback → hit the signup gate AFTER the first win,
// with the rest of the lesson visibly locked behind it.
// ═══════════════════════════════════════════════════════════════════════════

interface TryMcq {
  id: string;
  prompt: string;
  options: string[];
  correct: string; // exact option text (same contract as the in-app player)
}

interface Props {
  slug: string;
  courseTitle: string;
  icon: string;
  color: string;
  totalLessons: number;
  lessonTitle: string;
  minutes: number | null;
  objectives: string[];
  theory: string;
  mcqs: TryMcq[];
}

type Card =
  | { type: "objectives" }
  | { type: "section"; title: string; body: string }
  | { type: "quiz"; mcq: TryMcq }
  | { type: "gate" };

// How much of the lesson is free on this page: enough for a real first win,
// short enough that the gate arrives while momentum is high.
const FREE_SECTIONS = 3;

function splitSections(theory: string): { title: string; body: string }[] {
  const parts = theory.split(/\r?\n(?=##\s)/);
  const out: { title: string; body: string }[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^##\s*(.+?)(?:\r?\n([\s\S]*))?$/);
    if (m) out.push({ title: m[1].replace(/^#+\s*/, "").trim(), body: (m[2] ?? "").trim() });
    else out.push({ title: "Overview", body: trimmed });
  }
  return out;
}

export function TryLessonCards({ slug, courseTitle, icon, color, totalLessons, lessonTitle, minutes, objectives, theory, mcqs }: Props) {
  const sections = useMemo(() => splitSections(theory), [theory]);

  const { cards, lockedTitles } = useMemo(() => {
    const free = sections.slice(0, FREE_SECTIONS);
    const locked = sections.slice(FREE_SECTIONS).map((s) => s.title);
    const list: Card[] = [];
    if (objectives.length > 0) list.push({ type: "objectives" });
    free.forEach((s, i) => {
      list.push({ type: "section", title: s.title, body: s.body });
      // A quick check after sections 2 and 3 — read a little, prove a little.
      const quizIdx = i - 1;
      if (i >= 1 && mcqs[quizIdx]) list.push({ type: "quiz", mcq: mcqs[quizIdx] });
    });
    list.push({ type: "gate" });
    return { cards: list, lockedTitles: locked };
  }, [sections, objectives.length, mcqs]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const card = cards[idx];
  const isLast = idx >= cards.length - 1;
  const signupHref = `/signup?subject=${slug}`;

  function next() {
    if (!isLast) {
      setIdx(idx + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const quizAnswered = card?.type === "quiz" ? picked[card.mcq.id] !== undefined : true;

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
      {/* Course + progress header */}
      <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color }}>
        <span className="text-lg">{icon}</span> {courseTitle}
        <span className="ml-auto text-[11px] font-bold text-slate-400 tabular-nums">
          {Math.min(idx + 1, cards.length)} / {cards.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-6">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((idx + 1) / cards.length) * 100}%`, background: color }} />
      </div>

      <div key={idx} className="motion-safe:animate-fade-in-up">
        {card?.type === "objectives" && (
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold mb-5"
              style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}>
              FREE PREVIEW · LESSON 1 OF {totalLessons} · NO SIGNUP
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">{lessonTitle}</h1>
            {minutes && <p className="text-sm text-slate-500 mb-6">~{minutes} min in the full course · this preview: ~5 min</p>}
            <div className="rounded-2xl border p-5" style={{ borderColor: `${color}25`, background: `${color}08` }}>
              <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-3">What you&apos;ll learn</p>
              <ul className="space-y-2">
                {objectives.map((o, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="font-black tabular-nums" style={{ color }}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {card?.type === "section" && (
          <article>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-4">{card.title}</h2>
            <RichContent content={card.body} />
          </article>
        )}

        {card?.type === "quiz" && (
          <div>
            <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-2">Quick check</p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-5">{card.mcq.prompt.replace(/\*\*\*(.+?)\*\*\*/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1")}</h2>
            <div className="space-y-2.5">
              {card.mcq.options.map((opt, i) => {
                const chosen = picked[card.mcq.id];
                const isChosen = chosen === opt;
                const isCorrect = opt === card.mcq.correct;
                const reveal = chosen !== undefined;
                return (
                  <button
                    key={i}
                    disabled={reveal}
                    onClick={() => setPicked((p) => ({ ...p, [card.mcq.id]: opt }))}
                    className="w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm sm:text-base font-medium transition-all disabled:cursor-default motion-safe:hover:-translate-y-px"
                    style={{
                      borderColor: reveal && isCorrect ? "#10B981" : isChosen ? "#EF4444" : "rgba(15,28,49,0.10)",
                      background: reveal && isCorrect ? "rgba(16,185,129,0.06)" : isChosen ? "rgba(239,68,68,0.05)" : "#fff",
                      color: "#1E293B",
                      opacity: reveal && !isCorrect && !isChosen ? 0.6 : 1,
                    }}
                  >
                    {opt}
                    {reveal && isCorrect && <span className="ml-2 font-bold text-emerald-600">✓</span>}
                    {reveal && isChosen && !isCorrect && <span className="ml-2 font-bold text-red-500">✗</span>}
                  </button>
                );
              })}
            </div>
            {quizAnswered && (
              <p className="mt-4 text-sm font-semibold motion-safe:animate-fade-in-up"
                style={{ color: picked[card.mcq.id] === card.mcq.correct ? "#059669" : "#B45309" }}>
                {picked[card.mcq.id] === card.mcq.correct
                  ? "Correct — that's exactly how it works in the full course: read, then prove it."
                  : `Not quite — the answer is "${card.mcq.correct}". In the full course, Nova explains why in one tap.`}
              </p>
            )}
          </div>
        )}

        {card?.type === "gate" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl mb-5">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">That was your first win.</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              You just did what most people never do — learned something and proved it, in about five minutes.
              The rest of this lesson (and {totalLessons - 1} more, with Nova grading everything you do) is one free account away.
            </p>
            {lockedTitles.length > 0 && (
              <div className="max-w-sm mx-auto text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-6">
                <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-2.5">Still in this lesson</p>
                <ul className="space-y-1.5">
                  {lockedTitles.slice(0, 4).map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                      {t}
                    </li>
                  ))}
                  {lockedTitles.length > 4 && <li className="text-xs text-slate-400 pl-5">+ {lockedTitles.length - 4} more</li>}
                </ul>
              </div>
            )}
            <Link
              href={signupHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-[15px] hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)", boxShadow: "0 12px 32px rgba(0,86,206,0.35)" }}
            >
              Continue free — Google or email →
            </Link>
            <p className="text-[11px] text-slate-500 mt-3">Free · no card · you land right back in this lesson</p>
            <Link href="/diagnostic" className="block text-xs text-slate-400 hover:text-slate-700 transition-colors mt-6">
              ← Explore other tracks
            </Link>
          </div>
        )}
      </div>

      {/* Footer nav */}
      {card?.type !== "gate" && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={next}
            disabled={!quizAnswered}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 motion-safe:hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}
          >
            Continue →
          </button>
        </div>
      )}
    </main>
  );
}
