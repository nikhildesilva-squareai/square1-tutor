import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { formatCohortDate } from "@/lib/bootcamp/catalog";
import { fmtDate } from "@/lib/schedule";
import { DeskFlagButton } from "@/components/bootcamp/DeskFlagButton";
import {
  loadDeskCohorts,
  parseSort,
  sortRoster,
  type DeskRosterRow,
  type RosterSort,
} from "../data";

// Roster + at-risk call list (S10, tasks 1 and 2).
//
// Two views of one query on purpose. The roster is the register; the call list
// above it is the day's work. A list ranked by a risk score with no reason
// attached is not actionable — the instructor needs to know WHY before they dial,
// so the reasons computeStanding produced are printed next to every name rather
// than collapsed into the score that ordered them.
//
// Auth matches /desk/bootcamp and /desk/newsroom: session only, never a query
// string. `?sort=` chooses an ordering and nothing else.

export const dynamic = "force-dynamic";

const STANDING_STYLE: Record<string, string> = {
  good:      "bg-success-bg text-success",
  at_risk:   "bg-warning-bg text-[#8a6d0b]",
  probation: "bg-error-bg text-error",
};

const SORTS: { key: RosterSort; label: string }[] = [
  { key: "standing",   label: "Standing" },
  { key: "name",       label: "Name" },
  { key: "attendance", label: "Attendance" },
  { key: "activity",   label: "Quietest" },
];

function attendanceText(row: DeskRosterRow): string {
  if (row.attendancePct === null) return "no sessions yet";
  return `${Math.round(row.attendancePct)}% of ${row.sessionsAttendable}`;
}

function activityText(row: DeskRosterRow): string {
  if (!row.hasActivity) return `nothing yet · ${row.daysSinceLastActivity}d since enrolling`;
  return `${fmtDate(new Date(row.lastActivityAt as string))} · ${row.daysSinceLastActivity}d ago`;
}

