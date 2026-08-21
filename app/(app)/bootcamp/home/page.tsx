import Link from "next/link";
import { redirect } from "next/navigation";
import {
  computeStanding,
  standingLabel,
  localSessionTime,
} from "@/lib/bootcamp";
import { currentWeek, countdownLabel, fmtDate, daysUntil } from "@/lib/schedule";
import {
  loadEnrolmentContext,
  loadNextSession,
  loadGates,
  loadStandingSignals,
  loadSquad,
  nextOpenGate,
  JOIN_WINDOW_MIN,
  type GateRow,
} from "../_lib/cockpit";

// ═══════════════════════════════════════════════════════════════════════════════
// S4 — the cohort command centre. The student's daily home.
//
// One screen answers "what do I do right now": the next live class, where the
// cohort is in its 24 weeks, which gate is open, who is in your squad, and
// whether you are slipping.
//
// ROUTE NOTE. The PRD calls this `/(app)/bootcamp`, but a route group is not a
// URL segment: `app/(app)/bootcamp/page.tsx` and the existing public marketing
// page `app/bootcamp/page.tsx` BOTH resolve to /bootcamp, which Next.js rejects
// at build time ("Routes in different groups should not resolve to the same URL
// path" — node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// route-groups.md). The signed-in home therefore lives one segment deeper, at
// /bootcamp/home, and its siblings (/bootcamp/standing, /bootcamp/contract,
// /bootcamp/gates/[gateId]) sit exactly where the PRD puts them — those are three
// segments deep and collide with nothing.
//
// Everything below is READ-ONLY. Nothing on this page writes a grade, an
// attendance row or an enrolment.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  kickoff: "Kickoff",
  class: "Live class",
  lab: "Lab",
  office_hours: "Office hours",
  one_to_one: "Your 1-1",
  viva: "Viva",
  demo_day: "Demo day",
};

const GATE_CHIP: Record<string, { label: string; cls: string }> = {
  passed:    { label: "Passed",         cls: "bg-success-bg text-success" },
  waived:    { label: "Waived",         cls: "bg-success-bg text-success" },
  submitted: { label: "With reviewer",  cls: "bg-surface-tint text-brand" },
  failed:    { label: "Needs another attempt", cls: "bg-error-bg text-error" },
  open:      { label: "Open now",       cls: "bg-brand text-white" },
  locked:    { label: "Locked",         cls: "bg-surface-alt text-ink-muted" },
};

/** Render an instant as a date in the VIEWER's zone. Formatting only — the
 *  time-of-day sentence comes from localSessionTime. */
function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone, month: "short", day: "numeric", year: "numeric",
  }).format(instant);
}

