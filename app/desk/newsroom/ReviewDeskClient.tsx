"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Inbox, CheckCircle2, XCircle } from "lucide-react";
import { NEWS_TOPICS, NEWS_REGIONS, type NewsArticle } from "@/lib/newsroom-meta";

// ═══════════════════════════════════════════════════════════════════════════════
// The review queue: drafts wait here until a human publishes or rejects them.
// Editing happens inline — the reviewer is an editor, not just an approver.
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = "draft" | "published" | "rejected";

const TAB_LABEL: Record<Tab, string> = {
  draft: "Awaiting review",
  published: "Published",
  rejected: "Rejected",
};

export function ReviewDeskClient({ reviewerEmail }: { reviewerEmail: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [tab, setTab] = useState<Tab>("draft");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/newsroom/desk");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load articles");
      setArticles(data.articles ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load articles");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function transition(id: string, action: "publish" | "reject" | "unpublish") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/newsroom/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update the article");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the article");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(id: string, patch: { headline: string; dek: string; body_md: string }) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/newsroom/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update", id,
          headline: patch.headline,
          dek: patch.dek || null,
          body_md: patch.body_md,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save the edit");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the edit");
    } finally {
      setBusy(null);
    }
  }

  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState<string | null>(null);

  // Manual pipeline run — same code path and same 12/day cap as the cron.
  async function fetchStories() {
    setFetching(true);
    setFetchNote(null);
    setError(null);
    try {
      const res = await fetch("/api/newsroom/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ingest" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Pipeline run failed");
      const s = data.summary;
      setFetchNote(
        s.drafted > 0
          ? `${s.drafted} new draft${s.drafted === 1 ? "" : "s"} to review (${s.skipped.duplicates} duplicates skipped).`
          : `No new drafts — ${s.candidates === 0 ? "nothing fresh that isn't already covered" : "the day's cap is reached or stories were unusable"}.`,
      );
      await load();
      setTab("draft");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline run failed");
    } finally {
      setFetching(false);
    }
  }

  const shown = articles.filter((a) => a.status === tab);
  const counts = {
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    rejected: articles.filter((a) => a.status === "rejected").length,
  };

  return (
    <div>
      {/* Header: identity + the one primary action (fetch) */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-ink tracking-tight">Review queue</h1>
          <p className="text-xs text-ink-muted mt-1">
            Signed in as <span className="font-semibold text-ink">{reviewerEmail}</span>. Nothing publishes without your click.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={fetchStories} disabled={fetching}>
          {fetching ? (
            <>
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />
              Fetching stories…
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Fetch today&apos;s stories
            </>
          )}
        </Button>
      </div>

      {/* Status tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface border border-border mb-5">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); setOpenId(null); }}
            aria-pressed={tab === t}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tab === t ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink"}`}>
            {TAB_LABEL[t]}
            <span className={`ml-1.5 tabular-nums ${tab === t ? "text-white/80" : "text-ink-muted/70"}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {fetchNote && (
        <div className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-ink" role="status">
          {fetchNote}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>
      )}

      {!loaded ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-3 w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
            {tab === "draft" ? <Inbox className="h-5 w-5 text-brand" aria-hidden />
              : tab === "published" ? <CheckCircle2 className="h-5 w-5 text-brand" aria-hidden />
              : <XCircle className="h-5 w-5 text-brand" aria-hidden />}
          </div>
          <p className="text-sm font-bold text-ink mb-1">
            {tab === "draft" ? "Queue is clear" : `Nothing ${tab} yet`}
          </p>
          <p className="text-sm text-ink-muted max-w-sm mx-auto">
            {tab === "draft"
              ? "New drafts land here when the morning pipeline runs — or fetch today's stories now."
              : "Articles you act on will appear here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => (
            <ArticleRow
              key={a.id}
              article={a}
              open={openId === a.id}
              busy={busy === a.id}
              onToggle={() => setOpenId(openId === a.id ? null : a.id)}
              onTransition={(action) => transition(a.id, action)}
              onSave={(patch) => saveEdit(a.id, patch)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ArticleRow({ article, open, busy, onToggle, onTransition, onSave }: {
  article: NewsArticle;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onTransition: (action: "publish" | "reject" | "unpublish") => void;
  onSave: (patch: { headline: string; dek: string; body_md: string }) => void;
}) {
  const [headline, setHeadline] = useState(article.headline);
  const [dek, setDek] = useState(article.dek ?? "");
  const [body, setBody] = useState(article.body_md);
  const dirty = headline !== article.headline || dek !== (article.dek ?? "") || body !== article.body_md;

  // Status is encoded in form (left accent stripe) as well as the tab the row
  // lives in, so a glance reads state without reading text.
  const stripe =
    article.status === "published" ? "border-l-emerald-400"
    : article.status === "rejected" ? "border-l-slate-300"
    : "border-l-brand";

  return (
    <li className={`rounded-2xl border border-border border-l-4 ${stripe} bg-surface overflow-hidden transition-shadow ${open ? "shadow-card" : ""}`}>
      {/* Summary row */}
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full text-left px-5 py-4 hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-1.5">
          <span className="text-brand">{NEWS_TOPICS[article.topic]?.label ?? article.topic}</span>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <span className="text-ink-muted">{NEWS_REGIONS[article.region]?.label ?? article.region}</span>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <span className="text-ink-muted">{article.sources.length} source{article.sources.length === 1 ? "" : "s"}</span>
          {article.sources.length === 0 && (
            <span className="inline-flex items-center gap-1 text-red-600 normal-case tracking-normal">
              <XCircle className="h-3 w-3" aria-hidden /> can&apos;t publish without sources
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-ink leading-snug">{article.headline}</p>
        {article.dek && <p className="text-xs text-ink-muted mt-1 line-clamp-1">{article.dek}</p>}
      </button>

      {/* Expanded editor */}
      {open && (
        <div className="border-t border-border px-5 py-4 space-y-3 bg-surface-soft">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Headline</span>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm font-semibold text-ink focus:outline-none focus:border-brand" />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Dek (standfirst)</span>
            <input value={dek} onChange={(e) => setDek(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-ink focus:outline-none focus:border-brand" />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Body (markdown)</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12}
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink font-mono leading-relaxed focus:outline-none focus:border-brand" />
          </label>

          {article.sources.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Sources</span>
              <ul className="mt-1 space-y-1">
                {article.sources.map((s, i) => (
                  <li key={i} className="text-xs text-ink-muted truncate">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{s.title}</a>
                    {" "}— {s.outlet}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {dirty && (
              <Button type="button" variant="secondary" size="sm" disabled={busy}
                onClick={() => onSave({ headline, dek, body_md: body })}>
                Save edits
              </Button>
            )}
            {article.status !== "published" && (
              <Button type="button" variant="primary" size="sm" disabled={busy || dirty}
                onClick={() => onTransition("publish")}
                title={dirty ? "Save your edits first" : undefined}>
                {busy ? "…" : "Publish"}
              </Button>
            )}
            {article.status === "published" && (
              <Button type="button" variant="secondary" size="sm" disabled={busy}
                onClick={() => onTransition("unpublish")}>
                Unpublish
              </Button>
            )}
            {article.status === "draft" && (
              <Button type="button" variant="ghost" size="sm" disabled={busy}
                onClick={() => onTransition("reject")}>
                Reject
              </Button>
            )}
            {dirty && <span className="text-[11px] text-ink-muted">Unsaved edits — save before publishing.</span>}
          </div>
        </div>
      )}
    </li>
  );
}
