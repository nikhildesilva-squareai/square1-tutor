"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target, Check, CircleDashed, X, Minus, FileText, Mail, Mic,
  Copy, Loader2, ArrowRight, FolderGit2, Plus, Trash2, TrendingUp, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichContent } from "@/components/ui/rich-content";

// ═══════════════════════════════════════════════════════════════════════════════
// The job-hunt agent UI. One flow, three tools, all anchored to one pasted
// job posting:
//   1. Gap map     — requirement-by-requirement verdict against graded work
//   2. Documents   — CV / cover letter grounded ONLY in that work
//   3. Interview   — 5 role-specific questions, each answer scored /10
//
// Stateless server; this component holds the session. The JD survives a
// refresh via localStorage — losing a carefully pasted posting is rage-quit
// material.
// ═══════════════════════════════════════════════════════════════════════════════

type Inventory = {
  tracks: { title: string; done: number; total: number }[];
  projects: { title: string; score: number; maxScore: number; githubUrl: string }[];
  topicCount: number;
  isEmpty: boolean;
};

type Requirement = { req: string; status: string; evidence: string | null; closes: string | null; closesLessonId?: string | null };
type Analysis = { role: string; company: string | null; readiness: number; summary: string; requirements: Requirement[] };
type Question = { q: string; focus: string };
type Graded = { score: number; feedback: string; stronger: string[] };
type HistoryPoint = { at: string; readiness: number };
export type TargetSummary = {
  id: string; role: string; company: string | null;
  readiness: number; history: HistoryPoint[]; updated_at: string;
};

const JD_KEY = "s1-career-jd";

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((json as { error?: string }).error ?? `Request failed (${r.status})`);
  return json as T;
}

