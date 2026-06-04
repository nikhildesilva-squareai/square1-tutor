"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string; attemptId: string }>;
}

interface TopicMastery {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  questionCount?: number;
}

interface QuestionResult {
  id: string;
  number: number;
  stem: string;
  type: string;
  topicTag: string;
  marksAwarded: number;
  marksTotal: number;
  feedback: string | null;
  correct: boolean;
  correctAnswer: string | null;
  studentAnswer: string | null;
  improvedCode: string | null;
  breakdown: Array<{ criterion: string; awarded: number; reasoning: string }> | null;
  topicUnderstanding: string | null;
}

interface ReportData {
  reportId: string;
  level: "beginner" | "intermediate" | "advanced";
  score: number;
  maxScore: number;
  percentage: number;
  mcqScore?: number;
  mcqMax?: number;
  shortScore?: number;
  shortMax?: number;
  codeScore?: number;
  codeMax?: number;
  topicMastery: TopicMastery[];
  recommendationsMd: string;
  questionResults: QuestionResult[];
}

/* ── Grading step indicator ────────────────────────────────────────────── */
const GRADING_STEPS = [
  { label: "Reading your answers...", duration: 1000 },
  { label: "Grading MCQ questions...", duration: 1000 },
  { label: "AI reviewing your short answers...", duration: 2000 },
  { label: "AI analysing your code...", duration: 2000 },
  { label: "Building your skill map...", duration: 1000 },
  { label: "Generating recommendations...", duration: 1000 },
];

/* ── Animated count-up hook ────────────────────────────────────────────── */
function useCountUp(target: number, duration: number = 1500, enabled: boolean = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return value;
}