export default async function BootcampHomePage() {
  const ctx = await loadEnrolmentContext();
  // No enrolment is the normal state of somebody mid-application, so this is a
  // redirect to the public page and never a 404.
  if (!ctx) redirect("/bootcamp");

  const now = new Date();
  const { enrolment, cohort, bootcamp, cohortStart, viewerTimeZone } = ctx;
  const suspended = enrolment.status === "suspended";

  const [session, gates, signals, squad] = await Promise.all([
    loadNextSession(ctx, now),
    loadGates(ctx),
    loadStandingSignals(ctx, now),
    loadSquad(ctx),
  ]);

  const started = now.getTime() >= cohortStart.getTime();
  const week = started ? currentWeek(cohortStart, now) : 0;
  const totalProgrammeWeeks = bootcamp.weeks;

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
  const standingText = standingLabel(standing.standing, standing.reasons);

  const gateWeeks = new Set(gates.map((g) => g.week));
  const passedWeeks = new Set(
    gates.filter((g) => g.status === "passed" || g.status === "waived").map((g) => g.week),
  );

  const local = session
    ? localSessionTime(session.startsAt, viewerTimeZone, cohort.timezone)
    : null;

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-5xl mx-auto text-ink">
      {/* ── Billing banner OR live bar ─────────────────────────────────────
          A suspended enrolment loses live access, so showing a join button
          would be a lie. The banner replaces the bar rather than sitting
          above it. */}
      {suspended ? (
        <div className="rounded-[12px] border border-border bg-error-bg text-error px-5 py-4 shadow-sm">
          <p className="font-semibold text-sm">Your place is on hold — payment did not go through.</p>
          <p className="text-sm mt-1 text-ink-secondary">
            Live classes and gate submissions are paused until the payment clears. Your
            recordings, notes and completed work are untouched. Settle it from{" "}
            <Link href="/settings" className="underline font-medium">billing settings</Link>{" "}
            or reply to your last invoice email and we will sort it out.
          </p>
        </div>
      ) : session && local ? (
        <div className="rounded-[12px] bg-brand text-white px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px]">
              {session.live ? "Live now" : "Next"}: {KIND_LABEL[session.kind] ?? "Session"} — {session.title}
            </p>
            <p className="text-sm opacity-90 mt-0.5">
              Week {session.week} · {local.weekday} {local.time} · {localDate(session.startsAt, viewerTimeZone)}
            </p>
            <p className="text-xs opacity-75 mt-0.5">
              Shown in your timezone, {local.timeZone}
              {local.dayShift !== 0 && " — a different calendar day from the cohort band"}
            </p>
          </div>
          {/* The join link is the student's OWN registrant link. There is no
              shared fallback: a shared link makes attendance unattributable,
              and unattributable attendance breaks the gates. */}
          {session.joinOpen ? (
            session.joinUrl ? (
              <a
                href={session.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[8px] bg-surface text-brand font-semibold text-sm px-5 py-2.5 text-center whitespace-nowrap hover:opacity-90 transition"
              >
                Join class →
              </a>
            ) : (
              <span className="rounded-[8px] bg-white/15 text-white text-sm px-4 py-2.5 text-center">
                Your link will appear before the session
              </span>
            )
          ) : (
            <span className="rounded-[8px] bg-white/15 text-white text-sm px-4 py-2.5 text-center whitespace-nowrap">
              {session.joinUrl
                ? `Join opens ${JOIN_WINDOW_MIN} minutes before`
                : "Your link will appear before the session"}
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-border bg-surface px-5 py-4 shadow-sm">
          <p className="text-sm text-ink-secondary">
            No live session scheduled yet. The cohort calendar fills in as each block
            is published.
          </p>
        </div>
      )}

      {/* ── Header + standing chip ───────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{bootcamp.title}</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {cohort.name} ·{" "}
            {started
              ? `Week ${Math.min(week, totalProgrammeWeeks)} of ${totalProgrammeWeeks}`
              : `Starts ${fmtDate(cohortStart)} — in ${Math.max(0, daysUntil(cohortStart, now))} days`}
          </p>
        </div>
        {/* PLAIN LANGUAGE ONLY. No score, no rank, no percentile against
            peers — see /bootcamp/standing for the full rules. */}
        <Link
          href="/bootcamp/standing"
          className={`rounded-[8px] px-3 py-1.5 text-sm font-semibold ${
            standing.standing === "good"
              ? "bg-success-bg text-success"
              : standing.standing === "at_risk"
                ? "bg-warning-bg text-[#8a6d0b]"
                : "bg-error-bg text-error"
          }`}
        >
          {standingText}
        </Link>
      </div>

      {/* ── 24-week rail ─────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Programme
          </p>
          <p className="text-xs text-ink-muted">
            {started
              ? `${Math.max(0, totalProgrammeWeeks - week)} weeks remaining`
              : `${totalProgrammeWeeks} weeks`}{" "}
            · ends {fmtDate(new Date(cohort.ends_on + "T12:00:00Z"))}
          </p>
        </div>
        <ol className="flex flex-wrap gap-1.5" aria-label={`Week 1 to ${totalProgrammeWeeks}`}>
          {Array.from({ length: totalProgrammeWeeks }, (_, i) => i + 1).map((w) => {
            const isGate = gateWeeks.has(w);
            const isNow = started && w === week;
            const done = started && w < week;
            const gatePassed = passedWeeks.has(w);
            return (
              <li
                key={w}
                title={isGate ? `Week ${w} · gate week` : `Week ${w}`}
                className={[
                  "h-6 w-6 rounded-[6px] text-[10px] font-semibold grid place-items-center border",
                  isNow
                    ? "bg-brand text-white border-brand"
                    : gatePassed
                      ? "bg-success-bg text-success border-success-bg"
                      : isGate
                        ? "bg-surface-tint text-brand border-surface-tint"
                        : done
                          ? "bg-surface-alt text-ink-secondary border-surface-alt"
                          : "bg-surface text-ink-muted border-border",
                ].join(" ")}
              >
                {w}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-ink-muted">
          Tinted weeks are gate weeks. Green means that gate is cleared.
        </p>
      </section>

      {/* ── Gate rail ────────────────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Gates
          </h2>
          <Link href="/bootcamp/contract" className="text-xs font-medium text-brand hover:underline">
            What graduating requires →
          </Link>
        </div>

        {gates.length === 0 ? (
          <p className="rounded-[12px] border border-border bg-surface p-5 text-sm text-ink-secondary shadow-sm">
            Gates for this bootcamp have not been published yet.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {gates.map((gate) => (
              <GateCard key={gate.id} gate={gate} now={now} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Squad ────────────────────────────────────────────────────────── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[12px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Your squad
          </p>
          {squad ? (
            <>
              <p className="mt-2 font-semibold">{squad.squad.name}</p>
              {squad.mates.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {squad.mates.map((m, i) => (
                    <li
                      key={`${m.name}-${i}`}
                      className={`rounded-[6px] px-2 py-1 text-xs font-medium ${
                        m.isViewer
                          ? "bg-surface-tint text-brand"
                          : "bg-surface-alt text-ink-secondary"
                      }`}
                    >
                      {m.name}
                    </li>
                  ))}
                </ul>
              )}
              {squad.squad.repo_url && (
                <a
                  href={squad.squad.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
                >
                  Squad repository ↗
                </a>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-secondary">
              You are not in a squad yet. Squads are formed before the squad-build
              block and you will be told who is in yours.
            </p>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Attendance
          </p>
          {signals.sessionsCounted === 0 ? (
            <p className="mt-2 text-sm text-ink-secondary">
              Nothing recorded yet. Attendance is taken automatically from the live
              session — you never mark yourself present.
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-secondary">
              Counted across {signals.sessionsCounted}{" "}
              {signals.sessionsCounted === 1 ? "session" : "sessions"} so far. Watching
              the recording counts for half a live session, so a hard week is
              recoverable.
            </p>
          )}
          <Link
            href="/bootcamp/standing"
            className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
          >
            What changes my standing →
          </Link>
        </div>
      </section>
    </div>
  );
}

/** One gate on the rail. Links to /bootcamp/gates/[gateId] — the gate detail
 *  route is built separately (PRD S7); this page only points at it. */
function GateCard({ gate, now }: { gate: GateRow; now: Date }) {
  const chip = GATE_CHIP[gate.status] ?? GATE_CHIP.locked;
  const cleared = gate.status === "passed" || gate.status === "waived";

  return (
    <li>
      <Link
        href={`/bootcamp/gates/${gate.id}`}
        className="block rounded-[12px] border border-border bg-surface p-4 shadow-sm hover:border-brand transition"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
            Gate {gate.orderIndex}
          </p>
          <span className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${chip.cls}`}>
            {chip.label}
          </span>
        </div>
        <p className="mt-1 font-semibold text-sm">{gate.title}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Week {gate.week} · {cleared ? fmtDate(gate.dueAt) : countdownLabel(gate.dueAt, now)}
        </p>
      </Link>
    </li>
  );
}
