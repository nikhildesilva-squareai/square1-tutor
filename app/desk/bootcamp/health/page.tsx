import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { formatCohortDate } from "@/lib/bootcamp/catalog";
import {
  loadDeskCohorts,
  GATE_ONE_CEILING_PCT,
  GATE_ONE_FLOOR_PCT,
  REVIEW_SLA_HOURS,
  type CohortHealth,
} from "../data";

// Cohort health (S10, task 3).
//
// Five numbers, one of them much larger than the others. Gate-1 first-attempt
// pass rate is the number that tells you whether the programme is real: above
// ~85% the bar is decorative and the certificate is worth nothing to an
// employer; below ~40% admissions is selling seats to people this programme
// cannot serve. Both failures are invisible in revenue and obvious here.
//
// THE HONESTY RULE: with zero enrolments every metric on this page must say
// "no data", not "0%". A dashboard that renders 0% for an empty cohort teaches
// the instructor to distrust the page, and then the one time it means 0% they
// will not act on it.

export const dynamic = "force-dynamic";

function NoData({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-muted font-normal">{children}</span>;
}

function Tile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneCls =
    tone === "good" ? "bg-success-bg text-success"
    : tone === "warn" ? "bg-warning-bg text-[#8a6d0b]"
    : tone === "bad" ? "bg-error-bg text-error"
    : "bg-surface text-ink";
  return (
    <div className={`border border-border rounded-[12px] p-5 shadow-sm ${toneCls}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs opacity-80 leading-relaxed">{hint}</p>
    </div>
  );
}

function GateOnePanel({ health }: { health: CohortHealth }) {
  const g = health.gateOne;

  const tone =
    g.verdict === "no-data" ? "border-border bg-surface"
    : g.verdict === "healthy" ? "border-border bg-success-bg"
    : g.verdict === "too-easy" ? "border-border bg-warning-bg"
    : "border-border bg-error-bg";

  const verdictText =
    g.verdict === "no-data"
      ? "No Gate 1 has been decided yet. This number is the first thing to look at once reviews start — it is not zero, it does not exist."
      : g.verdict === "too-easy"
        ? `Above ${GATE_ONE_CEILING_PCT}%. Almost everyone clears it first time, which means the gate is not filtering anything. Raise the bar or the certificate stops meaning anything to an employer.`
        : g.verdict === "too-hard"
          ? `Below ${GATE_ONE_FLOOR_PCT}%. Most people fail their first attempt, which is an admissions problem before it is a teaching one — we are letting in people this programme cannot serve.`
          : `Between ${GATE_ONE_FLOOR_PCT}% and ${GATE_ONE_CEILING_PCT}%. The gate is doing work and most people recover from a fail.`;

  return (
    <div className={`border rounded-[12px] p-6 shadow-sm ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
        Gate 1 first-attempt pass rate{g.gateTitle ? ` · ${g.gateTitle}` : ""}
      </p>
      <p className="mt-3 text-5xl font-bold tabular-nums leading-none">
        {g.pct === null ? <NoData>No data yet</NoData> : `${Math.round(g.pct)}%`}
      </p>
      <p className="mt-3 text-sm text-ink-secondary">
        {g.decided === 0
          ? "0 decided results"
          : `${g.firstAttemptPasses} of ${g.decided} passed on the first attempt`}
      </p>
      <p className="mt-3 text-xs text-ink-secondary leading-relaxed max-w-xl">{verdictText}</p>
      <p className="mt-2 text-[11px] text-ink-muted leading-relaxed max-w-xl">
        First attempt means passed with one attempt on record. Someone who failed
        and came back counts against this number on purpose — it measures the gate,
        not the eventual outcome.
      </p>
    </div>
  );
}

export default async function BootcampHealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const cohorts = await loadDeskCohorts();

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Cohort health</h1>
        <p className="mt-2 text-sm text-ink-secondary max-w-2xl leading-relaxed">
          Where a metric has nothing behind it, it says so. A zero that means
          &ldquo;no data&rdquo; is a lie you would act on.
        </p>

        <nav className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/desk/bootcamp" className="text-brand hover:underline">Admissions</Link>
          <Link href="/desk/bootcamp/roster" className="text-brand hover:underline">Roster</Link>
        </nav>

        {cohorts.length === 0 && (
          <p className="mt-8 text-ink-secondary">No open cohorts.</p>
        )}

        {cohorts.map(({ cohort, rows, health, weekNow, sessionsHeld }) => {
          const { sla, load, retention, attendanceTrend } = health;
          const slaPct =
            sla.reviewed === 0 ? null : (sla.withinTarget / sla.reviewed) * 100;

          return (
            <section key={cohort.id} className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
                <h2 className="text-lg font-semibold">
                  {cohort.bootcamp?.title ?? "Bootcamp"} · {cohort.name}
                </h2>
                <span className="text-sm text-ink-secondary">
                  {rows.length} enrolled · week {weekNow}
                </span>
              </div>
              <p className="text-xs text-ink-muted mb-4">
                Starts {formatCohortDate(cohort.starts_on)} · {sessionsHeld} session
                {sessionsHeld === 1 ? "" : "s"} held
              </p>

              {rows.length === 0 && (
                <p className="mb-4 text-sm text-ink-secondary bg-surface border border-border rounded-[12px] p-5">
                  Nobody is enrolled in this cohort yet, so none of the figures below
                  exist. They will read &ldquo;no data&rdquo; until there is some.
                </p>
              )}

              <GateOnePanel health={health} />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Tile
                  label={`Reviewer turnaround · ${REVIEW_SLA_HOURS}h target`}
                  value={
                    sla.medianHours === null
                      ? <NoData>No data yet</NoData>
                      : `${Math.round(sla.medianHours)}h median`
                  }
                  tone={
                    sla.medianHours === null ? "neutral"
                    : sla.medianHours <= REVIEW_SLA_HOURS ? "good" : "bad"
                  }
                  hint={
                    sla.reviewed === 0
                      ? `Nothing has been submitted and decided yet. ${sla.awaitingReview} awaiting review.`
                      : <>
                          {sla.withinTarget} of {sla.reviewed} inside {REVIEW_SLA_HOURS}h
                          {slaPct !== null && ` (${Math.round(slaPct)}%)`} ·{" "}
                          {sla.awaitingReview} awaiting review
                          {sla.breachedAndOpen > 0 && `, ${sla.breachedAndOpen} already past the target`}
                        </>
                  }
                />

                <Tile
                  label="Instructor hours per week"
                  value={
                    load.sessionHoursPerWeek === null
                      ? <NoData>Not enough data</NoData>
                      : `${load.sessionHoursPerWeek.toFixed(1)} h`
                  }
                  hint={
                    load.sessionsHeld === 0
                      ? "No session has run yet, and review time is not instrumented — there is no honest number to show."
                      : <>
                          Contact hours only: {load.sessionHours.toFixed(1)}h across{" "}
                          {load.sessionsHeld} session{load.sessionsHeld === 1 ? "" : "s"} over{" "}
                          {load.weeksElapsed} week{load.weeksElapsed === 1 ? "" : "s"}. Plus{" "}
                          {load.reviewsDecided} gate review
                          {load.reviewsDecided === 1 ? "" : "s"} decided — review time is
                          not recorded anywhere, so it is counted, not costed.
                        </>
                  }
                />

                <Tile
                  label="Week-4 retention"
                  value={
                    retention.pct === null
                      ? <NoData>{retention.everEnrolled === 0 ? "No data yet" : "Not yet knowable"}</NoData>
                      : `${Math.round(retention.pct)}%`
                  }
                  tone={
                    retention.pct === null ? "neutral"
                    : retention.pct >= 85 ? "good"
                    : retention.pct >= 70 ? "warn" : "bad"
                  }
                  hint={
                    retention.everEnrolled === 0
                      ? "Nobody is enrolled."
                      : !retention.knowable
                        ? `The cohort is in week ${retention.weekNow}. Week-4 retention is not a number yet, and quoting today's would be quoting a number that cannot be wrong.`
                        : `${retention.stillIn} of ${retention.everEnrolled} still active or graduated.`
                  }
                />

                <Tile
                  label="Attendance trend"
                  value={
                    attendanceTrend.length === 0
                      ? <NoData>No data yet</NoData>
                      : `${Math.round(attendanceTrend[attendanceTrend.length - 1].pct)}% latest`
                  }
                  hint={
                    attendanceTrend.length === 0
                      ? "No session with attendance recorded has happened yet."
                      : `Weighted across ${attendanceTrend.length} week${
                          attendanceTrend.length === 1 ? "" : "s"
                        } with sessions. Live 1.0 · late 0.75 · recording 0.5.`
                  }
                />
              </div>

              {attendanceTrend.length > 0 && (
                <div className="mt-4 bg-surface border border-border rounded-[12px] p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                    Attendance by week
                  </p>
                  <ul className="mt-3 space-y-2">
                    {attendanceTrend.map((p) => (
                      <li key={p.week} className="flex items-center gap-3 text-xs">
                        <span className="w-16 shrink-0 text-ink-muted">Week {p.week}</span>
                        <span className="flex-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                          <span
                            className="block h-full bg-brand"
                            style={{ width: `${Math.min(100, Math.max(0, p.pct))}%` }}
                          />
                        </span>
                        <span className="w-28 shrink-0 text-right text-ink-secondary tabular-nums">
                          {Math.round(p.pct)}% · {p.sessions} session
                          {p.sessions === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link
                  href={`/desk/bootcamp/export?type=roster&cohort=${cohort.id}`}
                  prefetch={false}
                  className="rounded-full border border-border px-2.5 py-1 font-semibold text-ink-secondary hover:border-brand hover:text-brand transition"
                >
                  Roster CSV
                </Link>
                <Link
                  href={`/desk/bootcamp/export?type=gates&cohort=${cohort.id}`}
                  prefetch={false}
                  className="rounded-full border border-border px-2.5 py-1 font-semibold text-ink-secondary hover:border-brand hover:text-brand transition"
                >
                  Gate results CSV
                </Link>
              </div>
            </section>
          );
        })}

        <p className="mt-12 text-xs text-ink-muted max-w-2xl leading-relaxed">
          Turnaround is measured from <code>submitted_at</code> to{" "}
          <code>decided_at</code> — this schema has no separate{" "}
          <code>reviewed_at</code>, and a gate result is not reviewed until it is
          decided. There is no gradebook grid here on purpose: export the CSV.
        </p>
      </div>
    </main>
  );
}
