"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShareResultButton } from "@/components/ShareResultButton";
import { levelFor, LEVEL_LABELS, type DomainScore } from "@/lib/competency";

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

/* Known abbreviations that should stay uppercase */
const UPPER_TOKENS = new Set(["cnn", "ai", "ml", "api", "apis", "llm", "llms", "sql", "ci", "cd", "bfs", "dfs", "yolo", "pid", "owasp", "cia", "dos", "admet", "tcp", "ip", "http", "css", "html", "jwt", "ssh", "tls", "ssl", "dns", "ui", "ux"]);

/** Turn a slug like "edge-detection" → "Edge Detection", "cnn" → "CNN", "ci_cd" → "CI/CD" */
function formatTopicName(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => {
      const lower = w.toLowerCase();
      if (UPPER_TOKENS.has(lower)) return lower.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\bCi Cd\b/g, "CI/CD")
    .replace(/\bCia Triad\b/g, "CIA Triad");
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
  domainMastery?: DomainScore[] | null;
  roleReadiness?: string | null;
  cohortPercentile?: number | null;
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

/* ── Big Score Ring ────────────────────────────────────────────────────── */
function ScoreRing({ percentage, level, animate }: { percentage: number; level: string; animate: boolean }) {
  const [progress, setProgress] = useState(0);
  const displayScore = useCountUp(percentage, 2000, animate);

  useEffect(() => {
    if (!animate) return;
    const start = Date.now();
    const duration = 2000;
    const step = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [animate]);

  const size = 200;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (percentage / 100) * progress);
  const color = percentage >= 70 ? "#19A65F" : percentage >= 40 ? "#E5B217" : "#D93636";
  const bgColor = percentage >= 70 ? "rgba(25,166,95,0.1)" : percentage >= 40 ? "rgba(229,178,23,0.1)" : "rgba(217,54,54,0.1)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EEF5" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tabular-nums text-ink">{displayScore}</span>
        <span className="text-xs text-ink-muted font-semibold mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

/* ── Mini Score Ring (for type breakdown) ──────────────────────────────── */
function MiniRing({ score, max, label, color }: { score: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const size = 72;
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EEF5" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-ink">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-ink">{score}/{max}</p>
        <p className="text-[10px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

/* ── Radar chart (SVG) ─────────────────────────────────────────────────── */
function RadarChart({ topics, animate, preformatted }: { topics: TopicMastery[]; animate: boolean; preformatted?: boolean }) {
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
            {preformatted ? t.topic : formatTopicName(t.topic)}
          </text>
        );
      })}
      <circle cx={CX} cy={CY} r={3} fill="#0056CE" />
    </svg>
  );
}

/* ── Horizontal comparison bar ─────────────────────────────────────────── */
function ComparisonBar({ topic, percentage, rank }: { topic: string; percentage: number; rank: "strength" | "gap" }) {
  const color = rank === "strength" ? "#19A65F" : "#D93636";
  const bg = rank === "strength" ? "rgba(25,166,95,0.1)" : "rgba(217,54,54,0.1)";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-ink w-32 sm:w-40 truncate text-right">{topic}</span>
      <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: bg }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
          style={{ width: `${Math.max(percentage, 8)}%`, background: color }}>
          <span className="text-[10px] font-bold text-white">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Competency level-band colours (Novice → Expert) ───────────────────── */
const BAND_COLORS = ["#E6F1FB", "#B5D4F4", "#378ADD", "#185FA5", "#0C447C"];