export function CareerClient({ firstName, inventory, initialTargets }: {
  firstName: string; inventory: Inventory; initialTargets: TargetSummary[];
}) {
  const [jd, setJd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [targets, setTargets] = useState<TargetSummary[]>(initialTargets);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const [draft, setDraft] = useState<{ kind: "cv" | "cover"; markdown: string } | null>(null);
  const [drafting, setDrafting] = useState<"cv" | "cover" | null>(null);
  const [copied, setCopied] = useState(false);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [grades, setGrades] = useState<Record<number, Graded>>({});
  const [grading, setGrading] = useState<number | null>(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(JD_KEY); if (saved) setJd(saved); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { if (jd) localStorage.setItem(JD_KEY, jd); } catch { /* ignore */ }
  }, [jd]);

  const jdReady = jd.trim().length >= 100;

  async function analyze() {
    if (!jdReady || analyzing) return;
    setError(null); setAnalyzing(true);
    setAnalysis(null); setDraft(null); setQuestions(null); setAnswers({}); setGrades({});
    try {
      const res = await post<{ analysis: Analysis; targetId: string | null; history: HistoryPoint[] }>(
        "/api/career/analyze",
        { jd: jd.trim(), ...(targetId ? { targetId } : {}) },
      );
      setAnalysis(res.analysis);
      setTargetId(res.targetId);
      setHistory(res.history ?? []);
      if (res.targetId) {
        const summary: TargetSummary = {
          id: res.targetId, role: res.analysis.role, company: res.analysis.company,
          readiness: res.analysis.readiness, history: res.history ?? [],
          updated_at: new Date().toISOString(),
        };
        setTargets((t) => [summary, ...t.filter((x) => x.id !== res.targetId)]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  async function loadTarget(id: string) {
    if (loadingTarget || analyzing) return;
    setError(null); setLoadingTarget(id);
    try {
      const r = await fetch(`/api/career/targets?id=${id}`);
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((json as { error?: string }).error ?? "Could not load this target");
      const t = (json as { target: TargetSummary & { jd: string; analysis: Analysis } }).target;
      setJd(t.jd);
      setAnalysis(t.analysis);
      setTargetId(t.id);
      setHistory(Array.isArray(t.history) ? t.history : []);
      setDraft(null); setQuestions(null); setAnswers({}); setGrades({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingTarget(null);
    }
  }

  function newTarget() {
    setJd(""); setAnalysis(null); setTargetId(null); setHistory([]);
    setDraft(null); setQuestions(null); setAnswers({}); setGrades({});
    try { localStorage.removeItem(JD_KEY); } catch { /* ignore */ }
  }

  async function removeTarget(id: string) {
    try {
      const r = await fetch(`/api/career/targets?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Could not delete");
      setTargets((t) => t.filter((x) => x.id !== id));
      if (targetId === id) newTarget();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function makeDraft(kind: "cv" | "cover") {
    if (drafting) return;
    setError(null); setDrafting(kind); setCopied(false);
    try {
      const res = await post<{ markdown: string }>("/api/career/draft", { jd: jd.trim(), kind });
      setDraft({ kind, markdown: res.markdown });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setDrafting(null);
    }
  }

  async function startInterview() {
    if (loadingQuestions) return;
    setError(null); setLoadingQuestions(true); setQuestions(null); setAnswers({}); setGrades({});
    try {
      const res = await post<{ questions: Question[] }>("/api/career/interview", { action: "questions", jd: jd.trim() });
      setQuestions(res.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function gradeAnswer(i: number) {
    const answer = (answers[i] ?? "").trim();
    if (!answer || grading !== null || !questions) return;
    setError(null); setGrading(i);
    try {
      const res = await post<Graded>("/api/career/interview", {
        action: "grade", jd: jd.trim(), question: questions[i].q, answer,
        role: analysis?.role, focus: questions[i].focus,
      });
      setGrades((g) => ({ ...g, [i]: res }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGrading(null);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try { await navigator.clipboard.writeText(draft.markdown); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  const statusIcon = (s: string) =>
    s === "met" ? <Check className="h-4 w-4 text-emerald-600" aria-hidden />
    : s === "partial" ? <CircleDashed className="h-4 w-4 text-amber-500" aria-hidden />
    : s === "missing" ? <X className="h-4 w-4 text-red-500" aria-hidden />
    : <Minus className="h-4 w-4 text-ink-muted" aria-hidden />;

  const statusLabel: Record<string, string> = {
    met: "Verified", partial: "Partly there", missing: "Gap", not_assessable: "Not assessable",
  };

  const gradedCount = Object.keys(grades).length;
  const avgScore = gradedCount > 0
    ? Math.round(Object.values(grades).reduce((a, g) => a + g.score, 0) / gradedCount * 10) / 10
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-xl bg-surface-tint border border-brand/20 flex items-center justify-center">
          <Target className="h-5 w-5 text-brand" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Career</h1>
          <p className="text-sm text-ink-secondary">
            Paste a real job posting, {firstName} — everything below is argued from your graded work, never invented.
          </p>
        </div>
      </div>

      {/* What the agent stands on */}
      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <p className="text-[10px] tracking-widest uppercase font-bold text-ink-muted mb-2">Your verified record — what the agent may claim</p>
        {inventory.isEmpty ? (
          <p className="text-sm text-ink-secondary">
            Nothing graded yet. Complete a lesson or submit a project first — this agent only argues from proof, so right now it has none.{" "}
            <Link href="/dashboard" className="text-brand font-semibold hover:underline">Start learning →</Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inventory.tracks.map((t) => (
              <span key={t.title} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary px-2.5 py-1 rounded-full bg-surface-alt border border-border">
                {t.title} · {t.done}/{t.total} lessons
              </span>
            ))}
            {inventory.projects.map((p) => (
              <a key={p.title} href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand px-2.5 py-1 rounded-full bg-surface-tint border border-brand/20 hover:border-brand/50 transition-colors">
                <FolderGit2 className="h-3 w-3" aria-hidden /> {p.title} · {p.score}/{p.maxScore}
              </a>
            ))}
            {inventory.topicCount > 0 && (
              <span className="inline-flex items-center text-xs font-semibold text-ink-secondary px-2.5 py-1 rounded-full bg-surface-alt border border-border">
                {inventory.topicCount} assessed topics
              </span>
            )}
          </div>
        )}
      </div>

      {/* Saved targets — click to reload, re-run to grow the readiness trend */}
      {targets.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-ink">Your job targets</p>
            <button onClick={newTarget}
              className="inline-flex items-center gap-1 text-xs font-bold text-ink-secondary hover:text-ink px-2 py-1 rounded-lg border border-border hover:bg-surface-alt transition-colors">
              <Plus className="h-3.5 w-3.5" aria-hidden /> New target
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {targets.map((t) => {
              const first = t.history?.[0]?.readiness;
              const grew = t.history && t.history.length >= 2 && t.readiness !== first;
              return (
                <div key={t.id}
                  className={cn("group relative rounded-xl border px-4 py-3 cursor-pointer transition-colors",
                    targetId === t.id ? "border-brand/50 bg-surface-tint" : "border-border bg-surface hover:bg-surface-alt")}
                  onClick={() => loadTarget(t.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink truncate">
                      {t.role}{t.company ? <span className="text-ink-secondary font-semibold"> · {t.company}</span> : null}
                    </p>
                    <span className="text-sm font-black text-brand tabular-nums shrink-0">
                      {grew && <span className="text-[11px] font-bold text-ink-muted mr-1"><s>{first}%</s> →</span>}
                      {t.readiness}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] text-ink-muted">
                      {loadingTarget === t.id ? "Loading…" : `${t.history?.length ?? 1}× analysed`}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTarget(t.id); }}
                      aria-label={`Delete target ${t.role}`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-muted hover:text-red-500 transition-all p-1">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JD input */}
      <div className="mt-6">
        <label htmlFor="career-jd" className="block text-sm font-bold text-ink mb-2">The job posting</label>
        <textarea
          id="career-jd"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job posting here — title, company, requirements, all of it."
          rows={8}
          className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-surface text-ink text-sm leading-relaxed focus:outline-none focus:border-brand resize-y"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={analyze}
            disabled={!jdReady || analyzing}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all disabled:opacity-40"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Target className="h-4 w-4" aria-hidden />}
            {analyzing ? "Reading the posting…" : targetId ? "Re-run — has my readiness moved?" : "Map it against my record"}
          </button>
          {!jdReady && jd.trim().length > 0 && (
            <span className="text-xs text-ink-muted">Paste the full posting — this looks like a fragment.</span>
          )}
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </div>

      {/* ── Gap map ── */}
      {analysis && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 card-fade-up">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Gap map</p>
              <h2 className="text-lg font-black text-ink">
                {analysis.role}{analysis.company ? <span className="text-ink-secondary font-bold"> · {analysis.company}</span> : null}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-brand tabular-nums leading-none">{analysis.readiness}%</p>
              <p className="text-[11px] text-ink-muted font-semibold mt-0.5">of the assessable bar</p>
              {history.length >= 2 && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  was {history[0].readiness}% when you first checked
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-ink-secondary leading-relaxed mb-5">{analysis.summary}</p>

          <ul className="space-y-2.5">
            {analysis.requirements.map((r, i) => (
              <li key={i} className="rounded-xl border border-border bg-surface-alt px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0">{statusIcon(r.status)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {r.req}
                      <span className={cn("ml-2 text-[10px] font-bold tracking-wide uppercase",
                        r.status === "met" ? "text-emerald-600" : r.status === "partial" ? "text-amber-600" : r.status === "missing" ? "text-red-500" : "text-ink-muted")}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </p>
                    {r.evidence && <p className="mt-1 text-xs text-ink-secondary leading-snug">Evidence: {r.evidence}</p>}
                    {r.closes && (r.closesLessonId ? (
                      <Link href={`/learn/${r.closesLessonId}`}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand px-2.5 py-1 rounded-full bg-surface-tint border border-brand/25 hover:border-brand/60 transition-colors">
                        <BookOpen className="h-3 w-3" aria-hidden />
                        Close this gap: {r.closes} →
                      </Link>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-brand">
                        Closes this: <span className="font-bold">{r.closes}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Next tools */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => makeDraft("cv")} disabled={drafting !== null}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand/90 transition-all disabled:opacity-40">
              {drafting === "cv" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
              Draft a CV for this role
            </button>
            <button onClick={() => makeDraft("cover")} disabled={drafting !== null}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-border bg-surface text-ink text-sm font-bold hover:bg-surface-alt transition-all disabled:opacity-40">
              {drafting === "cover" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
              Draft a cover letter
            </button>
            <button onClick={startInterview} disabled={loadingQuestions}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-border bg-surface text-ink text-sm font-bold hover:bg-surface-alt transition-all disabled:opacity-40">
              {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
              Practise the interview
            </button>
          </div>
        </div>
      )}

      {/* ── Draft output ── */}
      {draft && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 card-fade-up">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">
              {draft.kind === "cv" ? "CV draft — every claim links to graded work" : "Cover letter draft"}
            </p>
            <button onClick={copyDraft}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary hover:text-ink px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface-alt transition-colors">
              <Copy className="h-3.5 w-3.5" aria-hidden /> {copied ? "Copied" : "Copy Markdown"}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-surface-alt px-5 py-4">
            <RichContent content={draft.markdown} />
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">
            Bracketed sections like [Add your work history] are yours to fill in — the agent only writes what your graded record can prove.
          </p>
        </div>
      )}

      {/* ── Mock interview ── */}
      {questions && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 card-fade-up">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[10px] tracking-widest uppercase font-bold text-ink-muted">Mock interview — {analysis?.role ?? "this role"}</p>
            {avgScore !== null && (
              <span className="text-xs font-black text-brand tabular-nums">{gradedCount}/{questions.length} answered · avg {avgScore}/10</span>
            )}
          </div>
          <p className="text-sm text-ink-secondary mb-5">
            Answer out loud first if you can, then type what you said. Honest scoring — the gap gets named.
          </p>

          <ol className="space-y-5">
            {questions.map((q, i) => {
              const graded = grades[i];
              return (
                <li key={i} className="rounded-xl border border-border bg-surface-alt p-4">
                  <p className="text-sm font-bold text-ink leading-snug">
                    <span className="text-brand tabular-nums mr-1.5">{i + 1}.</span>{q.q}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wide">Probes: {q.focus}</p>
                  <textarea
                    value={answers[i] ?? ""}
                    onChange={(e) => { if (!graded) setAnswers((a) => ({ ...a, [i]: e.target.value })); }}
                    disabled={!!graded}
                    placeholder="Your answer…"
                    rows={3}
                    className="mt-3 w-full px-3.5 py-2.5 rounded-lg border-2 border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand resize-y disabled:opacity-70"
                  />
                  {!graded && (
                    <button onClick={() => gradeAnswer(i)}
                      disabled={grading !== null || !(answers[i] ?? "").trim()}
                      className="mt-2.5 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all disabled:opacity-40">
                      {grading === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                      {grading === i ? "Scoring…" : "Score my answer"}
                    </button>
                  )}
                  {graded && (
                    <div className={cn("mt-3 rounded-lg border px-4 py-3 text-sm card-fade-up",
                      graded.score >= 7 ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900"
                      : graded.score >= 4 ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900"
                      : "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900")}>
                      <p className="font-bold text-ink mb-1">{graded.score}/10</p>
                      <p className="text-ink-secondary leading-snug">{graded.feedback}</p>
                      {graded.stronger.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {graded.stronger.map((s, j) => (
                            <li key={j} className="text-xs text-ink-secondary flex gap-1.5">
                              <span className="text-brand font-bold shrink-0">+</span>{s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
