"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SubmissionFormProps {
  projectId: string;
}

interface SnippetLine {
  num: number;
  text: string;
  highlighted: boolean;
}

interface CodeComment {
  file: string;
  line?: number;
  comment: string;
  severity: "info" | "warning" | "error";
  snippet?: {
    startLine: number;
    lines: SnippetLine[];
  };
  githubUrl?: string;
}

interface RepoStats {
  totalFiles: number;
  filesReviewed: number;
  detectedStack: string[];
  hasReadme: boolean;
  hasTests: boolean;
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
    code_comments: CodeComment[];
    repo_stats?: RepoStats;
    attempt_number?: number;
    in_portfolio?: boolean;
    previous_attempt?: {
      attempt: number;
      score: number;
      max_score: number;
      breakdown: { criterion: string; score: number; max: number; feedback: string }[];
      submitted_at: string;
    } | null;
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
        code_comments: data.code_comments ?? [],
        repo_stats: data.repo_stats,
        attempt_number: data.attempt_number,
        in_portfolio: data.in_portfolio,
        previous_attempt: data.previous_attempt ?? null,
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
        <p className="text-[11px] text-ink-muted mt-1.5">
          Must be a public repository. We&apos;ll read your actual code for a real review.
        </p>
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

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          {loading ? "Reading code & reviewing..." : "Submit for AI Code Review"}
        </Button>
        {loading && (
          <span className="text-xs text-ink-muted animate-pulse">
            Fetching your code from GitHub...
          </span>
        )}
      </div>
    </form>
  );
}

// ── Score display (used both inline after submission and from server) ─────────

interface PreviousAttempt {
  attempt: number;
  score: number;
  max_score: number;
  breakdown: { criterion: string; score: number; max: number; feedback: string }[];
  submitted_at: string;
}

