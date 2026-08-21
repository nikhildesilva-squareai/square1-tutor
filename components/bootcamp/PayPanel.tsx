"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/bootcamp/pricing";

/**
 * What an accepted applicant owes, and how long they have to pay it.
 *
 * ONE PAYMENT, ONE PRICE. The three-part plan was removed on 2026-08-21, so
 * there is no plan to choose and no "saves $X" to compute — a saving is only
 * meaningful against an alternative, and there is no longer an alternative.
 *
 * The button opens Stripe Checkout when the keys are present. When they are not,
 * the server answers 503 with `unconfigured` and this falls back to the manual
 * route — write to admissions, we take a transfer and mark it paid by hand.
 *
 * That fallback is not a placeholder to delete later: Cohort 1 runs concierge,
 * and a bank transfer must stay as real as a card charge. What it must never be
 * is a button that LOOKS like checkout and silently does nothing — the student
 * would believe the seat was secured, stop acting, and find out when it lapsed.
 *
 * The amount shown is a display of a server decision, never an input to it. The
 * checkout route takes no amount and no plan from the client at all.
 */
export function PayPanel({
  applicationId,
  dueCents,
  daysLeft,
  cohortStarts,
}: {
  applicationId: string;
  dueCents: number;
  daysLeft: number;
  cohortStarts: string;
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
        body: JSON.stringify({ applicationId }),
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

  return (
    <div className="mt-8 rounded-[12px] border border-brand bg-surface p-6 shadow-sm max-w-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-brand uppercase tracking-widest">
          Next step — secure your seat
        </p>
        <p
          className={`text-[11px] font-semibold uppercase tracking-widest ${
            daysLeft <= 2 ? "text-error" : "text-ink-muted"
          }`}
        >
          {daysLeft === 0
            ? "Expires today"
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
        </p>
      </div>

      <h2 className="mt-2 font-semibold">Pay your tuition and confirm your place</h2>
      <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
        There is no deposit — the offer itself is what holds your seat, which is why it has a
        deadline. One payment, nothing after it. Once this is paid your place in the cohort
        starting {cohortStarts} is confirmed.
      </p>

      <div className="mt-5 rounded-[10px] bg-surface-alt border border-border p-5">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Tuition in full
        </p>
        <p className="mt-1 text-4xl font-bold">{formatUsd(dueCents)}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Six months, live. Nothing further to pay.
        </p>

        {manual ? (
          <p className="mt-4 text-sm text-ink-secondary leading-relaxed">
            Card checkout is not open yet. Reply to your acceptance email, or write to{" "}
            <a href="mailto:admissions@square1ai.com" className="text-brand font-medium hover:underline">
              admissions@square1ai.com
            </a>
            , and we will send payment details and confirm your seat by hand. Your offer will not
            lapse while we are mid-conversation — tell us and we will hold it.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={pay}
              disabled={busy}
              className="mt-4 w-full sm:w-auto rounded-[8px] bg-brand text-white font-semibold text-sm px-6 py-3 hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy ? "Opening checkout…" : `Pay ${formatUsd(dueCents)} and confirm my seat`}
            </button>
            <p className="mt-2 text-xs text-ink-muted">
              Secure payment via Stripe. Prefer a bank transfer?{" "}
              <a href="mailto:admissions@square1ai.com" className="text-brand hover:underline">
                Write to admissions
              </a>
              .
            </p>
          </>
        )}

        {error && <p className="mt-2 text-sm text-error font-medium">{error}</p>}
      </div>

      <p className="mt-4 text-xs text-ink-muted leading-relaxed">
        Full refund if you withdraw within two weeks of the cohort starting.
      </p>
    </div>
  );
}
