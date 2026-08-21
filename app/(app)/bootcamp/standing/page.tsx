import Link from "next/link";
import { redirect } from "next/navigation";
import { computeStanding, standingLabel } from "@/lib/bootcamp";
import { countdownLabel, fmtDate } from "@/lib/schedule";
import {
  loadEnrolmentContext,
  loadGates,
  loadStandingSignals,
  nextOpenGate,
} from "../_lib/cockpit";

// ═══════════════════════════════════════════════════════════════════════════════
// Standing, explained (ST-39).
//
// The entire point of this page is that a student finds out they are slipping
// while there is still time to recover, and understands exactly what would fix
// it. So:
//
//   • PLAIN LANGUAGE ONLY. "9 days behind on Gate 2". Never a score, never a
//     rank, never a percentile against the rest of the cohort. The risk score
//     computeStanding returns is DESK-ONLY and is not read anywhere below.
//   • Nothing here is a decision. Standing prompts a human to call you; it does
//     not suspend, fail or remove anybody.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

const LEVELS = [
  {
    key: "good",
    title: "On track",
    what: "You are keeping pace with the gate deadlines and turning up.",
    happens: "Nothing. We leave you alone to work.",
    cls: "bg-success-bg text-success",
  },
  {
    key: "at_risk",
    title: "Slipping",
    what:
      "You are about a week behind a gate deadline, or your attendance has dropped, or we have not seen you for a week.",
    happens:
      "Your instructor sees you on their call list and gets in touch — usually in the next 1-1. You are not in trouble; this is the point at which it is still easy to catch up.",
    cls: "bg-warning-bg text-[#8a6d0b]",
  },
  {
    key: "probation",
    title: "Needs attention",
    what:
      "Three weeks or more past a gate deadline, or attendance has collapsed, or you have been silent for a fortnight.",
    happens:
      "A direct conversation about what is actually going on, and a written plan with dates. If the honest answer is that this quarter is not workable, deferring to the next cohort is on the table and costs you nothing.",
    cls: "bg-error-bg text-error",
  },
];

export default async function StandingPage() {
  const ctx = await loadEnrolmentContext();
  if (!ctx) redirect("/bootcamp");

  const now = new Date();
  const [gates, signals] = await Promise.all([
    loadGates(ctx),
    loadStandingSignals(ctx, now),
  ]);

  const nextGate = nextOpenGate(gates);
  const standing = computeStanding(
    {
      nextGateDueAt: nextGate ? nextGate.dueAt : null,
      nextGateTitle: nextGate ? `Gate ${nextGate.orderIndex}` : null,
      attendancePct: signals.attendancePct,
      daysSinceLastActivity: signals.daysSinceLastActivity,
      missedOneToOnes: signals.missedOneToOnes,
    },
    now,
  );
  const text = standingLabel(standing.standing, standing.reasons);
  const level = LEVELS.find((l) => l.key === standing.standing) ?? LEVELS[0];

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-3xl mx-auto text-ink">
      <Link href="/bootcamp/home" className="text-sm font-medium text-brand hover:underline">
        ← Back to your cohort
      </Link>

      <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">Where you stand</h1>
      <p className="mt-2 text-ink-secondary">
        {ctx.bootcamp.title} · {ctx.cohort.name}
      </p>

      <div className={`mt-6 rounded-[12px] px-5 py-4 shadow-sm ${level.cls}`}>
        <p className="text-lg font-semibold">{text}</p>
      </div>

      {/* The reasons come straight from computeStanding so the student reads the
          same sentence the instructor's call list does. */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Why
        </h2>
        {standing.reasons.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Nothing is flagged. You are inside every deadline we track.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary list-disc pl-5">
            {standing.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}

        {nextGate && (
          <p className="mt-4 text-sm text-ink-secondary">
            Next up: <span className="font-semibold text-ink">Gate {nextGate.orderIndex} — {nextGate.title}</span>,{" "}
            {countdownLabel(nextGate.dueAt, now)} ({fmtDate(nextGate.dueAt)}).{" "}
            <Link href={`/bootcamp/gates/${nextGate.id}`} className="text-brand hover:underline">
              Open the gate →
            </Link>
          </p>
        )}
      </section>

      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          What standing is measured from
        </h2>
        <ul className="mt-3 space-y-3 text-sm text-ink-secondary">
          <li>
            <span className="font-semibold text-ink">Gate deadlines.</span> Each gate is
            due at the end of its week, counted from the day your cohort started. Being
            behind on the gate you are currently working towards is the strongest signal.
          </li>
          <li>
            <span className="font-semibold text-ink">Attendance.</span> Taken
            automatically from the live session — you never mark yourself present.
            Watching the recording afterwards counts for half a live session, so being
            in an awkward timezone does not disqualify you.
          </li>
          <li>
            <span className="font-semibold text-ink">Whether you have been working.</span>{" "}
            Measured from your last completed lesson. Silence is the single strongest
            predictor we have that somebody is about to quietly disappear, which is
            precisely when a phone call helps.
          </li>
          <li>
            <span className="font-semibold text-ink">Missed 1-1s.</span> Two missed
            one-to-ones is a flag, because the 1-1 is where problems normally surface.
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          There is no score and no ranking against other students. We do not publish a
          number, because the number would tell you nothing you can act on — and a
          league table in a 50-person cohort would make people hide problems instead of
          raising them.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
          The three levels, and what happens at each
        </h2>
        <ul className="space-y-2">
          {LEVELS.map((l) => (
            <li
              key={l.key}
              className={`rounded-[12px] border bg-surface p-5 shadow-sm ${
                l.key === standing.standing ? "border-brand" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${l.cls}`}>
                  {l.title}
                </span>
                {l.key === standing.standing && (
                  <span className="text-[11px] font-semibold text-brand uppercase tracking-widest">
                    You are here
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{l.what}</p>
              <p className="mt-1.5 text-sm text-ink-secondary">
                <span className="font-semibold text-ink">What happens: </span>
                {l.happens}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-[12px] border border-border bg-surface-tint-soft p-5 shadow-sm">
        <h2 className="font-semibold">Falling behind is not the same as failing</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Standing never suspends you, never fails a gate and never removes you from the
          cohort. Every one of those is a human decision with a written reason. If the
          real problem is that life got in the way, you can{" "}
          <Link href="/bootcamp/contract" className="text-brand font-medium hover:underline">
            ask to defer to the next cohort
          </Link>{" "}
          — the rules for that are stated in full before you ask.
        </p>
      </section>
    </div>
  );
}
