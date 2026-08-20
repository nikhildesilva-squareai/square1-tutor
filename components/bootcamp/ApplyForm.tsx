"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  localSessionTime,
  confirmationSentence,
  isValidTimeZone,
} from "@/lib/bootcamp/localtime";

// A short list covering the bands we actually sell into. The browser's own answer
// is authoritative and always offered first — this is only for someone who is
// travelling, on a VPN, or about to relocate.
const COMMON_ZONES = [
  "Asia/Colombo", "Asia/Kolkata", "Asia/Karachi", "Asia/Dhaka", "Asia/Kathmandu",
  "Asia/Dubai", "Asia/Singapore", "Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg",
  "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles",
  "Australia/Sydney", "Pacific/Auckland", "UTC",
];

interface Props {
  slug: string;
  cohortId: string;
  cohortTimeZone: string;
  /** Instant of the first live class, ISO. Computed server-side from the band anchor. */
  firstClassISO: string;
  weeks: number;
  hoursPerWeek: number;
}

export function ApplyForm({
  slug, cohortId, cohortTimeZone, firstClassISO, weeks, hoursPerWeek,
}: Props) {
  // The browser is the ONLY authoritative source for the visitor's timezone.
  // An IP guess is confidently wrong for anyone travelling, and being confidently
  // wrong about the class hour is the mistake this whole screen exists to prevent.
  const detected = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz && isValidTimeZone(tz) ? tz : cohortTimeZone;
    } catch {
      return cohortTimeZone;
    }
  }, [cohortTimeZone]);

  const [timeZone, setTimeZone] = useState(detected);
  const [confirmed, setConfirmed] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [hours, setHours] = useState<number | "">("");
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const slot = useMemo(
    () => localSessionTime(firstClassISO, timeZone, cohortTimeZone),
    [firstClassISO, timeZone, cohortTimeZone],
  );

  const zoneOptions = useMemo(() => {
    const set = new Set([detected, ...COMMON_ZONES]);
    return [...set];
  }, [detected]);

  // Consent is a hard gate, not a nicety: every live class is recorded and the
  // viva recording is what backs the credential. Someone who will not be
  // recorded cannot do the programme, and finding that out after they have paid
  // would be our failure, not theirs.
  const canSubmit =
    confirmed && recordingConsent && typeof hours === "number" && hours >= 1 && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bootcamp/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohortId,
          timeZone,
          hoursCommitted: hours,
          motivation: motivation.trim() || undefined,
          localTimeConfirmed: confirmed,
          recordingConsent,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/bootcamp/application/${body.applicationId}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* ── ST-01: the class hour, in THEIR timezone, before any money ───────── */}
      <section className="bg-surface border border-brand rounded-[12px] p-6 shadow-sm">
        <p className="text-[11px] font-semibold text-brand uppercase tracking-widest">
          Step 1 — check you can actually be there
        </p>

        <p className="mt-4 text-2xl font-bold tracking-tight">{slot.sentence}</p>
        <p className="mt-1 text-sm text-ink-secondary">
          in {timeZone}
          {slot.dayShift !== 0 && (
            <span className="ml-2 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-warning-bg text-[#8a6d0b]">
              {slot.dayShift > 0 ? "the day after" : "the day before"} the cohort&rsquo;s{" "}
              day
            </span>
          )}
        </p>

        {slot.unsociable && (
          <p className="mt-3 text-sm rounded-[8px] bg-warning-bg text-[#8a6d0b] px-3 py-2 leading-relaxed">
            That is an unusual hour where you are. Classes run every week for {weeks} weeks —
            please be honest with yourself about whether you can make it.
          </p>
        )}

        <label className="mt-5 block">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Not your timezone?
          </span>
          <select
            value={timeZone}
            onChange={(e) => { setTimeZone(e.target.value); setConfirmed(false); }}
            className="mt-1.5 w-full max-w-sm rounded-[8px] border border-border bg-surface px-3 py-2 text-sm"
          >
            {zoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}{tz === detected ? " (detected)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-5 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#0056CE]"
          />
          <span className="text-sm text-ink leading-relaxed">
            {confirmationSentence(slot)}{" "}
            <strong>I can attend at that time each week.</strong>
          </span>
        </label>
      </section>

      {/* ── commitment ───────────────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-[12px] p-6 shadow-sm">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Step 2 — the hours
        </p>
        <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
          This programme is built around about <strong>{hoursPerWeek} hours a week</strong>.
          Tell us honestly what you can give it — under-committing and telling us is far
          better than over-committing and disappearing in week 5.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-medium">Hours a week you can genuinely commit</span>
          <input
            type="number" min={1} max={80} required
            value={hours}
            onChange={(e) => setHours(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1.5 w-32 rounded-[8px] border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-5 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={recordingConsent}
            onChange={(e) => setRecordingConsent(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#0056CE]"
          />
          <span className="text-sm text-ink leading-relaxed">
            I understand that <strong>live classes are recorded</strong> so the cohort can
            review them, and that my <strong>end-of-programme viva is recorded</strong> because
            it is the evidence behind the credential.{" "}
            <span className="text-ink-secondary">
              Recordings are shown to your cohort and kept as proof of your work — never sold,
              and never used in advertising without asking you first.
            </span>
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-medium">
            What do you want out of this? <span className="text-ink-muted font-normal">(optional)</span>
          </span>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value.slice(0, 4000))}
            rows={4}
            placeholder="A job in this field, a promotion, a specific project you want to build…"
            className="mt-1.5 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm leading-relaxed"
          />
          <span className="mt-1 block text-xs text-ink-muted">{motivation.length}/4000</span>
        </label>
      </section>

      {error && (
        <p className="text-sm rounded-[8px] bg-error-bg text-error px-3 py-2">{error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-[8px] bg-brand text-white font-semibold text-sm px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {submitting ? "Sending…" : "Submit application"}
        </button>
        <p className="mt-3 text-xs text-ink-muted max-w-md leading-relaxed">
          Applying is free and commits you to nothing. Next you will take a short
          assessment — if you are not ready for this track yet, we will tell you before
          you pay anything.
        </p>
        {!confirmed && (
          <p className="mt-2 text-xs text-ink-muted">
            Tick the box above to continue — we will not sell you a seat you cannot attend.
          </p>
        )}
      </div>
    </form>
  );
}
