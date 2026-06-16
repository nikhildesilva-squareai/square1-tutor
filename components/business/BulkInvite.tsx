"use client";

import { useState } from "react";

/**
 * BulkInvite — the post-pay "invite your team" control. Paste emails (any
 * separator), one POST to /api/org/invite. Seat-aware. Used in the manager portal
 * and (once Stripe is live) the checkout success screen.
 */
export function BulkInvite({ seatsLeft }: { seatsLeft: number }) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ invited: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    const emails = Array.from(new Set(raw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)));
    if (emails.length === 0) { setError("Add at least one email."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/org/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send invites");
      setResult({ invited: data.invited, skipped: data.skipped });
      setRaw("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={3}
        placeholder="alex@company.com, sam@company.com …"
        className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
      />
      <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
        <p className="text-[11px] text-slate-400">
          Commas or new lines. {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left.
        </p>
        <button
          onClick={submit}
          disabled={busy || seatsLeft <= 0}
          className="px-5 h-10 rounded-lg text-white text-sm font-bold disabled:opacity-60 hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)" }}
        >
          {busy ? "Sending…" : "Send invites"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {result && (
        <p className="text-sm text-emerald-700 mt-2">
          ✓ {result.invited} invite{result.invited !== 1 ? "s" : ""} sent
          {result.skipped > 0 ? ` · ${result.skipped} skipped (already invited or no seats)` : ""}.
        </p>
      )}
    </div>
  );
}
