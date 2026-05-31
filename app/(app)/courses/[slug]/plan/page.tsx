"use client";

import { useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Plan {
  months: 3 | 6 | 9;
  label: string;
  daily: string;
  daysPerWeek: number;
  projects: number;
  idealFor: string;
  intensity: string;
  isFeatured?: boolean;
  sampleWeek: string[];
}

const PLANS: Plan[] = [
  {
    months: 3,
    label: "3-Month Plan",
    daily: "2 hours",
    daysPerWeek: 5,
    projects: 8,
    idealFor: "Career-switchers, full-time learners",
    intensity: "Intensive",
    sampleWeek: [
      "Day 1: Variables, types & control flow",
      "Day 2: Functions & scope",
      "Day 3: Data structures — lists & dicts",
      "Day 4: Error handling & debugging",
      "Day 5: Project kickoff — CLI tool",
    ],
  },
  {
    months: 6,
    label: "6-Month Plan",
    daily: "1 hour",
    daysPerWeek: 5,
    projects: 10,
    idealFor: "Working professionals",
    intensity: "Balanced",
    isFeatured: true,
    sampleWeek: [
      "Day 1: Core syntax & setup",
      "Day 2: Functions & modules",
      "Day 3: Data structures deep dive",
      "Day 4: Problem solving practice",
      "Day 5: Week review + mini project",
    ],
  },
  {
    months: 9,
    label: "9-Month Plan",
    daily: "45 min",
    daysPerWeek: 5,
    projects: 12,
    idealFor: "Students, casual learners",
    intensity: "Relaxed",
    sampleWeek: [
      "Day 1: Introduction & environment setup",
      "Day 2: Basic syntax walkthrough",
      "Day 3: Variables & data types",
      "Day 4: Simple exercises & challenges",
      "Day 5: Reflection & quiz",
    ],
  },
];

export default function PlanPage({ params }: PageProps) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("reportId") ?? "";

  const [selected, setSelected] = useState<3 | 6 | 9>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = PLANS.find((p) => p.months === selected)!;

  async function handleEnroll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, planMonths: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrollment failed");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-ink mb-2">Choose your learning plan</h1>
        <p className="text-sm text-ink-muted">
          All plans cover the same curriculum — just at different paces. You can switch later.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {PLANS.map((plan) => {
          const isSelected = selected === plan.months;
          return (
            <div
              key={plan.months}
              onClick={() => setSelected(plan.months)}
              className={cn(
                "relative bg-surface border-2 rounded-[var(--radius-xl)] p-6 cursor-pointer transition-all shadow-card",
                isSelected
                  ? "border-brand shadow-card-hover"
                  : "border-border hover:border-brand/40",
                plan.isFeatured && !isSelected && "border-brand/30"
              )}
            >
              {plan.isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand" className="shadow-sm">Most Popular</Badge>
                </div>
              )}

              {/* Selection indicator */}
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center mb-5 transition-colors",
                isSelected ? "border-brand bg-brand" : "border-border"
              )}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              <h3 className="text-base font-bold text-ink mb-1">{plan.label}</h3>
              <p className="text-xs text-ink-muted mb-5">{plan.intensity}</p>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-secondary">Daily time</span>
                  <span className="text-xs font-semibold text-ink">{plan.daily}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-secondary">Days/week</span>
                  <span className="text-xs font-semibold text-ink">{plan.daysPerWeek} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-secondary">Total projects</span>
                  <span className="text-xs font-semibold text-ink">{plan.projects} projects</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-ink-muted">
                  <span className="font-semibold text-ink">Perfect for: </span>
                  {plan.idealFor}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sample first week */}
      <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-card p-6 mb-8">
        <h2 className="text-sm font-semibold text-ink mb-4">
          Your first week on the {selectedPlan.label}
        </h2>
        <div className="space-y-2">
          {selectedPlan.sampleWeek.map((lesson, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center text-xs font-bold text-brand shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-ink-secondary">{lesson}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-error bg-error-bg px-4 py-2.5 rounded-[var(--radius-md)] mb-4">
          {error}
        </p>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border rounded-[var(--radius-xl)] shadow-card px-6 py-5">
        <div>
          <p className="text-base font-semibold text-ink">{selectedPlan.label}</p>
          <p className="text-sm text-ink-muted">
            {selectedPlan.daily}/day · {selectedPlan.daysPerWeek} days/week · {selectedPlan.projects} projects
          </p>
        </div>
        <Button size="lg" onClick={handleEnroll} loading={loading}>
          Start Learning →
        </Button>
      </div>
    </div>
  );
}
