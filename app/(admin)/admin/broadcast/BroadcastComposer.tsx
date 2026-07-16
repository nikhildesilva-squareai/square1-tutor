"use client";

import { useState } from "react";

export function BroadcastComposer({ recipientCount }: { recipientCount: number }) {
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && recipientCount > 0 && !sending;

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setResult({ ok: true, text: `Sent to ${data.sent} student${data.sent === 1 ? "" : "s"}.` });
      setMessage("");
      setConfirming(false);
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <label htmlFor="broadcast" className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-ink-muted">
        Message to all students
      </label>
      <textarea
        id="broadcast"
        value={message}
        onChange={(e) => { setMessage(e.target.value); setConfirming(false); setResult(null); }}
        rows={6}
        maxLength={4000}
        placeholder="e.g. Welcome to Square 1 AI! Your free early-access is live — take a skill check to get your personalised plan."
        className="w-full resize-none rounded-xl border border-border bg-surface-soft px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand"
      />
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
        <span>Appears in every student&apos;s Messages inbox and lights up their unread badge.</span>
        <span className="tabular-nums">{message.length}/4000</span>
      </div>

      {result && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
          {result.text}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Recipients: <span className="font-bold text-ink">{recipientCount}</span> student{recipientCount === 1 ? "" : "s"}
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={!canSend}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send broadcast
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">Send to all {recipientCount}?</span>
            <button
              onClick={() => setConfirming(false)}
              disabled={sending}
              className="h-10 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-ink-secondary transition-colors hover:bg-surface-alt disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {sending ? "Sending…" : `Confirm send`}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 border-t border-border pt-4 text-[11px] leading-relaxed text-ink-muted">
        This can&apos;t be undone — each student receives a copy in their inbox. It won&apos;t send an email; it&apos;s an in-app message from the Square 1 team.
      </p>
    </div>
  );
}
