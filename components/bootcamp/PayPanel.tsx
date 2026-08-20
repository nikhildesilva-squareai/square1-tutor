"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/bootcamp/pricing";

/**
 * What an accepted applicant owes, and how long they have to pay it.
 *
 * DELIBERATELY NOT A CHECKOUT BUTTON. Stripe is not wired yet, and a button that
 * looks like it takes payment but does not is worse than no button: the student
 * believes their seat is secured, stops acting, and finds out it lapsed. Until
 * checkout exists this panel is honest about the mechanism — real amounts, real
 * deadline, a real way to reach a human.
 *
 * The plan toggle is display-only on purpose. Which plan they pick is recorded
 * when the payment is taken, by the desk or later by Stripe — never by a
 * client-side choice, because the amount owed is a server decision.
 */
export function PayPanel({
  dueCents,
  daysLeft,
  fullCents,
  threePart,
  cohortStarts,
}: {
  dueCents: number;
  daysLeft: number;
  fullCents: number;
  threePart: number[];
  cohortStarts: string;
}) {
  const [plan, setPlan] = useState<"full" | "three_part">("full");
  const threePartTotal = threePart.reduce((a, b) => a + b, 0);
  const saving = threePartTotal - fullCents;
  const dueNow = plan === "full" ? fullCents : threePart[0];

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
        <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
          Card checkout is not open yet. Reply to your acceptance email, or write to{" "}
          <a href="mailto:admissions@square1ai.com" className="text-brand font-medium hover:underline">
            admissions@square1ai.com
          </a>
          , and we will send payment details and confirm your seat by hand. Your offer will not
          lapse while we are mid-conversation — tell us and we will hold it.
        </p>
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
