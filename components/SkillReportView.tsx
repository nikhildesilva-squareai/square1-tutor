"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShareReportCta } from "@/components/ShareReportCta";
import { RadarChart } from "@/components/RadarChart";
import { levelFor, LEVEL_LABELS, getCompetencyConfig, type DomainScore } from "@/lib/competency";

/* ── Types ─────────────────────────────────────────────────────────────── */
export interface TopicMastery {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  questionCount?: number;
}

export interface QuestionResult {
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

export interface ReportData {
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

/* Known abbreviations that should stay uppercase */
const UPPER_TOKENS = new Set(["cnn", "ai", "ml", "api", "apis", "llm", "llms", "sql", "ci", "cd", "bfs", "dfs", "yolo", "pid", "owasp", "cia", "dos", "admet", "tcp", "ip", "http", "css", "html", "jwt", "ssh", "tls", "ssl", "dns", "ui", "ux"]);

/** Turn a slug like "edge-detection" → "Edge Detection", "cnn" → "CNN", "ci_cd" → "CI/CD" */
export function formatTopicName(slug: string): string {
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

/* ── Reduced-motion helper ─────────────────────────────────────────────── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ── Animated count-up hook ────────────────────────────────────────────── */
function useCountUp(target: number, duration: number = 1500, enabled: boolean = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) { setValue(target); return; }
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

/* ── Score → semantic colour (data accents only) ───────────────────────── */
function scoreColor(pct: number): string {
  return pct >= 70 ? "var(--color-success)" : pct >= 40 ? "var(--color-warning)" : "var(--color-error)";
}

/* ── Big Score Ring ────────────────────────────────────────────────────── */
function ScoreRing({ percentage, animate }: { percentage: number; animate: boolean }) {
  const [progress, setProgress] = useState(animate ? 0 : 1);
  const displayScore = useCountUp(percentage, 2000, animate);

  useEffect(() => {
    if (!animate) { setProgress(1); return; }
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
  const color = scoreColor(percentage);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-alt)" strokeWidth={strokeWidth} />
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
  const size = 76;
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-alt)" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-ink">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-ink tabular-nums">{score}/{max}</p>
        <p className="text-[11px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

/* ── Section header (one consistent pattern) ───────────────────────────── */
function SectionHeader({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="text-center mb-8">
      <p className="text-[11px] tracking-[0.18em] uppercase font-bold text-brand mb-2">{kicker}</p>
      <h2 className="text-xl sm:text-2xl font-black text-ink">{title}</h2>
      {sub && <p className="text-sm text-ink-muted mt-1.5">{sub}</p>}
    </div>
  );
}

/* ── Competency matrix (domain × Novice→Expert) ────────────────────────── */
/* Brand-alpha ramp — works on light and dark surfaces. */
const BAND_ALPHA = [0.18, 0.36, 0.56, 0.78, 1];

function CompetencyMatrix({ domains }: { domains: DomainScore[] }) {
  return (
    <div>
      <div className="space-y-3.5">
        {domains.map((d) => {
          const bandIdx = LEVEL_LABELS.indexOf(d.level as (typeof LEVEL_LABELS)[number]);
          return (
            <div key={d.domain}>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-[13px] font-semibold text-ink truncate" title={d.domain}>{d.domain}</span>
                <span className="flex items-baseline gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-brand">{d.level}</span>
                  <span className="text-[13px] font-bold tabular-nums text-ink w-9 text-right">{d.percentage}%</span>
                </span>
              </div>
              <div className="flex gap-1" role="img" aria-label={`${d.domain}: ${d.level}, ${d.percentage}%`}>
                {LEVEL_LABELS.map((lvl, i) => (
                  <div
                    key={lvl}
                    title={lvl}
                    className="flex-1 h-2.5 rounded-full"
                    style={{
                      background: i <= bandIdx ? "var(--color-brand)" : "var(--color-surface-alt)",
                      opacity: i <= bandIdx ? BAND_ALPHA[i] : 1,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* Scale legend */}
      <div className="flex justify-between mt-3 px-0.5">
        <span className="text-[10px] font-medium text-ink-muted">Novice</span>
        <span className="text-[10px] font-medium text-ink-muted">Expert</span>
      </div>
    </div>
  );
}

/* ── Where you stand (level ladder + role-readiness + cohort percentile) ── */
function WhereYouStand({ level, role, percentile }: { level: string; role: string | null; percentile: number | null }) {
  const curIdx = LEVEL_LABELS.indexOf(level as (typeof LEVEL_LABELS)[number]);
  return (
    <div className="space-y-5">
      {/* Level ladder */}
      <div>
        <div className="flex gap-1.5">
          {LEVEL_LABELS.map((lvl, i) => {
            const isCurrent = i === curIdx;
            const isPast = i < curIdx;
            return (
              <div key={lvl} className="flex-1 min-w-0">
                <div
                  className={cn(
                    "h-9 rounded-lg flex items-center justify-center px-0.5 transition-colors",
                    isCurrent ? "bg-brand text-white shadow-card-hover" : "bg-surface-alt"
                  )}
                  style={!isCurrent && isPast ? { background: "var(--color-surface-tint)" } : undefined}
                >
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold text-center truncate",
                    isCurrent ? "text-white" : isPast ? "text-brand" : "text-ink-muted"
                  )}>
                    {lvl}
                  </span>
                </div>
                <div className="h-4 flex items-start justify-center">
                  {isCurrent && (
                    <span className="text-[10px] text-brand font-bold mt-0.5">You</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {role && (
        <div className="rounded-xl border border-brand/20 bg-surface-tint p-4">
          <p className="text-[11px] uppercase tracking-wider text-brand font-bold mb-1">Role readiness</p>
          <p className="text-sm text-ink leading-relaxed">Your profile aligns with a <span className="font-bold">{role}</span>.</p>
          <p className="text-[11px] text-ink-muted mt-1.5">Square 1 role rubric — guidance, not a certification.</p>
        </div>
      )}

      {percentile != null ? (
        <div className="rounded-xl border border-border bg-surface-soft p-4 flex items-center gap-4">
          <div className="shrink-0 text-center">
            <p className="text-2xl font-black tabular-nums text-brand leading-none">Top {Math.max(1, 100 - percentile)}%</p>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            You scored higher than <span className="font-bold text-ink">{percentile}%</span> of Square 1 learners on this assessment.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-ink-muted text-center">Cohort percentile unlocks once more learners complete this assessment.</p>
      )}
    </div>
  );
}

/* ── Strength / gap row ────────────────────────────────────────────────── */
function SkillRow({ label, percentage, tone }: { label: string; percentage: number; tone: "strength" | "gap" }) {
  const color = tone === "strength" ? "var(--color-success)" : "var(--color-error)";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[13px] font-semibold text-ink truncate">{label}</span>
        <span className="text-[13px] font-bold tabular-nums text-ink shrink-0">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.max(percentage, 2)}%`, background: color }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SKILL REPORT VIEW                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */
export function SkillReportView({
  report,
  slug,
  publicView = false,
  shareSlot,
}: {
  report: ReportData;
  slug: string;
  /** Read-only shared mode: hides in-app CTAs and per-question sections,
   *  swaps conversion CTAs for /diagnostic. Used by /report/[token]. */
  publicView?: boolean;
  /** Replaces the default share button (e.g. the full share panel). */
  shareSlot?: React.ReactNode;
}) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion;

  const sortedTopics = [...report.topicMastery].sort((a, b) => a.percentage - b.percentage);
  // When the course has a competency config, headline the high-level DOMAINS
  // (clean ~6) instead of the raw micro-topics; fall back to topics otherwise.
  const hasDomains = !!(report.domainMastery && report.domainMastery.length >= 3);
  const overallLevel = levelFor(report.percentage);
  const competencyList = hasDomains
    ? report.domainMastery!.map((d) => ({ label: d.domain, percentage: d.percentage }))
    : report.topicMastery.map((t) => ({ label: formatTopicName(t.topic), percentage: t.percentage }));
  const ranked = [...competencyList].sort((a, b) => b.percentage - a.percentage);
  const strong = ranked.filter((t) => t.percentage >= 60).slice(0, 5);
  const weak = ranked.filter((t) => t.percentage < 60).reverse().slice(0, 5);
  const strengths = strong.length ? strong : ranked.slice(0, 3);
  const gaps = weak.length ? weak : [...ranked].reverse().slice(0, 3);
  const nextLevel = LEVEL_LABELS[Math.min(LEVEL_LABELS.indexOf(overallLevel as (typeof LEVEL_LABELS)[number]) + 1, LEVEL_LABELS.length - 1)];
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

  const brandGradient = "linear-gradient(135deg, var(--color-brand) 0%, #0B3B97 55%, var(--color-brand-deep) 100%)";

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 1 — SCORE HERO + RING                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-12 sm:pt-16 pb-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-brand">{formatTopicName(slug)} · Skill Report</span>
          </div>

          {/* Score Ring */}
          <div className="flex justify-center mb-6">
            <ScoreRing percentage={report.percentage} animate={animate} />
          </div>

          {/* Level badge */}
          <div className={cn("inline-flex items-center px-5 py-2 rounded-full border text-sm font-bold tracking-wider mb-3", lc.bg, lc.text, lc.border)}>
            {lc.label}
          </div>
          <p className="text-sm text-ink-muted max-w-xs mx-auto">{lc.desc}</p>

          {/* Quick stats row — only when per-question data is present */}
          {totalQs > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="bg-surface border border-border rounded-xl px-3 py-3.5 text-center">
              <p className="text-xl font-black text-ink tabular-nums">{totalQs}</p>
              <p className="text-[11px] text-ink-muted font-medium mt-0.5">Questions</p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-3 py-3.5 text-center">
              <p className="text-xl font-black text-success tabular-nums">{correctQs}</p>
              <p className="text-[11px] text-ink-muted font-medium mt-0.5">Correct</p>
            </div>
            <div className="bg-surface border border-border rounded-xl px-3 py-3.5 text-center">
              <p className="text-xl font-black text-error tabular-nums">{incorrectQs}</p>
              <p className="text-[11px] text-ink-muted font-medium mt-0.5">Incorrect</p>
            </div>
          </div>
          )}

          {/* Share — private view mints the public link; public view gets the panel */}
          <div className="mt-7">
            {shareSlot ?? <ShareReportCta reportId={report.reportId} percentage={report.percentage} level={lc.label} courseTitle={formatTopicName(slug)} />}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 2 — SKILL MAP: RADAR + MATRIX + WHERE YOU STAND      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.topicMastery.length >= 3 && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <SectionHeader kicker="Skill Map" title="Your skills at a glance" sub={hasDomains ? "Mastery across the core competency domains" : "Your coverage across all topics"} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Radar */}
              <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card flex flex-col">
                <h3 className="text-sm font-bold text-ink mb-1">{hasDomains ? "Competency Radar" : "Skill Radar"}</h3>
                <p className="text-xs text-ink-muted mb-2">Hover a point for the exact score</p>
                <div className="flex-1 flex items-center">
                  <RadarChart animate={animate} axes={radarData.map(t => ({ label: hasDomains ? t.topic : formatTopicName(t.topic), value: t.percentage, max: 100 }))} />
                </div>
              </div>

              {/* Matrix / Where you stand */}
              {hasDomains ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
                    <h3 className="text-sm font-bold text-ink mb-1">Competency Matrix</h3>
                    <p className="text-xs text-ink-muted mb-5">Your level in each domain</p>
                    <CompetencyMatrix domains={report.domainMastery!} />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
                  <h3 className="text-sm font-bold text-ink mb-1">Where You Stand</h3>
                  <p className="text-xs text-ink-muted mb-4">Overall level &amp; role readiness</p>
                  <WhereYouStand level={overallLevel} role={report.roleReadiness ?? null} percentile={report.cohortPercentile ?? null} />
                </div>
              )}
            </div>

            {/* Where you stand + score by type (second row when domains exist) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
              {hasDomains && (
                <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
                  <h3 className="text-sm font-bold text-ink mb-1">Where You Stand</h3>
                  <p className="text-xs text-ink-muted mb-4">Overall level &amp; role readiness</p>
                  <WhereYouStand level={overallLevel} role={report.roleReadiness ?? null} percentile={report.cohortPercentile ?? null} />
                </div>
              )}

              <div className={cn("space-y-5", !hasDomains && "lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 space-y-0")}>
                {/* Score by Type */}
                <div className="rounded-2xl border border-border p-5 sm:p-6 bg-surface shadow-card">
                  <h3 className="text-sm font-bold text-ink mb-1">Score by Question Type</h3>
                  <p className="text-xs text-ink-muted mb-5">How you performed across formats</p>
                  <div className="flex items-center justify-around">
                    {report.mcqMax != null && report.mcqMax > 0 && (
                      <MiniRing score={report.mcqScore ?? 0} max={report.mcqMax} label="MCQ" color="var(--color-brand)" />
                    )}
                    {report.shortMax != null && report.shortMax > 0 && (
                      <MiniRing score={report.shortScore ?? 0} max={report.shortMax} label="Short Answer" color="var(--color-brand-sky)" />
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
                      <div className="w-full h-3 rounded-full bg-surface-alt overflow-hidden flex">
                        <div className="h-full bg-success transition-all duration-1000"
                          style={{ width: `${totalQs > 0 ? (correctQs / totalQs) * 100 : 0}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-ink-secondary font-semibold">
                          <span className="w-2 h-2 rounded-full bg-success" />
                          {correctQs} correct
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-ink-secondary font-semibold">
                          <span className="w-2 h-2 rounded-full bg-surface-alt border border-border-mid" />
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
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 3 — STRENGTHS vs GAPS                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <SectionHeader kicker="Strengths & Gaps" title="What to celebrate, where to focus" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Strengths */}
            <div className="rounded-2xl border border-border bg-surface shadow-card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-success-bg flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 className="text-sm font-bold text-ink">Top Strengths</h3>
              </div>
              <div className="space-y-4">
                {strengths.map((t) => (
                  <SkillRow key={t.label} label={t.label} percentage={t.percentage} tone="strength" />
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="rounded-2xl border border-border bg-surface shadow-card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-error-bg flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-ink">Gaps to Close</h3>
              </div>
              <div className="space-y-4">
                {gaps.map((t) => (
                  <SkillRow key={t.label} label={t.label} percentage={t.percentage} tone="gap" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 4 — FIRST CTA (conversion point)                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-center shadow-xl" style={{ background: brandGradient }}>
            <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-[#4F7BFF]/30 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white">Your personalised path</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
                {publicView
                  ? <>Find out where <span className="underline decoration-white/40 decoration-2 underline-offset-4">you</span> stand</>
                  : gaps[0]
                    ? <>Close your biggest gap — <span className="underline decoration-white/40 decoration-2 underline-offset-4">{gaps[0].label}</span></>
                    : <>Turn this score into real, hireable skill</>}
              </h2>
              <p className="text-sm text-blue-100/90 mb-7 max-w-md mx-auto leading-relaxed">
                {publicView
                  ? "This report was built from a real AI-graded assessment. Take the free 3-minute skill check and get your own — no account needed to start."
                  : "We'll build a plan around your exact gaps — bite-size lessons, 24/7 AI tutoring with Nova, and real portfolio projects, sequenced just for you."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
                {(publicView
                  ? ["3-minute check", "AI-graded", "Free"]
                  : [`${overallLevel} → ${nextLevel}`, "AI tutor included", "Portfolio projects"]
                ).map((c) => (
                  <span key={c} className="text-[11px] font-semibold text-white bg-white/10 border border-white/15 rounded-full px-3 py-1.5">{c}</span>
                ))}
              </div>
              <Link href={publicView ? "/diagnostic" : `/courses/${slug}/plan?reportId=${report.reportId}&level=${overallLevel}`}
                className="group inline-flex items-center gap-2 h-14 px-10 rounded-2xl bg-white text-brand font-black text-base hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                {publicView ? "Take your free skill check" : "Build my learning plan"}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
              <p className="text-[11px] text-blue-100/70 mt-4">Start free · No credit card needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 5 — TOPIC MASTERY (detail)                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.topicMastery.length > 0 && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <SectionHeader kicker="Topic Mastery" title="Topic-by-topic breakdown" sub="Every micro-topic from your assessment, grouped by domain" />

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 mb-8">
              {[
                { label: "Strong · 70%+", color: "var(--color-success)" },
                { label: "Developing · 40–69%", color: "var(--color-warning)" },
                { label: "Focus · <40%", color: "var(--color-error)" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>

            {(() => {
              const cfg = getCompetencyConfig(slug);
              const topicDomain: Record<string, string> = {};
              if (cfg) for (const dm of cfg.domains) for (const tag of dm.tags) topicDomain[tag] = dm.name;
              const groups: Record<string, TopicMastery[]> = {};
              for (const t of sortedTopics) {
                const g = topicDomain[t.topic] ?? "Other topics";
                (groups[g] ||= []).push(t);
              }
              const order = cfg ? [...cfg.domains.map((d) => d.name), "Other topics"] : Object.keys(groups);
              return (
                <div className="space-y-7">
                  {order.filter((g) => groups[g]?.length).map((g) => (
                    <div key={g}>
                      {cfg && (
                        <p className="text-xs font-bold text-ink-secondary uppercase tracking-wider mb-3 flex items-center gap-3">
                          {g}
                          <span className="flex-1 h-px bg-border" />
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[...groups[g]].sort((a, b) => b.percentage - a.percentage).map((t) => (
                          <div
                            key={t.topic}
                            className="rounded-xl border border-border bg-surface p-3.5 shadow-card"
                            title={`${formatTopicName(t.topic)} · ${t.percentage}% (${t.correct}/${t.total})`}
                          >
                            <div className="text-lg font-black tabular-nums leading-none text-ink">{t.percentage}%</div>
                            <div className="text-[11px] font-medium mt-1.5 leading-tight text-ink-secondary line-clamp-2 min-h-[2em]">{formatTopicName(t.topic)}</div>
                            <div className="mt-2.5 h-1.5 rounded-full bg-surface-alt overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.max(t.percentage, 3)}%`, background: scoreColor(t.percentage) }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 6 — QUESTION BREAKDOWN (private only — needs answers) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {totalQs > 0 && (
      <section className="py-10 sm:py-14 px-4 sm:px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <SectionHeader kicker="Question Breakdown" title="Every question reviewed" />

          <div className="space-y-3">
            {report.questionResults.map((q) => {
              const isExpanded = expandedQ === q.id;
              const typeBadge = q.type === "mcq" ? "MCQ" : q.type === "short_answer" ? "Short" : "Code";

              return (
                <div key={q.id} className="rounded-xl border border-border bg-surface overflow-hidden transition-all shadow-card">
                  <button
                    onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-soft transition-colors cursor-pointer"
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
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-tint text-brand">{typeBadge}</span>
                        <span className="text-[11px] text-ink-muted truncate">{formatTopicName(q.topicTag)}</span>
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
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted mb-1">Question</p>
                        <p className="text-sm text-ink-secondary whitespace-pre-wrap">{q.stem}</p>
                      </div>
                      {q.studentAnswer && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted mb-1">Your Answer</p>
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
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted mb-1">
                            {q.type === "mcq" ? "Correct Answer" : "Mark Scheme"}
                          </p>
                          <p className="text-sm text-success">{q.correctAnswer}</p>
                        </div>
                      )}
                      {q.feedback && (
                        <div className="rounded-lg bg-surface-tint border border-brand/20 p-3">
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-brand mb-1">AI Feedback</p>
                          <p className="text-sm text-ink-secondary">{q.feedback}</p>
                        </div>
                      )}
                      {q.breakdown && q.breakdown.length > 0 && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted mb-2">Grading Breakdown</p>
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
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted mb-1">Improved Code</p>
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
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SECTION 7 — AI RECOMMENDATIONS                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {report.recommendationsMd && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-brand/20 bg-surface-tint p-6 sm:p-8 shadow-card">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
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
            {publicView ? "Ready to see your own numbers?" : "Your plan is ready when you are"}
          </h2>
          <p className="text-ink-muted text-sm mb-8">
            {publicView
              ? "Free 3-minute skill check, instant snapshot — then a full AI-graded report like this one."
              : "Every lesson, project, and Nova session targets the gaps above. Start today — free during early access."}
          </p>
          <Link
            href={publicView ? "/diagnostic" : `/courses/${slug}/plan?reportId=${report.reportId}&level=${overallLevel}`}
            className="group inline-flex items-center gap-2 h-14 px-10 rounded-2xl text-white font-black text-base hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-brand/30 transition-all"
            style={{ background: brandGradient }}
          >
            {publicView ? "Get my free skill report" : "Build my learning plan"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
