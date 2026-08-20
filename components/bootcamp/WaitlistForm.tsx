"use client";

import { useState } from "react";

/**
 * The lowest-friction thing on the funnel: one field.
 *
 * No name, no account, no "what's your experience level" — every extra field
 * costs signups, and all we actually need is somewhere to send the link when the
 * cohort opens. The timezone rides along silently because we already know it
 * client-side and it tells us which band to open next.
 */
export function WaitlistForm({ slug, label }: { slug: string; label: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    setMessage(null);
    try {
      let timeZone: string | undefined;
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch { /* not worth failing a signup over */ }

      const res = await fetch("/api/bootcamp/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: email.trim(), timeZone }),
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
      <p className="mt-6 text-sm rounded-[8px] bg-success-bg text-success px-4 py-3 max-w-md">
        You&rsquo;re on the list. We will email you the application link the day it opens —
        before it goes public.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-md">
      <label htmlFor="waitlist-email" className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-2 flex flex-col sm:flex-row gap-2">
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-[8px] border border-border bg-surface px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-[8px] bg-brand text-white font-semibold text-sm px-5 py-2.5 disabled:opacity-50 hover:opacity-90 transition whitespace-nowrap"
        >
          {state === "sending" ? "Adding…" : "Notify me"}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-error">{message}</p>}
      <p className="mt-2 text-xs text-ink-muted">
        One email when this cohort opens. Nothing else, and no account needed.
      </p>
    </form>
  );
}
