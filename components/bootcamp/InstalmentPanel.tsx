"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/bootcamp/pricing";

/**
 * The next instalment for a student already enrolled on the three-part plan.
 *
 * Separate from PayPanel on purpose. PayPanel is about SECURING A SEAT — it has
 * a plan choice, an expiring offer and the language of admission. This is about
 * an ordinary payment on a programme someone is already inside: no plan choice
 * (that was made), no seat at risk, and a much quieter tone.
 *
 * "Upcoming" renders nothing at all. A student four weeks from a payment does
 * not need a call to action on their status page every time they visit — that is
 * what the reminder email is for, once, when it is actually due.
 */
export function InstalmentPanel({
  applicationId,
  number,
  amountCents,
  dueDate,
  state,
  daysLate,
}: {
  applicationId: string;
  number: number;
  amountCents: number;
  dueDate: string;
  state: "upcoming" | "due" | "overdue";
  daysLate: number;
}) {
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, plan: "three_part" }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 503 || body?.unconfigured) {
        setManual(true);
        return;
      }
      if (!res.ok || !body?.url) {
        setError(body?.error ?? "Could not open checkout.");
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "upcoming") return null;

  const overdue = state === "overdue";

  return (
    <div
      className={`mt-6 rounded-[12px] border p-6 shadow-sm max-w-2xl ${
        overdue ? "border-error bg-error-bg" : "border-brand bg-surface"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-widest ${
          overdue ? "text-error" : "text-brand"
        }`}
      >
        {overdue ? "Payment overdue" : `Payment ${number} of 3 is due`}
      </p>

      <h2 className="mt-2 font-semibold">
        {formatUsd(amountCents)} — due {dueDate}
      </h2>

      <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
        {overdue
          ? `This was due ${daysLate} days ago and live class access is paused until it is settled. Your recordings, your submitted work and your place in the cohort are all untouched — nothing has been deleted and nothing has been given away.`
          : "We do not keep your card on file, so nothing is charged automatically — this needs a click from you."}
      </p>

      {manual ? (
        <p className="mt-4 text-sm text-ink-secondary leading-relaxed">
          Card checkout is not open yet. Write to{" "}
          <a href="mailto:admissions@square1ai.com" className="text-brand font-medium hover:underline">
            admissions@square1ai.com
          </a>{" "}
          and we will send payment details.
        </p>
      ) : (
        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className={`mt-4 rounded-[8px] font-semibold text-sm px-6 py-3 transition disabled:opacity-50 ${
            overdue
              ? "bg-error text-white hover:opacity-90"
              : "bg-brand text-white hover:opacity-90"
          }`}
        >
          {busy ? "Opening checkout…" : `Pay ${formatUsd(amountCents)}`}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-error font-medium">{error}</p>}

      <p className="mt-4 text-xs text-ink-muted leading-relaxed">
        Struggling to pay right now? Email us rather than dropping out — we would far
        rather rearrange the schedule than lose you over timing.
      </p>
    </div>
  );
}
