"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The private feedback thread on a gate submission, plus the student's reply box.
 *
 * Grading everywhere else in this product is a one-shot AI verdict with nowhere
 * to answer back. Here the AI review is message #1, the student can push back on
 * it, and the instructor's sign-off lands in the SAME thread — so a student
 * reading their fail sees the reasoning and their own reply next to it rather
 * than a score in one place and an email in another.
 *
 * Visibility is not this component's job and never should be: RLS policy
 * s1_owns_submission scopes reads to the submission's owner, and the guard
 * trigger stamps authorship on write (migration 021). This just renders.
 */

export interface ThreadMessageView {
  id: string;
  authorKind: "ai" | "instructor" | "student";
  bodyMd: string;
  createdAt: string;
}

const AUTHOR: Record<string, { label: string; cls: string }> = {
  ai:         { label: "Automated review", cls: "bg-surface-alt text-ink-secondary" },
  instructor: { label: "Instructor",       cls: "bg-surface-tint text-brand" },
  student:    { label: "You",              cls: "bg-brand text-white" },
};

export function GateFeedbackThread({
  submissionId,
  messages,
  canReply,
}: {
  submissionId: string | null;
  messages: ThreadMessageView[];
  canReply: boolean;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function send() {
    if (!submissionId || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/gates/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, body: body.trim() }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError(payload?.error ?? "Could not send that.");
        setBusy(false);
        return;
      }
      setBody("");
      setBusy(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Feedback thread
        </h2>
        <p className="text-xs text-ink-muted">
          Private to you, your mentor and the teaching desk
        </p>
      </div>

      {messages.length === 0 ? (
        <p className="mt-3 text-sm text-ink-secondary">
          Nothing here yet. When you submit, the automated review lands here first
          and your reviewer picks it up from the same thread.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {messages.map((m) => {
            const who = AUTHOR[m.authorKind] ?? AUTHOR.ai;
            return (
              <li key={m.id} className="border-l-2 border-border pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${who.cls}`}>
                    {who.label}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {new Date(m.createdAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {/* Deliberately plain text, not rendered markdown: this thread
                    carries instructor-authored and AI-authored prose, and the
                    2026-07-29 audit's XSS finding is not worth reopening for
                    bold text. */}
                <p className="mt-1.5 text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                  {m.bodyMd}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {canReply && submissionId && (
        <div className="mt-5 pt-4 border-t border-border">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 20000))}
            rows={3}
            placeholder="Reply — disagree with the review, ask what a comment meant, or say what you changed."
            className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={busy || !body.trim()}
              className="rounded-[8px] bg-brand text-white px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {busy ? "Sending…" : "Send"}
            </button>
            <span className="text-xs text-ink-muted">
              Your reviewer is notified in their queue.
            </span>
          </div>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
      )}
    </section>
  );
}
