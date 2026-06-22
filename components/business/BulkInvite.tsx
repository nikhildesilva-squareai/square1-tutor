"use client";

import { useState } from "react";

/**
 * BulkInvite — the post-pay "invite your team" control. Paste emails (any
 * separator), one POST to /api/org/invite. Seat-aware. Used in the manager portal
 * and (once Stripe is live) the checkout success screen.
 */
export function BulkInvite({ seatsLeft, courses = [] }: { seatsLeft: number; courses?: { slug: string; title: string }[] }) {
  const [raw, setRaw] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
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
        body: JSON.stringify(courseSlug ? { emails, courseSlug } : { emails }),
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
        className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus:border-brand resize-none"
      />
      {courses.length > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <label className="text-[11px] font-semibold text-slate-500">Assign a track</label>
          <select
            value={courseSlug}
            onChange={(e) => setCourseSlug(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus:border-brand"
          >
            <option value="">Let them choose</option>
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
        <p className="text-[11px] text-slate-500">
          Commas or new lines. {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left.
        </p>
        <button
          onClick={submit}
          disabled={busy || seatsLeft <= 0}
          className="px-5 h-10 rounded-lg text-white text-sm font-bold disabled:opacity-60 hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg,#0056CE,#01224F)" }}
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
