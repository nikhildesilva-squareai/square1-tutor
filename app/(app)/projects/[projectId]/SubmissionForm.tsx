"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SubmissionFormProps {
  projectId: string;
}

export function SubmissionForm({ projectId }: SubmissionFormProps) {
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    max_score: number;
    breakdown: { criterion: string; score: number; max: number; feedback: string }[];
    overall_feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          githubUrl,
          liveUrl: liveUrl || undefined,
          description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult({
        score: data.score,
        max_score: data.max_score,
        breakdown: data.breakdown,
        overall_feedback: data.overall_feedback,
        strengths: data.strengths,
        improvements: data.improvements,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return <ScoreDisplay result={result} onResubmit={() => setResult(null)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="githubUrl" className="block text-sm font-medium text-ink mb-1.5">
          GitHub Repository URL
        </label>
        <input
          id="githubUrl"
          type="url"
          required
          placeholder="https://github.com/you/your-project"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full border border-border bg-surface text-ink rounded-xl h-11 px-4 text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="liveUrl" className="block text-sm font-medium text-ink mb-1.5">
          Live Demo URL <span className="text-ink-muted font-normal">(optional)</span>
        </label>
        <input
          id="liveUrl"
          type="url"
          placeholder="https://your-demo.vercel.app"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          className="w-full border border-border bg-surface text-ink rounded-xl h-11 px-4 text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
          Notes <span className="text-ink-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Any context for the reviewer..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-border bg-surface text-ink rounded-xl px-4 py-3 text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
        />
      </div>

      {error && (
        <div className="bg-error-bg text-error text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        {loading ? "Reviewing..." : "Submit for AI Review"}
      </Button>
    </form>
  );
}

// ── Score display (used both inline after submission and from server) ─────────

interface ScoreDisplayProps {
  result: {
    score: number;
    max_score: number;
    breakdown: { criterion: string; score: number; max: number; feedback: string }[];
    overall_feedback: string;
    strengths: string[];
    improvements: string[];
  };
  onResubmit?: () => void;
}

function scoreStatus(score: number, max: number): "success" | "warning" | "error" {
  const pct = (score / max) * 100;
  if (pct >= 70) return "success";
  if (pct >= 50) return "warning";
  return "error";
}

const statusClasses = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
};

const statusIcons = {
  success: "check-circle",
  warning: "alert-triangle",
  error: "x-circle",
};

export function ScoreDisplay({ result, onResubmit }: ScoreDisplayProps) {
  const overallStatus = scoreStatus(result.score, result.max_score);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${statusClasses[overallStatus]}`}>
          Submitted
        </span>
        <span className="text-lg font-bold text-ink">
          Score: {result.score}/{result.max_score}
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {result.breakdown.map((item) => {
          const status = scoreStatus(item.score, item.max);
          return (
            <div
              key={item.criterion}
              className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${statusClasses[status]}`}>
                  {statusIcons[status] === "check-circle" ? "✓" : statusIcons[status] === "alert-triangle" ? "!" : "✗"}
                </span>
                <span className="text-sm font-medium text-ink">{item.criterion}</span>
              </div>
              <span className="text-sm font-semibold text-ink-secondary">
                {item.score}/{item.max}
              </span>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      <div className="bg-surface-alt rounded-xl px-5 py-4">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">AI Feedback</p>
        <p className="text-sm text-ink leading-relaxed">{result.overall_feedback}</p>
      </div>

      {/* Strengths & improvements */}
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Strengths</p>
          <ul className="space-y-1">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm text-ink flex items-start gap-2">
                <span className="text-success mt-0.5 shrink-0">{"✓"}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.improvements.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Areas for Improvement</p>
          <ul className="space-y-1">
            {result.improvements.map((s, i) => (
              <li key={i} className="text-sm text-ink flex items-start gap-2">
                <span className="text-warning mt-0.5 shrink-0">{">"}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resubmit */}
      {onResubmit && (
        <Button variant="secondary" onClick={onResubmit}>
          Re-submit (update)
        </Button>
      )}
    </div>
  );
}
