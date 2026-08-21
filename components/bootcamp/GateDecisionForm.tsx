"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The human sign-off. Three buttons and a reasons box.
 *
 * A FAIL WILL NOT FIRE WITHOUT REASONS, here and again on the server. The UI
 * refuses first so nobody types an explanation under protest after being told
 * off, and the server refuses regardless so the rule does not live in a
 * component. The text is not an internal note: it goes straight into the
 * student's feedback thread, which is where they will actually read it.
 *
 * "Pass" is the only control in the product that can clear a gate, and it exists
 * only behind an admin session. Automated scores inform this decision; they
 * never make it.
 */
export function GateDecisionForm({
  enrolmentId,
  gateId,
  studentName,
}: {
  enrolmentId: string;
  gateId: string;
  studentName: string;
}) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function decide(decision: "passed" | "failed" | "waived") {
    if (decision !== "passed" && !notes.trim()) {
      setError(
        decision === "failed"
          ? "A fail needs written reasons — the student reads them."
          : "A waiver needs a reason. It goes in the permanent record.",
      );
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/gates/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrolmentId,
          gateId,
          decision,
          notes: notes.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Could not save the decision.");
        setBusy(null);
        return;
      }
      setNotes("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 20000))}
        rows={3}
        placeholder={`Written feedback for ${studentName} — required to fail or waive, posted to their thread either way`}
        className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-ink"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("passed")}
          disabled={busy !== null}
          className="rounded-[8px] bg-success text-white px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition"
        >
          {busy === "passed" ? "Saving…" : "Pass"}
        </button>
        <button
          type="button"
          onClick={() => decide("failed")}
          disabled={busy !== null}
          className="rounded-[8px] border border-error text-error px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition"
        >
          {busy === "failed" ? "Saving…" : "Fail with reasons"}
        </button>
        <button
          type="button"
          onClick={() => decide("waived")}
          disabled={busy !== null}
          className="rounded-[8px] border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition"
        >
          {busy === "waived" ? "Saving…" : "Waive"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