export default async function BootcampRosterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const sort = parseSort((await searchParams).sort);
  const cohorts = await loadDeskCohorts();

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Roster</h1>
        <p className="mt-2 text-sm text-ink-secondary max-w-2xl leading-relaxed">
          Everyone enrolled in an open or running cohort. Standing is recomputed on
          this page from the same inputs the student sees — it is not read back from
          the nightly column, so a stale sweep shows up as a disagreement rather than
          hiding.
        </p>

        <nav className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/desk/bootcamp" className="text-brand hover:underline">Admissions</Link>
          <Link href="/desk/bootcamp/health" className="text-brand hover:underline">Cohort health</Link>
        </nav>

        {cohorts.length === 0 && (
          <p className="mt-8 text-ink-secondary">No open cohorts.</p>
        )}

        {cohorts.map(({ cohort, rows, weekNow, sessionsHeld }) => {
          const sorted = sortRoster(rows, sort);
          const atRisk = sortRoster(
            rows.filter((r) => r.standing.standing !== "good"),
            "standing",
          );

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

              {rows.length === 0 ? (
                <p className="text-sm text-ink-secondary bg-surface border border-border rounded-[12px] p-5">
                  Nobody is enrolled yet. Enrolments appear here once a payment is
                  recorded on an accepted application — every number below is
                  &ldquo;no data&rdquo;, not zero.
                </p>
              ) : (
                <>
                  {/* ── Call list ─────────────────────────────────────────── */}
                  <div className="bg-surface border border-border rounded-[12px] p-5 shadow-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-sm">Who to call</h3>
                      <span className="text-xs text-ink-muted">
                        {atRisk.length} of {rows.length} off track
                      </span>
                    </div>

                    {atRisk.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-secondary">
                        Nobody is flagged. Standing is computed from gate pace,
                        attendance, silence and missed one-to-ones.
                      </p>
                    ) : (
                      <ol className="mt-3 space-y-3">
                        {atRisk.map((r, i) => (
                          <li
                            key={r.enrollmentId}
                            className="border-t border-border pt-3 first:border-t-0 first:pt-0"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm">
                                  <span className="text-ink-muted mr-1.5 tabular-nums">{i + 1}.</span>
                                  {r.name}{" "}
                                  <span className="font-normal text-ink-muted">{r.email}</span>
                                </p>
                                {/* The reasons, not the score. The score only ordered the list. */}
                                <ul className="mt-1.5 space-y-0.5">
                                  {r.standing.reasons.map((reason) => (
                                    <li key={reason} className="text-xs text-ink-secondary">
                                      · {reason}
                                    </li>
                                  ))}
                                </ul>
                                {r.flag && (
                                  <p className="mt-1.5 text-xs text-success font-semibold">
                                    Flagged by {r.flag.by} on{" "}
                                    {new Date(r.flag.at).toLocaleDateString("en-GB")}
                                    {r.flag.reason ? ` — ${r.flag.reason}` : ""}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                                  STANDING_STYLE[r.standing.standing] ?? ""
                                }`}
                              >
                                {r.standing.standing.replace("_", " ")}
                              </span>
                            </div>
                            <DeskFlagButton
                              enrollmentId={r.enrollmentId}
                              studentName={r.name}
                              alreadyFlaggedBy={r.flag?.by ?? null}
                            />
                          </li>
                        ))}
                      </ol>
                    )}
                    <p className="mt-4 text-[11px] text-ink-muted leading-relaxed">
                      Flagging writes an audit row with who did it and when, so two
                      people do not call the same student. It changes nothing about
                      the student&rsquo;s standing or record.
                    </p>
                  </div>

                  {/* ── Register ──────────────────────────────────────────── */}
                  <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-ink-muted">Sort by</span>
                    {SORTS.map((s) => (
                      <Link
                        key={s.key}
                        href={`/desk/bootcamp/roster?sort=${s.key}`}
                        className={`rounded-full px-2.5 py-1 font-semibold border ${
                          sort === s.key
                            ? "border-brand text-brand"
                            : "border-border text-ink-secondary hover:border-brand hover:text-brand"
                        } transition`}
                      >
                        {s.label}
                      </Link>
                    ))}
                    <Link
                      href={`/desk/bootcamp/export?type=roster&cohort=${cohort.id}`}
                      prefetch={false}
                      className="ml-auto rounded-full border border-border px-2.5 py-1 font-semibold text-ink-secondary hover:border-brand hover:text-brand transition"
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

                  <div className="mt-3 bg-surface border border-border rounded-[12px] shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-widest text-ink-muted">
                          <th className="font-semibold px-5 py-3">Student</th>
                          <th className="font-semibold px-5 py-3">Standing</th>
                          <th className="font-semibold px-5 py-3">Attendance</th>
                          <th className="font-semibold px-5 py-3">Current gate</th>
                          <th className="font-semibold px-5 py-3">Last activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((r) => (
                          <tr key={r.enrollmentId} className="border-t border-border align-top">
                            <td className="px-5 py-3">
                              <p className="font-semibold">{r.name}</p>
                              <p className="text-xs text-ink-muted">{r.email}</p>
                              {r.status !== "active" && (
                                <p className="text-xs text-ink-muted italic">{r.status}</p>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                                  STANDING_STYLE[r.standing.standing] ?? ""
                                }`}
                              >
                                {r.standing.standing.replace("_", " ")}
                              </span>
                              <p className="mt-1.5 text-xs text-ink-secondary">
                                {r.standing.label}
                              </p>
                              {r.storedStanding !== r.standing.standing && (
                                <p className="mt-1 text-[11px] text-ink-muted">
                                  stored as {r.storedStanding.replace("_", " ")}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-ink-secondary tabular-nums">
                              {attendanceText(r)}
                            </td>
                            <td className="px-5 py-3 text-ink-secondary">
                              {r.currentGateTitle ?? "all gates cleared"}
                              <span className="block text-xs text-ink-muted">
                                {r.currentGateStatus}
                                {r.currentGateDueAt && ` · due ${fmtDate(r.currentGateDueAt)}`}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-ink-secondary text-xs">
                              {activityText(r)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          );
        })}

        <p className="mt-12 text-xs text-ink-muted max-w-2xl leading-relaxed">
          &ldquo;Last activity&rdquo; is the student&rsquo;s most recent completed lesson.
          This schema records no login timestamp, so nothing on this page claims one.
          Attendance counts only sessions that have already happened — live 1.0, late
          0.75, watched recording 0.5.
        </p>
      </div>
    </main>
  );
}
