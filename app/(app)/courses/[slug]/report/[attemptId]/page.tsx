"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string; attemptId: string }>;
}

interface TopicMastery {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

interface QuestionResult {
  id: string;
  number: number;
  stem: string;
  type: string;
  marksAwarded: number;
  marksTotal: number;
  feedback: string | null;
  correct: boolean;
}

interface ReportData {
  reportId: string;
  level: "beginner" | "intermediate" | "advanced";
  score: number;
  maxScore: number;
  percentage: number;
  topicMastery: TopicMastery[];
  recommendationsMd: string;
  questionResults: QuestionResult[];
}

type GradingStep = {
  label: string;
  done: boolean;
};

function LevelBadge({ level }: { level: string }) {
  if (level === "advanced") return <Badge variant="success" className="text-sm px-4 py-1.5">Advanced</Badge>;
  if (level === "intermediate") return <Badge variant="warning" className="text-sm px-4 py-1.5">Intermediate</Badge>;
  return <Badge variant="error" className="text-sm px-4 py-1.5">Beginner</Badge>;
}

function MasteryBar({ topic, percentage }: { topic: string; percentage: number }) {
  const color = percentage >= 70 ? "bg-success" : percentage >= 40 ? "bg-warning" : "bg-error";
  const textColor = percentage >= 70 ? "text-success" : percentage >= 40 ? "text-warning" : "text-error";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-ink">{topic}</span>
        <span className={`text-sm font-semibold ${textColor}`}>{percentage}%</span>
      </div>
      <div className="w-full bg-surface-alt rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

const STEPS: GradingStep[] = [
  { label: "Loading your responses...", done: false },
  { label: "Grading multiple choice...", done: false },
  { label: "Analysing short answers with AI...", done: false },
  { label: "Reviewing code submissions...", done: false },
  { label: "Generating skill report...", done: false },
];

export default function ReportPage({ params }: PageProps) {
  const { slug, attemptId } = use(params);

  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<GradingStep[]>(STEPS);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let stepTimer: ReturnType<typeof setInterval>;
    let stepIdx = 0;

    // Animate steps
    stepTimer = setInterval(() => {
      stepIdx += 1;
      setCurrentStep(stepIdx);
      setSteps((prev) =>
        prev.map((s, i) => (i < stepIdx ? { ...s, done: true } : s))
      );
      if (stepIdx >= STEPS.length) clearInterval(stepTimer);
    }, 1400);

    // Actually grade
    async function grade() {
      try {
        const res = await fetch(`/api/grade/${attemptId}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Grading failed");
        clearInterval(stepTimer);
        setSteps(STEPS.map((s) => ({ ...s, done: true })));
        setCurrentStep(STEPS.length);
        setReport(data);
      } catch (err) {
        clearInterval(stepTimer);
        setError(err instanceof Error ? err.message : "Grading failed");
      }
    }

    grade();
    return () => clearInterval(stepTimer);
  }, [attemptId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-ink mb-2">Grading failed</h2>
          <p className="text-sm text-error mb-6">{error}</p>
          <Link href={`/courses/${slug}`}>
            <Button variant="secondary">Back to course</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface rounded-[var(--radius-xl)] border border-border shadow-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-surface-tint flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
              🤖
            </div>
            <h2 className="text-xl font-bold text-ink">Analysing your answers...</h2>
            <p className="text-sm text-ink-muted mt-1">This usually takes 15–30 seconds.</p>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={[
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs",
                  step.done
                    ? "bg-success text-white"
                    : i === currentStep
                    ? "bg-brand/20 border-2 border-brand animate-pulse"
                    : "bg-surface-alt",
                ].join(" ")}>
                  {step.done ? "✓" : ""}
                </div>
                <span className={`text-sm ${step.done ? "text-ink" : "text-ink-muted"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topTopics = [...report.topicMastery]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
  const bottomTopics = [...report.topicMastery]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-8 text-center">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4">
          Your Skill Level
        </p>
        <LevelBadge level={report.level} />
        <div className="mt-6 flex items-center justify-center gap-8">
          <div>
            <p className="text-4xl font-bold text-ink">{report.score}</p>
            <p className="text-xs text-ink-muted mt-0.5">out of {report.maxScore}</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div>
            <p className="text-4xl font-bold text-brand">{report.percentage}%</p>
            <p className="text-xs text-ink-muted mt-0.5">overall score</p>
          </div>
        </div>
      </div>

      {/* Skill breakdown */}
      {report.topicMastery.length > 0 && (
        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-6">
          <h2 className="text-base font-semibold text-ink mb-5">Skill breakdown</h2>
          <div className="space-y-4">
            {report.topicMastery.map((t) => (
              <MasteryBar key={t.topic} topic={t.topic} percentage={t.percentage} />
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">💪 Strengths</h3>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((t) => (
              <span
                key={t.topic}
                className="px-3 py-1 bg-success-bg text-success text-xs font-semibold rounded-[var(--radius-pill)]"
              >
                {t.topic}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">🎯 Areas to improve</h3>
          <div className="flex flex-wrap gap-2">
            {bottomTopics.map((t) => (
              <span
                key={t.topic}
                className="px-3 py-1 bg-error-bg text-error text-xs font-semibold rounded-[var(--radius-pill)]"
              >
                {t.topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {report.recommendationsMd && (
        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-6">
          <h2 className="text-base font-semibold text-ink mb-4">🤖 AI Recommendations</h2>
          <div className="prose prose-sm max-w-none text-ink-secondary">
            {report.recommendationsMd.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h3 key={i} className="text-sm font-semibold text-ink mt-4 mb-1">{line.slice(3)}</h3>;
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return <p key={i} className="text-sm text-ink-secondary pl-3 border-l-2 border-brand/20 my-1">{line.slice(2)}</p>;
              }
              if (!line.trim()) return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm text-ink-secondary">{line}</p>;
            })}
          </div>
        </div>
      )}

      {/* Question breakdown */}
      <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-6">
        <h2 className="text-base font-semibold text-ink mb-4">Question breakdown</h2>
        <div className="space-y-4">
          {report.questionResults.map((q) => (
            <div key={q.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <span className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                  q.correct ? "bg-success-bg text-success" : "bg-error-bg text-error",
                ].join(" ")}>
                  {q.correct ? "✓" : "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-ink">Q{q.number}</p>
                    <span className="text-xs text-ink-muted shrink-0">
                      {q.marksAwarded}/{q.marksTotal} marks
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary line-clamp-2">{q.stem}</p>
                  {q.feedback && (
                    <p className="text-xs text-ink-muted mt-1.5 italic">{q.feedback}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pb-4">
        <Link href={`/courses/${slug}/plan?reportId=${report.reportId}`}>
          <Button size="lg">Choose your learning plan →</Button>
        </Link>
      </div>
    </div>
  );
}
