"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Records a payment taken outside the product (bank transfer, card by phone) and
 * turns an accepted application into a real enrolment.
 *
 * The amount is NOT sent from here. The server derives it from the plan and the
 * student's own region, so a tampered request cannot enrol anyone for a dollar,
 * and the desk cannot fat-finger a price either. This component only says WHICH
 * plan was paid — the ledger row and the enrolment are the server's business.
 *
 * When Stripe lands, its webhook calls the same route and this button becomes a
 * fallback for the payments that never go through a card.
 */
export function MarkPaidButton({ applicationId }: { applicationId: string }) {
  const [plan, setPlan] = useState<"full" | "three_part">("full");
  const [providerRef, setProviderRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function markPaid() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          plan,
          provider: "manual",
          providerRef: providerRef.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Could not record the payment.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-[8px] border border-border font-semibold text-xs px-4 py-2 hover:border-brand hover:text-brand transition"
      >
        Record a payment
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[10px] border border-border bg-surface-alt p-4">
      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        Record a payment
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["full", "three_part"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlan(p)}
            className={`rounded-[8px] border font-semibold text-xs px-3 py-1.5 transition ${
              plan === p ? "border-brand text-brand bg-surface" : "border-border hover:border-brand"
            }`}
          >
            {p === "full" ? "Paid in full" : "First of three"}
          </button>
        ))}
      </div>

      <input
        value={providerRef}
        onChange={(e) => setProviderRef(e.target.value)}
        placeholder="Bank reference or receipt number (optional)"
        className="mt-3 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs"
      />

      <p className="mt-2 text-[11px] text-ink-muted leading-relaxed">
        The amount is worked out by the server from the plan and the student&rsquo;s region — it is
        not taken from this form. Recording the same payment twice is harmless.
      </p>

      {error && <p className="mt-2 text-xs text-error font-medium">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={markPaid}
          className="rounded-[8px] bg-brand text-white font-semibold text-xs px-4 py-2 hover:opacity-90 disabled:opacity-50 transition"
        >
          {busy ? "Recording…" : "Record and enrol"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => { setOpen(false); setError(null); }}
          className="rounded-[8px] border border-border font-semibold text-xs px-4 py-2 hover:border-brand transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
