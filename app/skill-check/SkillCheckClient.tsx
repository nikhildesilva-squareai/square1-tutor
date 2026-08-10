"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  getDiagnostic,
  encodeAnswers,
  getSubject,
  DIAG_SUBJECTS,
  type DiagQuestion,
  type DiagSubject,
} from "@/lib/diagnostic";
import { fpIds, fpTrack } from "@/lib/first-party";

// ═══════════════════════════════════════════════════════════════════════════════
// The quiz-first skill check. Seven beats, one frame, zero interstitials:
//
//   1. Warm-up  — "spot the better prompt" (universal, no wrong-answer shame,
//                 demos the product: Nova scores prompts)
//   2. Track    — "what are you aiming for?" as chips INSIDE the quiz, not a
//                 landing page. Two lanes: career tracks / AI-at-work.
//   3–7.        — the chosen track's five questions (same bank the /diagnostic
//                 routes use, same seeded option order, same results URL).
//
// Deep links: ?w=done skips the warm-up (the hero's Prompt Lab already asked
// it); ?subject=<slug> skips the track step (course cards already know it).
// No email gate anywhere before the questions — capture happens at the report.
// ═══════════════════════════════════════════════════════════════════════════════

const BRAND = "#0056CE";
const TOTAL_STEPS = 7;

// Same content as the hero Prompt Lab — the one universal question that works
// for a future ML engineer AND a marketer.
const WARMUP = {
  scenario: "You need AI to draft a product launch email.",
  ask: "Which prompt gets a usable result?",
  options: [
    { key: "A", text: "write a launch email for our new product", score: 8, better: false },
    {
      key: "B",
      text:
        "You're our copywriter. Write a 120-word launch email for the Terra serum ($54, ships Aug 1). Audience: existing customers, warm tone, no wellness clichés. One CTA: “Pre-order”. No discounts.",
      score: 96,
      better: true,
    },
  ],
};

// The career lane keeps DIAG_SUBJECTS order; the work lane is the role tracks
// ("ai-for-*" plus Everyday AI Skills). NOT a bare "ai-" prefix test — that
// would drag ai-product-management (a career track) into the no-code lane.
const WORK_SLUGS = new Set(
  DIAG_SUBJECTS.filter((s) => s.slug.startsWith("ai-for-") || s.slug === "ai-foundations").map((s) => s.slug),
);
const CAREER_LANE = DIAG_SUBJECTS.filter((s) => !WORK_SLUGS.has(s.slug));
const WORK_LANE = DIAG_SUBJECTS.filter((s) => WORK_SLUGS.has(s.slug));

type Phase = "warmup" | "track" | "quiz";

