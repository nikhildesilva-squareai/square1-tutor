"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Four buttons and a reason box. Nothing clever.
 *
 * Rejection requires a reason before the button will fire — the server enforces
 * it too, but making the UI refuse first means nobody types one under protest
 * after being told off. "Why did we turn this person down" should never be a
 * question the record cannot answer.
 */
export function DecisionButtons({
  applicationId,
  seatsLeft,
}: {
  applicationId: string;
  seatsLeft: number;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function decide(decision: string) {
    if (decision === "rejected" && !reason.trim()) {
      setError("A rejection needs a reason. It goes in the permanent record.");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, decision, reason: reason.trim() || undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Could not save the decision.");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(null);
    }
  }

  const OPTIONS: { key: string; label: string; cls: string; disabled?: boolean }[] = [
    { key: "accepted",   label: "Accept",   cls: "bg-success text-white", disabled: seatsLeft <= 0 },
    { key: "waitlisted", label: "Waitlist", cls: "border border-border" },
    { key: "deferred",   label: "Defer",    cls: "border border-border" },
    { key: "rejected",   label: "Reject",   cls: "border border-error text-error" },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 2000))}
        placeholder="Reason — required to reject, recorded either way"
        className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => decide(o.key)}
            disabled={busy !== null || o.disabled}
            title={o.disabled ? "No seats left — waitlist instead" : undefined}
            className={`rounded-[8px] px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition ${o.cls}`}
          >
            {busy === o.key ? "Saving…" : o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