/* ── Radar chart (SVG) ─────────────────────────────────────────────────── */
function RadarChart({ topics, animate }: { topics: TopicMastery[]; animate: boolean }) {
  const N = topics.length;
  const CX = 200;
  const CY = 200;
  const R = 130;
  const [progress, setProgress] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!animate) return;
    const start = Date.now();
    const duration = 1500;
    const step = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [animate]);

  function point(i: number, r: number): [number, number] {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
  }
  function toPoints(pairs: [number, number][]): string {
    return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  }

  const rings = [0.25, 0.5, 0.75, 1.0];
  const labelRadius = R + 30;
  const dataPoints: [number, number][] = topics.map((t, i) => {
    const r = (t.percentage / 100) * R * progress;
    return point(i, r);
  });

  return (
    <svg viewBox="0 0 400 400" width="100%" height="auto" className="w-full max-w-sm mx-auto">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={toPoints(topics.map((_, i) => point(i, ring * R)))}
          fill="none"
          stroke="#E8EEF5"
          strokeWidth="1"
          strokeDasharray={ring < 1 ? "4 3" : "none"}
        />
      ))}
      {topics.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#E8EEF5" strokeWidth="1" />;
      })}
      <defs>
        <radialGradient id="radarFillReport" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0056CE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0056CE" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <polygon
        points={toPoints(dataPoints)}
        fill="url(#radarFillReport)"
        stroke="#0056CE"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {dataPoints.map(([x, y], i) => {
        const isHover = hoverIdx === i;
        return (
          <circle
            key={i}
            cx={x} cy={y}
            r={progress > 0.05 ? (isHover ? 7 : 4.5) : 0}
            fill={isHover ? "#0056CE" : "white"}
            stroke="#0056CE"
            strokeWidth={isHover ? 3 : 1.5}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ transition: "r 0.2s ease", cursor: "pointer" }}
          />
        );
      })}
      {topics.map((t, i) => {
        const [lx, ly] = point(i, labelRadius);
        const anchor = lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
        const isHover = hoverIdx === i;
        return (
          <text
            key={i}
            x={lx} y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            fill={isHover ? "#0056CE" : "#475569"}
            fontWeight={isHover ? 700 : 500}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ transition: "fill 0.2s", cursor: "pointer" }}
          >
            {t.topic}
          </text>
        );
      })}
      <circle cx={CX} cy={CY} r={3} fill="#0056CE" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function ReportPage({ params }: PageProps) {
  const { slug, attemptId } = use(params);

  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  /* ── Grading + step animation ────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function grade() {
      // Animate steps progressively
      for (let i = 0; i < GRADING_STEPS.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, GRADING_STEPS[i].duration));
        if (cancelled) return;
        setCompletedSteps(i + 1);
      }
    }

    async function fetchGrade() {
      try {
        const res = await fetch(`/api/grade/${attemptId}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Grading failed");
        setCompletedSteps(GRADING_STEPS.length);
        // Small delay to show the final step completing
        await new Promise((r) => setTimeout(r, 500));
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Grading failed");
      }
    }

    grade();
    fetchGrade();

    return () => { cancelled = true; };
  }, [attemptId]);

  // Score count-up
  const displayScore = useCountUp(report?.percentage ?? 0, 2000, !!report);

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  ERROR STATE                                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-error-bg flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D93636" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Grading failed</h2>
          <p className="text-sm text-error mb-6">{error}</p>
          <Link href={`/courses/${slug}`}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-surface border border-border text-ink-secondary text-sm font-semibold hover:bg-surface-alt transition-colors">
            Back to course
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  LOADING / GRADING STATE                                           */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (!report) {
    const totalDuration = GRADING_STEPS.reduce((a, s) => a + s.duration, 0);
    const completedDuration = GRADING_STEPS.slice(0, completedSteps).reduce((a, s) => a + s.duration, 0);
    const progressPct = (completedDuration / totalDuration) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="relative max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink">Analysing your answers...</h2>
            <p className="text-sm text-ink-muted mt-1">This usually takes 15-30 seconds.</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-alt rounded-full h-1.5 mb-6">
            <div className="h-1.5 rounded-full bg-brand transition-all duration-700"
              style={{ width: `${progressPct}%` }} />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {GRADING_STEPS.map((step, i) => {
              const done = i < completedSteps;
              const active = i === completedSteps;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs transition-all",
                    done ? "bg-success text-white" :
                    active ? "bg-surface-tint border-2 border-brand animate-pulse" :
                    "bg-surface-alt"
                  )}>
                    {done && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={cn("text-sm transition-colors", done ? "text-ink" : "text-ink-muted")}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  THE REPORT                                                        */
  /* ═══════════════════════════════════════════════════════════════════ */
  const sortedTopics = [...report.topicMastery].sort((a, b) => a.percentage - b.percentage);
  const strengths = [...report.topicMastery].sort((a, b) => b.percentage - a.percentage).slice(0, 3);
  const gaps = sortedTopics.slice(0, 3);

  const levelConfig = {
    beginner: { label: "BEGINNER", bg: "bg-error-bg", text: "text-error", border: "border-error/30" },
    intermediate: { label: "INTERMEDIATE", bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
    advanced: { label: "ADVANCED", bg: "bg-success-bg", text: "text-success", border: "border-success/30" },
  };
  const lc = levelConfig[report.level];

  return (
    <div ref={reportRef}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 1 — SCORE                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Pill eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
              Your Skill Report
            </span>
          </div>

          <p className="text-ink-muted text-sm uppercase tracking-wider mb-4">Your Score</p>

          {/* Big animated score */}
          <div className="mb-4">
            <span className="text-7xl sm:text-8xl font-black tabular-nums text-ink animate-score-pop">
              {displayScore}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-ink-muted ml-2">/ 100</span>
          </div>

          {/* Level badge */}
          <div className={cn("inline-flex items-center px-5 py-2 rounded-full border text-sm font-bold tracking-wider", lc.bg, lc.text, lc.border)}>
            {lc.label}
          </div>

          {/* Score breakdown by type */}
          <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {report.mcqMax != null && report.mcqMax > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-ink tabular-nums">{report.mcqScore ?? 0}/{report.mcqMax}</p>
                <p className="text-xs text-ink-muted mt-0.5">MCQ</p>
              </div>
            )}
            {report.shortMax != null && report.shortMax > 0 && (
              <>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink tabular-nums">{report.shortScore ?? 0}/{report.shortMax}</p>
                  <p className="text-xs text-ink-muted mt-0.5">Short Answer</p>
                </div>
              </>
            )}
            {report.codeMax != null && report.codeMax > 0 && (
              <>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink tabular-nums">{report.codeScore ?? 0}/{report.codeMax}</p>
                  <p className="text-xs text-ink-muted mt-0.5">Code</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 2 — TOPIC MASTERY                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.topicMastery.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-4">
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
                  Topic Mastery
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink">
                Where you stand
              </h2>
            </div>

            <div className="space-y-4">
              {sortedTopics.map((t) => {
                const color = t.percentage >= 70 ? "#19A65F" : t.percentage >= 40 ? "#E5B217" : "#D93636";
                const bgColor = t.percentage >= 70 ? "rgba(25,166,95,0.1)" : t.percentage >= 40 ? "rgba(229,178,23,0.1)" : "rgba(217,54,54,0.1)";
                return (
                  <div key={t.topic} className="rounded-xl border border-border bg-surface p-4 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{t.topic}</span>
                        {t.questionCount != null && (
                          <span className="text-[10px] text-ink-muted">{t.questionCount} question{t.questionCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{t.percentage}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: bgColor }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${t.percentage}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 3 — RADAR CHART                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.topicMastery.length >= 3 && (
        <section className="pb-16 sm:pb-20 px-4 sm:px-6">
          <div className="max-w-lg mx-auto rounded-2xl border border-border p-6 sm:p-8 bg-surface shadow-card">
            <h3 className="text-center text-sm font-semibold text-ink-secondary mb-4">Skill Radar</h3>
            <RadarChart topics={report.topicMastery} animate={true} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 4 — STRENGTHS & GAPS                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="rounded-2xl border border-success/20 bg-success-bg/30 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-success uppercase tracking-wider">Strengths</h3>
            </div>
            <div className="space-y-4">
              {strengths.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-ink">{t.topic}</span>
                    <span className="text-xs font-bold text-success">{t.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps */}
          <div className="rounded-2xl border border-error/20 bg-error-bg/30 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-error-bg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D93636" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-error uppercase tracking-wider">Gaps to Close</h3>
            </div>
            <div className="space-y-4">
              {gaps.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-ink">{t.topic}</span>
                    <span className="text-xs font-bold text-error">{t.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 5 — QUESTION BREAKDOWN                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-4">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
                Question Breakdown
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              Every question reviewed
            </h2>
          </div>

          <div className="space-y-3">
            {report.questionResults.map((q) => {
              const isExpanded = expandedQ === q.id;
              const typeBadge = q.type === "mcq" ? "MCQ" : q.type === "short_answer" ? "Short" : "Code";
              const typeColor = q.type === "mcq" ? "bg-surface-tint text-brand" : q.type === "short_answer" ? "bg-surface-tint text-brand" : "bg-success-bg text-success";

              return (
                <div key={q.id} className="rounded-xl border border-border bg-surface overflow-hidden transition-all shadow-card">
                  {/* Header (always visible) */}
                  <button
                    onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-soft transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                      q.correct ? "bg-success-bg text-success" : "bg-error-bg text-error"
                    )}>
                      {q.correct ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-ink">Q{q.number}</span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", typeColor)}>{typeBadge}</span>
                        <span className="text-[10px] text-ink-muted">{q.topicTag}</span>
                      </div>
                      <p className="text-xs text-ink-muted truncate">{q.stem.slice(0, 100)}</p>
                    </div>
                    <span className="text-sm font-bold text-ink-secondary tabular-nums shrink-0">{q.marksAwarded}/{q.marksTotal}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={cn("text-ink-muted shrink-0 transition-transform", isExpanded && "rotate-180")}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4 animate-step-in">
                      {/* Full question */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Question</p>
                        <p className="text-sm text-ink-secondary whitespace-pre-wrap">{q.stem}</p>
                      </div>

                      {/* Student's answer */}
                      {q.studentAnswer && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Your Answer</p>
                          {q.type === "code" ? (
                            <pre className="text-xs text-emerald-300 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap" style={{ background: "#0D1117" }}>
                              {q.studentAnswer}
                            </pre>
                          ) : (
                            <p className="text-sm text-ink-secondary">{q.studentAnswer}</p>
                          )}
                        </div>
                      )}

                      {/* Correct answer / mark scheme */}
                      {q.correctAnswer && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
                            {q.type === "mcq" ? "Correct Answer" : "Mark Scheme"}
                          </p>
                          <p className="text-sm text-success">{q.correctAnswer}</p>
                        </div>
                      )}

                      {/* AI Feedback */}
                      {q.feedback && (
                        <div className="rounded-lg bg-surface-tint border border-brand/20 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-brand mb-1">AI Feedback</p>
                          <p className="text-sm text-ink-secondary">{q.feedback}</p>
                        </div>
                      )}

                      {/* Grading breakdown */}
                      {q.breakdown && q.breakdown.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-2">Grading Breakdown</p>
                          <div className="space-y-1.5">
                            {q.breakdown.map((b, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className={cn(
                                  "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                                  b.awarded > 0 ? "bg-success-bg text-success" : "bg-error-bg text-error"
                                )}>
                                  {b.awarded}
                                </span>
                                <span className="text-ink-secondary">{b.criterion}</span>
                                {b.reasoning && <span className="text-ink-muted">- {b.reasoning}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improved code suggestion */}
                      {q.improvedCode && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Improved Code</p>
                          <pre className="text-xs text-emerald-300 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap" style={{ background: "#0D1117" }}>
                            {q.improvedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 6 — AI RECOMMENDATIONS                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.recommendationsMd && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-brand/20 bg-surface-tint p-6 sm:p-8 shadow-card">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-sm font-black text-white">
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-surface mb-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
                      AI Recommendation
                    </span>
                  </div>
                  <div className="text-sm sm:text-base text-ink-secondary leading-relaxed space-y-3">
                    {report.recommendationsMd.split("\n").map((line, i) => {
                      if (!line.trim()) return <div key={i} className="h-1" />;
                      if (line.match(/^\d+\./)) {
                        return (
                          <p key={i} className="pl-4 border-l-2 border-brand/20 text-ink-secondary">
                            <span className="font-semibold text-ink">{line.slice(0, line.indexOf(".") + 1)}</span>
                            {line.slice(line.indexOf(".") + 1)}
                          </p>
                        );
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 7 — CTA                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-ink mb-3">
            Ready to close these gaps?
          </h2>
          <p className="text-ink-muted text-sm mb-8">
            Choose a learning plan tailored to your skill level and schedule.
          </p>
          <Link
            href={`/courses/${slug}/plan?reportId=${report.reportId}`}
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-brand text-white font-bold text-base hover:bg-brand-dark transition-all"
          >
            Choose your plan
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
