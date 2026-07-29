"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

  const shown = articles.filter((a) => a.status === tab);
  const counts = {
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    rejected: articles.filter((a) => a.status === "rejected").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-black text-ink">Review queue</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Signed in as {reviewerEmail}. Nothing publishes without your click.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface border border-border">
          {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => { setTab(t); setOpenId(null); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${tab === t ? "bg-brand text-white" : "text-ink-muted hover:text-ink"}`}>
              {TAB_LABEL[t]} ({counts[t]})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loaded ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-sm font-bold text-ink mb-1">
            {tab === "draft" ? "Queue is clear" : `Nothing ${tab} yet`}
          </p>
          <p className="text-sm text-ink-muted">
            {tab === "draft"
              ? "New drafts land here when the morning pipeline runs."
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

  return (
    <li className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Summary row */}
      <button type="button" onClick={onToggle} className="w-full text-left px-5 py-4 hover:bg-surface-soft transition-colors">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-wider uppercase mb-1.5">
          <span className="text-brand">{NEWS_TOPICS[article.topic]?.label ?? article.topic}</span>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <span className="text-ink-muted">{NEWS_REGIONS[article.region]?.label ?? article.region}</span>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <span className="text-ink-muted">{article.sources.length} source{article.sources.length === 1 ? "" : "s"}</span>
          {article.sources.length === 0 && (
            <span className="text-red-600">⚠ can&apos;t publish without sources</span>
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