/* ── Competency matrix (domain × Novice→Expert) ────────────────────────── */
function CompetencyMatrix({ domains }: { domains: DomainScore[] }) {
  return (
    <div className="space-y-2.5">
      {domains.map((d) => {
        const bandIdx = LEVEL_LABELS.indexOf(d.level as (typeof LEVEL_LABELS)[number]);
        return (
          <div key={d.domain} className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-medium text-ink w-24 sm:w-32 shrink-0 truncate" title={d.domain}>{d.domain}</span>
            <div className="flex-1 flex gap-1">
              {LEVEL_LABELS.map((lvl, i) => (
                <div
                  key={lvl}
                  title={lvl}
                  className={`flex-1 h-6 rounded-md flex items-center justify-center ${i <= bandIdx ? "" : "bg-surface-alt"}`}
                  style={i <= bandIdx ? { background: BAND_COLORS[i] } : undefined}
                >
                  {i === bandIdx && (
                    <span className="text-[8px] font-bold px-0.5 truncate" style={{ color: i >= 2 ? "#fff" : "#0C447C" }}>{lvl}</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold tabular-nums text-ink w-8 text-right">{d.percentage}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Where you stand (level bands + role-readiness + cohort percentile) ── */
function WhereYouStand({ level, role, percentile }: { level: string; role: string | null; percentile: number | null }) {
  const curIdx = LEVEL_LABELS.indexOf(level as (typeof LEVEL_LABELS)[number]);
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {LEVEL_LABELS.map((lvl, i) => (
          <div key={lvl} className="flex-1">
            <div
              className="h-8 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-center px-0.5"
              style={{ background: BAND_COLORS[i], color: i >= 2 ? "#fff" : "#0C447C", outline: i === curIdx ? "2px solid #0056CE" : "none", outlineOffset: "1px" }}
            >
              {lvl}
            </div>
            {i === curIdx && <p className="text-[9px] text-brand font-bold text-center mt-1">You</p>}
          </div>
        ))}
      </div>
      {role && (
        <div className="rounded-xl border border-brand/20 bg-surface-tint p-4">
          <p className="text-[10px] uppercase tracking-wider text-brand font-bold mb-1">Role readiness</p>
          <p className="text-sm text-ink">Your profile aligns with a <span className="font-bold">{role}</span>.</p>
          <p className="text-[10px] text-ink-muted mt-1.5">Square 1 role rubric — guidance, not a certification.</p>
        </div>
      )}
      {percentile != null ? (
        <p className="text-xs text-ink-muted text-center">
          You scored higher than <span className="font-bold text-ink">{percentile}%</span> of Square 1 learners on this assessment.
        </p>
      ) : (
        <p className="text-[10px] text-ink-muted text-center">Cohort percentile unlocks once more learners complete this assessment.</p>
      )}
    </div>
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
          <div className="w-full bg-surface-alt rounded-full h-1.5 mb-6">
            <div className="h-1.5 rounded-full bg-brand transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="space-y-3">
            {GRADING_STEPS.map((step, i) => {
              const done = i < completedSteps;
              const active = i === completedSteps;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs transition-all",
                    done ? "bg-success text-white" : active ? "bg-surface-tint border-2 border-brand animate-pulse" : "bg-surface-alt"
                  )}>
                    {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <span className={cn("text-sm transition-colors", done ? "text-ink" : "text-ink-muted")}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  THE REPORT — VISUALS FIRST                                        */
  /* ═══════════════════════════════════════════════════════════════════ */
  const sortedTopics = [...report.topicMastery].sort((a, b) => a.percentage - b.percentage);
  // When the course has a competency config, headline the high-level DOMAINS
  // (clean ~6) instead of the raw micro-topics; fall back to topics otherwise.
  const hasDomains = !!(report.domainMastery && report.domainMastery.length >= 3);
  const overallLevel = levelFor(report.percentage);
  const competencyList = hasDomains
    ? report.domainMastery!.map((d) => ({ label: d.domain, percentage: d.percentage }))
    : report.topicMastery.map((t) => ({ label: formatTopicName(t.topic), percentage: t.percentage }));
  const strengths = [...competencyList].sort((a, b) => b.percentage - a.percentage).slice(0, 3);
  const gaps = [...competencyList].sort((a, b) => a.percentage - b.percentage).slice(0, 3);
  const radarData: TopicMastery[] = hasDomains
    ? report.domainMastery!.map((d) => ({ topic: d.domain, correct: d.correct, total: d.total, percentage: d.percentage }))
    : report.topicMastery;

  const levelConfig = {
    beginner: { label: "BEGINNER", bg: "bg-error-bg", text: "text-error", border: "border-error/30", desc: "You're just getting started — there's a lot to learn." },
    intermediate: { label: "INTERMEDIATE", bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30", desc: "Solid foundation — but key gaps remain." },
    advanced: { label: "ADVANCED", bg: "bg-success-bg", text: "text-success", border: "border-success/30", desc: "Strong skills — time to master the edges." },
  };
  const lc = levelConfig[report.level];

  // Question type counts
  const totalQs = report.questionResults.length;
  const correctQs = report.questionResults.filter(q => q.correct).length;
  const incorrectQs = totalQs - correctQs;

  return (
    <div ref={reportRef}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 1 — SCORE HERO + RING                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">Your Skill Report</span>
          </div>

          {/* Score Ring */}
          <div className="flex justify-center mb-5">
            <ScoreRing percentage={report.percentage} level={report.level} animate={true} />
          </div>

          {/* Level badge */}
          <div className={cn("inline-flex items-center px-5 py-2 rounded-full border text-sm font-bold tracking-wider mb-3", lc.bg, lc.text, lc.border)}>
            {lc.label}
          </div>
          <p className="text-sm text-ink-muted max-w-xs mx-auto">{lc.desc}</p>

          {/* Quick stats row */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-ink tabular-nums">{totalQs}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider">Questions</p>
            </div>
            <div className="bg-success-bg/50 border border-success/20 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-success tabular-nums">{correctQs}</p>
              <p className="text-[10px] text-success uppercase tracking-wider">Correct</p>
            </div>
            <div className="bg-error-bg/50 border border-error/20 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-error tabular-nums">{incorrectQs}</p>
              <p className="text-[10px] text-error uppercase tracking-wider">Incorrect</p>
            </div>
          </div>

          {/* Share your result — positive framing, drives the loop to /diagnostic */}
          <div className="mt-7">
            <ShareResultButton percentage={report.percentage} level={lc.label} courseTitle={formatTopicName(slug)} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 2 — RADAR + SCORE BY TYPE (side by side)             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.topicMastery.length >= 3 && (
        <section className="pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar */}
            <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
              <h3 className="text-sm font-bold text-ink mb-1">{hasDomains ? "Competency Radar" : "Skill Radar"}</h3>
              <p className="text-xs text-ink-muted mb-3">{hasDomains ? "Your mastery across the core domains" : "Your coverage across all topics"}</p>
              <RadarChart topics={radarData} animate={true} preformatted={hasDomains} />
            </div>

            {/* Score by Type + Accuracy */}
            <div className="space-y-6">
              {/* Score by Type */}
              <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
                <h3 className="text-sm font-bold text-ink mb-1">Score by Question Type</h3>
                <p className="text-xs text-ink-muted mb-5">How you performed across formats</p>
                <div className="flex items-center justify-around">
                  {report.mcqMax != null && report.mcqMax > 0 && (
                    <MiniRing score={report.mcqScore ?? 0} max={report.mcqMax} label="MCQ" color="#3B82F6" />
                  )}
                  {report.shortMax != null && report.shortMax > 0 && (
                    <MiniRing score={report.shortScore ?? 0} max={report.shortMax} label="Short Answer" color="#F59E0B" />
                  )}
                  {report.codeMax != null && report.codeMax > 0 && (
                    <MiniRing score={report.codeScore ?? 0} max={report.codeMax} label="Code" color="#8B5CF6" />
                  )}
                </div>
              </div>

              {/* Accuracy meter */}
              <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
                <h3 className="text-sm font-bold text-ink mb-1">Overall Accuracy</h3>
                <p className="text-xs text-ink-muted mb-4">Questions answered correctly</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full h-4 rounded-full bg-surface-alt overflow-hidden flex">
                      <div className="h-full bg-success rounded-l-full transition-all duration-1000"
                        style={{ width: `${totalQs > 0 ? (correctQs / totalQs) * 100 : 0}%` }} />
                      <div className="h-full bg-error rounded-r-full transition-all duration-1000"
                        style={{ width: `${totalQs > 0 ? (incorrectQs / totalQs) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-success font-semibold">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        {correctQs} correct
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-error font-semibold">
                        <span className="w-2 h-2 rounded-full bg-error" />
                        {incorrectQs} incorrect
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-black tabular-nums text-ink">
                      {totalQs > 0 ? Math.round((correctQs / totalQs) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 2.5 — COMPETENCY MATRIX + WHERE YOU STAND            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {hasDomains && (
        <section className="pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
              <h3 className="text-sm font-bold text-ink mb-1">Competency Matrix</h3>
              <p className="text-xs text-ink-muted mb-4">Your level in each domain · Novice → Expert</p>
              <CompetencyMatrix domains={report.domainMastery!} />
            </div>
            <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
              <h3 className="text-sm font-bold text-ink mb-1">Where You Stand</h3>
              <p className="text-xs text-ink-muted mb-4">Overall level &amp; role readiness</p>
              <WhereYouStand level={overallLevel} role={report.roleReadiness ?? null} percentile={report.cohortPercentile ?? null} />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 3 — STRENGTHS vs GAPS (visual bars)                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-ink">Your Strengths & Gaps</h2>
            <p className="text-sm text-ink-muted mt-1">What to celebrate and where to focus</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="rounded-2xl border border-success/20 bg-success-bg/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 className="text-sm font-bold text-success uppercase tracking-wider">Top Strengths</h3>
              </div>
              <div className="space-y-3">
                {strengths.map((t) => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">{t.label}</span>
                      <span className="text-xs font-bold text-success tabular-nums">{t.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-success/10">
                      <div className="h-full rounded-full bg-success transition-all duration-1000" style={{ width: `${t.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="rounded-2xl border border-error/20 bg-error-bg/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-error/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D93636" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-error uppercase tracking-wider">Gaps to Close</h3>
              </div>
              <div className="space-y-3">
                {gaps.map((t) => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">{t.label}</span>
                      <span className="text-xs font-bold text-error tabular-nums">{t.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-error/10">
                      <div className="h-full rounded-full bg-error transition-all duration-1000" style={{ width: `${t.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 4 — FIRST CTA (conversion point)                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border-2 border-brand/30 bg-surface-tint p-6 sm:p-8 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-ink mb-2">
              Ready to close these gaps?
            </h2>
            <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto">
              Your personalised learning plan targets exactly what you need.
              {report.level === "beginner" ? " Start building from the foundation up." :
               report.level === "intermediate" ? " Bridge the gaps to reach advanced level." :
               " Master the final edges to become an expert."}
            </p>
            <Link
              href={`/courses/${slug}/plan?reportId=${report.reportId}`}
              className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-brand text-white font-bold text-base hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Choose your plan
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 5 — TOPIC MASTERY BARS (detail)                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.topicMastery.length > 0 && (
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-3">
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">Topic Mastery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-ink">Full Topic Breakdown</h2>
            </div>

            <div className="space-y-3">
              {sortedTopics.map((t) => {
                const color = t.percentage >= 70 ? "#19A65F" : t.percentage >= 40 ? "#E5B217" : "#D93636";
                const bgColor = t.percentage >= 70 ? "rgba(25,166,95,0.1)" : t.percentage >= 40 ? "rgba(229,178,23,0.1)" : "rgba(217,54,54,0.1)";
                return (
                  <div key={t.topic} className="rounded-xl border border-border bg-surface p-4 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{formatTopicName(t.topic)}</span>
                        {t.questionCount != null && (
                          <span className="text-[10px] text-ink-muted">{t.questionCount} Q{t.questionCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{t.percentage}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: bgColor }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${t.percentage}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 6 — QUESTION BREAKDOWN                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-3">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">Question Breakdown</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-ink">Every question reviewed</h2>
          </div>

          <div className="space-y-3">
            {report.questionResults.map((q) => {
              const isExpanded = expandedQ === q.id;
              const typeBadge = q.type === "mcq" ? "MCQ" : q.type === "short_answer" ? "Short" : "Code";
              const typeColor = q.type === "mcq" ? "bg-surface-tint text-brand" : q.type === "short_answer" ? "bg-surface-tint text-brand" : "bg-success-bg text-success";

              return (
                <div key={q.id} className="rounded-xl border border-border bg-surface overflow-hidden transition-all shadow-card">
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
                        <span className="text-[10px] text-ink-muted">{formatTopicName(q.topicTag)}</span>
                      </div>
                      <p className="text-xs text-ink-muted truncate">{q.stem.slice(0, 100)}</p>
                    </div>
                    <span className="text-sm font-bold text-ink-secondary tabular-nums shrink-0">{q.marksAwarded}/{q.marksTotal}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={cn("text-ink-muted shrink-0 transition-transform", isExpanded && "rotate-180")}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Question</p>
                        <p className="text-sm text-ink-secondary whitespace-pre-wrap">{q.stem}</p>
                      </div>
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
                      {q.correctAnswer && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
                            {q.type === "mcq" ? "Correct Answer" : "Mark Scheme"}
                          </p>
                          <p className="text-sm text-success">{q.correctAnswer}</p>
                        </div>
                      )}
                      {q.feedback && (
                        <div className="rounded-lg bg-surface-tint border border-brand/20 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-brand mb-1">AI Feedback</p>
                          <p className="text-sm text-ink-secondary">{q.feedback}</p>
                        </div>
                      )}
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
      {/*  SECTION 7 — AI RECOMMENDATIONS                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.recommendationsMd && (
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-brand/20 bg-surface-tint p-6 sm:p-8 shadow-card">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-sm font-black text-white">
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-surface mb-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">Your Action Plan</span>
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
      {/*  SECTION 8 — BOTTOM CTA                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-ink mb-3">
            Start learning today
          </h2>
          <p className="text-ink-muted text-sm mb-8">
            Your personalised plan is waiting. Every lesson targets your weak spots.
          </p>
          <Link
            href={`/courses/${slug}/plan?reportId=${report.reportId}`}
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-brand text-white font-bold text-base hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 transition-all"
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
