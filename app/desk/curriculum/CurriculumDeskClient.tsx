"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshCw, Inbox, Check, X, Undo2, ExternalLink, AlertTriangle } from "lucide-react";
import type { CurriculumFinding } from "@/lib/curriculum-currency";

// ═══════════════════════════════════════════════════════════════════════════════
// Curriculum review desk. The agent proposes that a lesson has gone stale; a
// human decides. Accepting records the decision — it does not edit the lesson,
// because a curriculum change should be a deliberate act, not a side effect of
// clearing a queue.
//
// Deliberately the same shape as the newsroom desk: decide from the row, no
// need to open anything, because a queue you have to expand is a queue that
// does not get cleared.
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = "open" | "accepted" | "dismissed";

const TAB_LABEL: Record<Tab, string> = {
  open: "Needs a decision",
  accepted: "Accepted",
  dismissed: "Dismissed",
};

const KIND_LABEL: Record<string, string> = {
  stale: "Stale",
  gap: "Gap",
  contradicted: "Contradicted",
};

const SEVERITY_STYLE: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function CurriculumDeskClient() {
  const [findings, setFindings] = useState<CurriculumFinding[]>([]);
  const [tab, setTab] = useState<Tab>("open");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/curriculum/desk");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFindings(data.findings ?? []);
    } catch {
      setError("Could not load findings.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function transition(id: string, action: "accept" | "dismiss" | "reopen") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/curriculum/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("That didn't save. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function runPass() {
    setRunning(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/curriculum/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      const r = data.result ?? {};
      setNote(
        `Read ${r.storiesAnalysed ?? 0} of ${r.storiesConsidered ?? 0} stories — ` +
        `${r.findingsFiled ?? 0} new finding${r.findingsFiled === 1 ? "" : "s"}` +
        (r.duplicatesSkipped ? `, ${r.duplicatesSkipped} already open` : "") +
        `. Most stories should produce nothing.`
      );
      await load();
    } catch {
      setError("The pass didn't complete. Check the logs.");
    } finally {
      setRunning(false);
    }
  }

  const counts: Record<Tab, number> = {
    open: findings.filter((f) => f.status === "open").length,
    accepted: findings.filter((f) => f.status === "accepted").length,
    dismissed: findings.filter((f) => f.status === "dismissed").length,
  };
  const shown = findings.filter((f) => f.status === tab);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-ink">Curriculum currency</h1>
          <p className="mt-1 text-sm text-ink-muted max-w-xl">
            The agent reads each morning&apos;s stories against the lessons of the courses
            they were tagged with, and flags anything that looks out of date. It does
            not change lessons — accepting a finding records the decision.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={running} onClick={runPass}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${running ? "animate-spin" : ""}`} aria-hidden />
          {running ? "Reading…" : "Run a pass now"}
        </Button>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface border border-border mb-5">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tab === t ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink"}`}>
            {TAB_LABEL[t]}
            <span className={`ml-1.5 tabular-nums ${tab === t ? "text-white/80" : "text-ink-muted/70"}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {note && (
        <div className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-ink" role="status">{note}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>
      )}

      {!loaded ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-surface animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-3 w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
            <Inbox className="h-5 w-5 text-brand" aria-hidden />
          </div>
          <p className="text-sm font-bold text-ink mb-1">
            {tab === "open" ? "Nothing needs a decision" : `Nothing ${tab} yet`}
          </p>
          <p className="text-sm text-ink-muted max-w-sm mx-auto">
            {tab === "open"
              ? "An empty queue is the expected result most days — the agent is tuned to stay quiet unless a story really does date a lesson."
              : "Findings you act on will appear here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((f) => (
            <li key={f.id}
              className={`rounded-2xl border border-border border-l-4 bg-surface overflow-hidden ${
                f.severity === "high" ? "border-l-red-400"
                : f.severity === "medium" ? "border-l-amber-400"
                : "border-l-slate-300"}`}>
              <div className="flex items-start gap-2 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-2">
                    <span className={`px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.low}`}>
                      {f.severity}
                    </span>
                    <span className="text-brand">{KIND_LABEL[f.kind] ?? f.kind}</span>
                    <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
                    <span className="text-ink-muted normal-case tracking-normal">{f.course_slug}</span>
                  </div>

                  <p className="text-sm font-bold text-ink leading-snug">{f.summary}</p>

                  {f.lesson_title ? (
                    <p className="mt-1.5 text-xs text-ink-muted">
                      Lesson: <span className="font-semibold text-ink">{f.lesson_title}</span>
                    </p>
                  ) : (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      No lesson covers this — proposed gap
                    </p>
                  )}

                  <p className="mt-2.5 text-[13px] text-ink-muted leading-relaxed">{f.detail}</p>

                  {/* Evidence is the whole basis of the claim, so it is shown in
                      the row rather than hidden behind an expand. */}
                  {f.evidence_url && (
                    <a href={f.evidence_url} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                      <ExternalLink className="h-3 w-3" aria-hidden />
                      {f.evidence_headline ?? "Source"}
                      {f.evidence_outlet && <span className="text-ink-muted font-normal">— {f.evidence_outlet}</span>}
                    </a>
                  )}

                  {f.reviewed_by && f.status !== "open" && (
                    <p className="mt-2 text-[11px] text-ink-muted">
                      {f.status === "accepted" ? "Accepted" : "Dismissed"} by {f.reviewed_by}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {f.status === "open" ? (
                    <>
                      <button type="button" onClick={() => transition(f.id, "accept")} disabled={busy === f.id}
                        title="Accept — this is a real gap worth acting on"
                        aria-label={`Accept: ${f.summary}`}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        {busy === f.id ? "…" : <><Check className="h-3.5 w-3.5" aria-hidden />Accept</>}
                      </button>
                      <button type="button" onClick={() => transition(f.id, "dismiss")} disabled={busy === f.id}
                        title="Dismiss — not a real problem"
                        aria-label={`Dismiss: ${f.summary}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-ink-muted hover:border-red-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => transition(f.id, "reopen")} disabled={busy === f.id}
                      title="Move back to the queue"
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface text-xs font-bold text-ink-muted hover:text-ink disabled:opacity-40 transition-colors">
                      <Undo2 className="h-3.5 w-3.5" aria-hidden />Reopen
                    </button>
                  )}
                </div>
              </div>

              {f.lesson_id && f.status === "accepted" && (
                <div className="border-t border-border bg-surface-soft px-5 py-3">
                  <Link href={`/courses/${f.course_slug}`}
                    className="text-xs font-semibold text-brand hover:underline">
                    Open {f.course_slug} to make the change →
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
