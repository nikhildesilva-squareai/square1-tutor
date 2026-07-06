"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SkillReportView, type ReportData } from "@/components/SkillReportView";

interface PageProps {
  params: Promise<{ slug: string; attemptId: string }>;
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

export default function ReportPage({ params }: PageProps) {
  const { slug, attemptId } = use(params);

  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);

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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
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
  /*  THE REPORT                                                        */
  /* ═══════════════════════════════════════════════════════════════════ */
  return <SkillReportView report={report} slug={slug} />;
}
