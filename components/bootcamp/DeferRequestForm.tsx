"use client";

import { useState } from "react";

/**
 * Ask to move to the next cohort (ST-40 — "without losing money or dignity").
 *
 * The entitlement rules are printed ON THE PAGE ABOVE this form, not revealed
 * after the request is sent. Somebody about to ask for help should already know
 * the answer to "what does this cost me" before they type — asking is the part
 * that takes nerve, and hiding the terms until afterwards is how a programme
 * ends up with people who quietly disappear instead.
 *
 * The request is recorded and read by a person. It changes nothing on its own,
 * and the copy says so.
 */
export function DeferRequestForm() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || state === "sending") return;
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/bootcamp/defer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-4 rounded-[8px] bg-success-bg text-success px-4 py-3 text-sm">
        Recorded. Your instructor will come back to you — normally at your next 1-1, and
        within three working days either way. Nothing has changed about your place in the
        meantime: keep going as far as you can.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-[8px] border border-border bg-surface text-ink font-semibold text-sm px-5 py-2.5 hover:border-brand transition"
      >
        Ask to defer to the next cohort
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="defer-reason" className="text-sm font-medium">
        What has happened? Your instructor reads this.
      </label>
      <textarea
        id="defer-reason"
        required
        rows={4}
        maxLength={2000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="A sentence or two is plenty. Anything that helps us work out the right timing."
        className="mt-2 w-full rounded-[8px] border border-border bg-surface px-3 py-2.5 text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-[8px] bg-brand text-white font-semibold text-sm px-5 py-2.5 hover:opacity-90 disabled:opacity-50 transition"
        >
          {state === "sending" ? "Sending…" : "Send the request"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setState("idle"); setMessage(null); }}
          className="rounded-[8px] border border-border text-ink-secondary text-sm px-4 py-2.5"
        >
          Cancel
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-error">{message}</p>}
      <p className="mt-2 text-xs text-ink-muted">
        This records a request. It does not move your seat, cancel anything or take any
        money — a person decides, and tells you.
      </p>
    </form>
  );
}