function ProgressHeader({ step, accent }: { step: number; accent: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>
          Free skill check
        </span>
        <span className="tabular-nums text-xs text-slate-500">
          Question {step} / {TOTAL_STEPS}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%`, background: accent }}
        />
      </div>
    </div>
  );
}

export function SkillCheckClient() {
  const router = useRouter();
  const params = useSearchParams();

  const presetSlug = params.get("subject");
  const preset = presetSlug ? getSubject(presetSlug) : undefined;
  const skipWarmup = params.get("w") === "done";

  const [phase, setPhase] = useState<Phase>(skipWarmup ? (preset ? "quiz" : "track") : "warmup");
  const [subject, setSubject] = useState<DiagSubject | null>(preset ?? null);
  const [warmupPick, setWarmupPick] = useState<number | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const questions = useMemo<DiagQuestion[]>(
    () => (subject ? getDiagnostic(subject.slug) : []),
    [subject],
  );

  const accent = subject?.color ?? BRAND;
  // Display step: warm-up = 1, track = 2, quiz i = 3..7.
  const step = phase === "warmup" ? 1 : phase === "track" ? 2 : 3 + qIdx;

  const trackedStart = useRef(false);
  useEffect(() => {
    if (trackedStart.current) return;
    trackedStart.current = true;
    fpTrack("quiz_step", skipWarmup ? "entered:w-done" : "entered");
  }, [skipWarmup]);

  // Warm-up: reveal Nova's verdict briefly, then advance on its own.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  function answerWarmup(i: number) {
    if (warmupPick !== null) return;
    setWarmupPick(i);
    fpTrack("quiz_step", "warmup_answered");
    advanceTimer.current = setTimeout(() => {
      setPhase(subject ? "quiz" : "track");
      window.scrollTo({ top: 0 });
    }, 1500);
  }

  function pickTrack(s: DiagSubject) {
    setSubject(s);
    setPhase("quiz");
    fpTrack("quiz_step", `track:${s.slug}`);
    // The TRUE top of the per-subject quiz funnel — same event the /diagnostic
    // route fires, so started-vs-finished counts stay comparable across both
    // entrances.
    try {
      const { session_id } = fpIds();
      void fetch("/api/diagnostic/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "quiz_started", subject: s.slug, session_id }),
        keepalive: true,
      });
    } catch { /* analytics must never block the flow */ }
    window.scrollTo({ top: 0 });
  }

  function answerQuiz(optIdx: number) {
    if (picked !== null || !subject) return;
    setPicked(optIdx);
    fpTrack("quiz_step", `q${qIdx + 1}_answered`);
    setTimeout(() => {
      const next = [...answers, optIdx];
      setAnswers(next);
      setPicked(null);
      if (qIdx + 1 < questions.length) {
        setQIdx(qIdx + 1);
      } else {
        router.push(`/diagnostic/${subject.slug}/results?a=${encodeAnswers(next)}`);
      }
    }, 220);
  }

  const warmupDone = warmupPick !== null;
  const gotItRight = warmupPick === 1;

  return (
    <main
      className="flex min-h-dvh flex-col"
      style={{ background: "linear-gradient(180deg,#F8FAFC,#fff)" }}
    >
      {/* Minimal app bar — logo home, quiet sign-in. Nothing else competes. */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Square 1 AI home" className="inline-flex items-center">
          <Logo variant="dark" size="sm" />
        </Link>
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Sign in
        </Link>
      </header>

      <div className="flex-1 px-4 pb-14 pt-4 sm:px-6">
        {/* ── 1 · Warm-up ─────────────────────────────────────────────────── */}
        {phase === "warmup" && (
          <div key="warmup" className="mx-auto max-w-xl animate-fade-in-up">
            <ProgressHeader step={1} accent={accent} />

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ background: "#ECF8FE", color: BRAND }}
            >
              <Sparkles className="h-3 w-3" aria-hidden /> Warm-up · no wrong answers
            </span>

            <h1 className="mt-3 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              {WARMUP.scenario}{" "}
              <span className="text-slate-500">{WARMUP.ask}</span>
            </h1>

            <div className="mt-6 space-y-3">
              {WARMUP.options.map((opt, i) => {
                const isPick = warmupPick === i;
                const revealWin = warmupDone && opt.better;
                const revealWeak = warmupDone && !opt.better;
                return (
                  <button
                    key={opt.key}
                    onClick={() => answerWarmup(i)}
                    disabled={warmupDone}
                    className="w-full rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-px disabled:cursor-default"
                    style={{
                      borderColor: revealWin ? "#10B981" : revealWeak ? "#E2E8F0" : isPick ? BRAND : "rgba(15,28,49,0.10)",
                      background: revealWin ? "rgba(16,185,129,0.05)" : revealWeak ? "#F8FAFC" : "#fff",
                      opacity: revealWeak ? 0.7 : 1,
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide"
                        style={{ color: revealWin ? "#059669" : "#64748B" }}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-black"
                          style={{
                            borderColor: revealWin ? "#10B981" : isPick ? BRAND : "rgba(15,28,49,0.15)",
                            color: revealWin ? "#10B981" : isPick ? BRAND : "#64748B",
                          }}
                        >
                          {revealWin ? "✓" : opt.key}
                        </span>
                        Prompt {opt.key}
                      </span>
                      {warmupDone && (
                        <span
                          className="text-[13px] font-black tabular-nums motion-safe:animate-fade-in-up"
                          style={{ color: opt.better ? BRAND : "#94A3B8" }}
                        >
                          {opt.score}
                          <span className="text-[10px] text-slate-400">/100</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-600 sm:text-sm">{opt.text}</p>
                  </button>
                );
              })}
            </div>

            {warmupDone ? (
              <p className="mt-5 text-center text-sm font-semibold text-slate-800 motion-safe:animate-fade-in-up">
                {gotItRight ? "Nailed it — Nova scores that 96/100." : "Prompt B wins — 96 vs 8."}{" "}
                <span className="font-medium text-slate-500">Context, constraints, a clear goal. Next: your track…</span>
              </p>
            ) : (
              <p className="mt-5 text-center text-[11px] text-slate-500">
                Tap the one you&apos;d trust — this one&apos;s just a warm-up.
              </p>
            )}
          </div>
        )}

        {/* ── 2 · Track pick — a question, not a landing page ─────────────── */}
        {phase === "track" && (
          <div key="track" className="mx-auto max-w-xl animate-fade-in-up">
            <ProgressHeader step={2} accent={accent} />

            <h1 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              What are you aiming for?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Your next five questions come from this track — and so does your skill report.
            </p>

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Build a career in AI
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CAREER_LANE.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => pickTrack(s)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[rgba(15,28,49,0.10)] bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-px hover:border-[#0056CE]/50"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">{s.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{s.role}</span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                AI for your work — no code
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WORK_LANE.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => pickTrack(s)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[rgba(15,28,49,0.10)] bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-px hover:border-[#0056CE]/50"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">{s.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{s.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-500">
              Not sure? Pick the closest — you can take any other track&apos;s check later, free.
            </p>
          </div>
        )}

        {/* ── 3–7 · The track's five questions ────────────────────────────── */}
        {phase === "quiz" && subject && questions.length > 0 && (
          <div key={`q${qIdx}`} className="mx-auto max-w-xl animate-fade-in-up">
            <ProgressHeader step={3 + qIdx} accent={accent} />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>
                {subject.title}
              </span>
              {qIdx === 0 && (
                <button
                  onClick={() => { setPhase("track"); setQIdx(0); setAnswers([]); }}
                  className="text-[11px] font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-600"
                >
                  change track
                </button>
              )}
            </div>

            <h2 className="mb-6 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              {questions[qIdx]?.stem}
            </h2>

            <div className="space-y-3">
              {questions[qIdx]?.options.map((opt, i) => {
                const isPicked = picked === i;
                return (
                  <button
                    key={i}
                    onClick={() => answerQuiz(i)}
                    disabled={picked !== null}
                    className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all hover:-translate-y-px disabled:cursor-default"
                    style={{
                      borderColor: isPicked ? accent : "rgba(15,28,49,0.10)",
                      background: isPicked ? `${accent}10` : "#fff",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                      style={{
                        borderColor: isPicked ? accent : "rgba(15,28,49,0.15)",
                        color: isPicked ? accent : "#64748B",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium text-slate-800 sm:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-500">
              No wrong-answer shame — this is just to find your starting point.
            </p>

            {qIdx === questions.length - 1 && (
              <p className="mt-2 text-center text-[11px] font-semibold" style={{ color: accent }}>
                Last one — your report is next <ArrowRight className="inline h-3 w-3" aria-hidden />
              </p>
            )}
          </div>
        )}
      </div>

      <p className="pb-6 text-center text-[11px] text-slate-400">
        Free · no account · your report appears the moment you finish
      </p>

      {/* Decorative brand wash, consistent with the hero */}
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(ellipse, #0056CE 0%, transparent 70%)", filter: "blur(90px)" }}
      />
    </main>
  );
}
