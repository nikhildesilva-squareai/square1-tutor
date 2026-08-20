"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/bootcamp/pricing";

/**
 * What an accepted applicant owes, and how long they have to pay it.
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
 * The plan choice is sent to the server, which decides the amount from it and
 * from the student's own region. The figure shown here is a display of that
 * decision, never an input to it.
 */
export function PayPanel({
  applicationId,
  dueCents,
  daysLeft,
  fullCents,
  threePart,
  cohortStarts,
}: {
  applicationId: string;
  dueCents: number;
  daysLeft: number;
  fullCents: number;
  threePart: number[];
  cohortStarts: string;
}) {
  const [plan, setPlan] = useState<"full" | "three_part">("full");
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threePartTotal = threePart.reduce((a, b) => a + b, 0);
  const saving = threePartTotal - fullCents;
  const dueNow = plan === "full" ? fullCents : threePart[0];

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, plan }),
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

      <h2 className="mt-2 font-semibold">Choose how you want to pay</h2>
      <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
        There is no deposit — the offer itself is what holds your seat, which is why it has a
        deadline. Once this is paid your place in the cohort starting {cohortStarts} is
        confirmed.
      </p>

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPlan("full")}
          className={`text-left rounded-[10px] border p-4 transition ${
            plan === "full" ? "border-brand bg-surface-tint" : "border-border hover:border-brand"
          }`}
        >
          <p className="font-semibold text-sm">Pay in full</p>
          <p className="mt-1 text-2xl font-bold">{formatUsd(fullCents)}</p>
          <p className="mt-1 text-xs text-success font-semibold">
            Saves {formatUsd(saving)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setPlan("three_part")}
          className={`text-left rounded-[10px] border p-4 transition ${
            plan === "three_part" ? "border-brand bg-surface-tint" : "border-border hover:border-brand"
          }`}
        >
          <p className="font-semibold text-sm">Three payments</p>
          <p className="mt-1 text-2xl font-bold">{formatUsd(threePart[0])}</p>
          <p className="mt-1 text-xs text-ink-muted">
            then {formatUsd(threePart[1])} at week 4 and {formatUsd(threePart[2])} at week 8 ·{" "}
            {formatUsd(threePartTotal)} total
          </p>
        </button>
      </div>

      <div className="mt-5 rounded-[10px] bg-surface-alt border border-border p-4">
        <p className="text-sm">
          <span className="text-ink-secondary">Due now to confirm your seat: </span>
          <span className="font-bold">{formatUsd(dueNow)}</span>
        </p>

        {manual ? (
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
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
              className="mt-3 w-full sm:w-auto rounded-[8px] bg-brand text-white font-semibold text-sm px-6 py-3 hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy ? "Opening checkout…" : `Pay ${formatUsd(dueNow)} and confirm my seat`}
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
        {dueCents !== dueNow && (
          <>
            The amount charged is decided by us at the point of payment, not by this page.{" "}
          </>
        )}
        Full refund if you withdraw within two weeks of the cohort starting.
      </p>
    </div>
  );
}