interface ScoreDisplayProps {
  result: {
    score: number;
    max_score: number;
    breakdown: { criterion: string; score: number; max: number; feedback: string }[];
    overall_feedback: string;
    strengths: string[];
    improvements: string[];
    code_comments?: CodeComment[];
    repo_stats?: RepoStats;
    attempt_number?: number;
    in_portfolio?: boolean;
    previous_attempt?: PreviousAttempt | null;
    submission_history?: PreviousAttempt[] | null;
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

const severityConfig = {
  info:    { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   icon: "💡" },
  warning: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  icon: "⚠️" },
  error:   { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    icon: "🔴" },
};

export function ScoreDisplay({ result, onResubmit }: ScoreDisplayProps) {
  const overallStatus = scoreStatus(result.score, result.max_score);
  const pct = Math.round((result.score / result.max_score) * 100);
  const codeComments = result.code_comments ?? [];
  const stats = result.repo_stats;
  const attempt = result.attempt_number ?? 1;
  const prev = result.previous_attempt ?? null;
  const scoreDiff = prev ? result.score - prev.score : null;
  const history = result.submission_history ?? [];
  const allAttempts = prev
    ? [...history.filter(h => h.attempt !== prev.attempt), prev]
    : history;

  return (
    <div className="space-y-5">
      {/* ── Header with score ring ─────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              stroke={pct >= 70 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444"}
              strokeWidth="3"
              strokeDasharray={`${pct * 0.975} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-ink">
            {pct}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusClasses[overallStatus]}`}>
              {pct >= 70 ? "Passed" : pct >= 50 ? "Needs Work" : "Not Ready"}
            </span>
            {attempt > 1 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-alt text-ink-muted">
                Attempt {attempt}
              </span>
            )}
            {result.in_portfolio && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                In Portfolio
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-lg font-bold text-ink">
              {result.score}/{result.max_score} points
            </p>
            {scoreDiff !== null && scoreDiff !== 0 && (
              <span className={`text-sm font-bold ${scoreDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {scoreDiff > 0 ? "+" : ""}{scoreDiff}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Score history timeline (re-submission tracking) ────────── */}
      {allAttempts.length > 0 && (
        <div className="bg-surface-alt rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Score History</p>
          <div className="flex items-end gap-1.5 h-12">
            {[...allAttempts, { attempt, score: result.score, max_score: result.max_score, breakdown: result.breakdown, submitted_at: "" }].map((a, i) => {
              const h = Math.max(8, Math.round((a.score / a.max_score) * 48));
              const isCurrent = i === allAttempts.length;
              const barColor = a.score >= 70 ? "#22C55E" : a.score >= 50 ? "#F59E0B" : "#EF4444";
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1" title={`Attempt ${a.attempt}: ${a.score}/${a.max_score}`}>
                  <span className="text-[9px] font-bold text-ink-muted tabular-nums">{a.score}</span>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isCurrent ? "ring-2 ring-brand/30" : ""}`}
                    style={{ height: h, background: barColor, opacity: isCurrent ? 1 : 0.5 }}
                  />
                  <span className="text-[8px] text-ink-muted">#{a.attempt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Repo stats (if available) ──────────────────────────────── */}
      {stats && (
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-ink-secondary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            {stats.filesReviewed} of {stats.totalFiles} files reviewed
          </span>
          {stats.hasReadme && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">✓ README</span>
          )}
          {!stats.hasReadme && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">✗ No README</span>
          )}
          {stats.hasTests && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Tests</span>
          )}
          {!stats.hasTests && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">✗ No Tests</span>
          )}
          {stats.detectedStack.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-ink-secondary">
              Stack: {stats.detectedStack.slice(0, 4).join(", ")}
              {stats.detectedStack.length > 4 && ` +${stats.detectedStack.length - 4}`}
            </span>
          )}
        </div>
      )}

      {/* ── Criterion breakdown ────────────────────────────────────── */}
      <div className="space-y-2">
        {result.breakdown.map((item) => {
          const status = scoreStatus(item.score, item.max);
          const itemPct = Math.round((item.score / item.max) * 100);
          // Find matching criterion in previous attempt for diff
          const prevItem = prev?.breakdown?.find(
            (b: { criterion: string }) => b.criterion === item.criterion
          );
          const critDiff = prevItem ? item.score - prevItem.score : null;
          return (
            <div
              key={item.criterion}
              className="bg-surface border border-border rounded-xl px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${statusClasses[status]}`}>
                    {status === "success" ? "✓" : status === "warning" ? "!" : "✗"}
                  </span>
                  <span className="text-sm font-semibold text-ink">{item.criterion}</span>
                  {critDiff !== null && critDiff !== 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      critDiff > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>
                      {critDiff > 0 ? "+" : ""}{critDiff}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-ink-secondary tabular-nums">
                  {item.score}/{item.max}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-surface-alt overflow-hidden mb-2 ml-7">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${itemPct}%`,
                    background: status === "success" ? "#22C55E" : status === "warning" ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
              {/* Feedback text */}
              <p className="text-xs text-ink-secondary leading-relaxed ml-7">{item.feedback}</p>
            </div>
          );
        })}
      </div>

      {/* ── Overall feedback ───────────────────────────────────────── */}
      <div className="bg-surface-alt rounded-xl px-5 py-4">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">AI Feedback</p>
        <p className="text-sm text-ink leading-relaxed">{result.overall_feedback}</p>
      </div>

      {/* ── Code Review — GitHub PR-style ──────────────────────────── */}
      {codeComments.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">
            Code Review
            <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-alt text-ink-muted text-[10px] font-bold">{codeComments.length}</span>
          </p>

          {/* Group comments by file */}
          {Object.entries(
            codeComments.reduce<Record<string, CodeComment[]>>((acc, c) => {
              const key = c.file;
              if (!acc[key]) acc[key] = [];
              acc[key].push(c);
              return acc;
            }, {})
          ).map(([file, comments]) => (
            <div key={file} className="mb-4 rounded-xl border border-border overflow-hidden bg-surface">
              {/* ── File header ─────────────────────────── */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-alt border-b border-border">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted shrink-0">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <code className="text-xs font-mono font-semibold text-ink truncate">{file}</code>
                <span className="ml-auto text-[10px] font-bold text-ink-muted">
                  {comments.length} {comments.length === 1 ? "comment" : "comments"}
                </span>
                {comments[0]?.githubUrl && (
                  <a
                    href={comments[0].githubUrl.split("#")[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand/80 transition-colors"
                    title="View on GitHub"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}
              </div>

              {/* ── Comments for this file ──────────────── */}
              {comments.map((c, i) => {
                const cfg = severityConfig[c.severity] ?? severityConfig.info;
                return (
                  <div key={i} className="border-b border-border last:border-b-0">
                    {/* Code snippet */}
                    {c.snippet && c.snippet.lines.length > 0 && (
                      <div className="overflow-x-auto bg-slate-950">
                        <table className="w-full text-[11px] font-mono leading-[1.6]">
                          <tbody>
                            {c.snippet.lines.map((line) => (
                              <tr
                                key={line.num}
                                className={line.highlighted
                                  ? c.severity === "error"
                                    ? "bg-red-950/60"
                                    : c.severity === "warning"
                                    ? "bg-amber-950/40"
                                    : "bg-blue-950/40"
                                  : ""
                                }
                              >
                                <td className="select-none text-right pr-3 pl-3 text-slate-500 w-[1%] whitespace-nowrap align-top">
                                  {line.num}
                                </td>
                                <td className={`pr-4 whitespace-pre ${
                                  line.highlighted ? "text-slate-100" : "text-slate-400"
                                }`}>
                                  {line.text}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Comment body */}
                    <div className={`px-4 py-3 ${cfg.bg} flex gap-2.5`}>
                      <span className="text-sm shrink-0 mt-0.5">{cfg.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.text} ${cfg.border} border`}>
                            {c.severity}
                          </span>
                          {c.line && (
                            <span className="text-[10px] font-mono text-ink-muted">
                              Line {c.line}
                            </span>
                          )}
                          {c.githubUrl && (
                            <a
                              href={c.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-brand hover:underline ml-auto"
                            >
                              View on GitHub
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{c.comment}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Strengths ──────────────────────────────────────────────── */}
      {result.strengths.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Strengths</p>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm text-ink flex items-start gap-2">
                <span className="text-success mt-0.5 shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Areas for improvement ──────────────────────────────────── */}
      {result.improvements.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Areas for Improvement</p>
          <ul className="space-y-1.5">
            {result.improvements.map((s, i) => (
              <li key={i} className="text-sm text-ink flex items-start gap-2">
                <span className="text-warning mt-0.5 shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Portfolio notice ─────────────────────────────────────────── */}
      {result.in_portfolio && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" className="mt-0.5 shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Added to your Career Portfolio</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              This project scored 70+ and is now visible on your public portfolio with your GitHub link and tech stack.
            </p>
          </div>
        </div>
      )}

      {/* ── Resubmit ───────────────────────────────────────────────── */}
      {onResubmit && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-ink-muted mb-3">
            {pct >= 70
              ? "Want a higher score? Fix the remaining issues, push to GitHub, and re-submit."
              : "Fix the issues above, push to GitHub, and re-submit for an updated score."}
            {attempt > 1 && ` This will be attempt #${attempt + 1}.`}
          </p>
          <Button variant="secondary" onClick={onResubmit}>
            Re-submit for review
          </Button>
        </div>
      )}
    </div>
  );
}
