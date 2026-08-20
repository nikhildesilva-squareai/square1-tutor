import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { cohortAvailability, displaySeatsLeft } from "@/lib/bootcamp/availability";
import { formatCohortDate } from "@/lib/bootcamp/catalog";
import { DecisionButtons } from "@/components/bootcamp/DecisionButtons";
import { MarkPaidButton } from "@/components/bootcamp/MarkPaidButton";
import { formatUsd } from "@/lib/bootcamp/pricing";
import { isOfferLive, daysLeftOnOffer } from "@/lib/bootcamp/enrolment";
import type { BootcampCohort } from "@/types/database";

// Admissions queue (AD-06 / AD-07).
//
// Deliberately NOT under /admin: that panel is local-only in production. This
// follows /desk/newsroom — session auth (getUser + isAdminEmail), nothing from
// the query string.
//
// Concierge-scale on purpose (docs/bootcamp-prd.md S10): 50 applicants per
// cohort, decided one at a time. No bulk actions, no filters, no pagination —
// building an admin tool for a queue you can read in one screen is how launches
// slip. It grows when the queue does.

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  submitted:  "bg-surface-alt text-ink-secondary",
  assessed:   "bg-surface-tint text-brand",
  accepted:   "bg-success-bg text-success",
  waitlisted: "bg-warning-bg text-[#8a6d0b]",
  rejected:   "bg-error-bg text-error",
  withdrawn:  "bg-surface-alt text-ink-muted",
  deferred:   "bg-surface-alt text-ink-muted",
  expired:    "bg-error-bg text-error",
};

export default async function AdmissionsDeskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: cohortRows } = await admin
    .from("bootcamp_cohorts")
    .select("*, bootcamp:bootcamps(slug, title)")
    .in("status", ["open", "running"])
    .order("starts_on");

  const cohorts = (cohortRows ?? []) as (BootcampCohort & {
    bootcamp: { slug: string; title: string };
  })[];

  const { data: appRows } = await admin
    .from("bootcamp_applications")
    .select("*, student:students(name, email)")
    .in("cohort_id", cohorts.map((c) => c.id).length ? cohorts.map((c) => c.id) : ["__none__"])
    .order("created_at", { ascending: true });

  const applications = (appRows ?? []) as {
    id: string; cohort_id: string; student_id: string; status: string; assessment_pct: number | null;
    hours_committed: number | null; timezone: string | null; motivation: string | null;
    local_time_confirmed: boolean; created_at: string; decision_note: string | null;
    offer_expires_at: string | null;
    student: { name: string | null; email: string } | null;
  }[];

  // Who has actually paid. Keyed by cohort+student because that is what the
  // enrolment is unique on — an application is not the thing that holds a seat
  // once money has changed hands.
  const { data: enrolRows } = await admin
    .from("bootcamp_enrollments")
    .select("cohort_id, student_id, payment_plan, amount_paid_cents")
    .in("cohort_id", cohorts.map((c) => c.id).length ? cohorts.map((c) => c.id) : ["__none__"]);
  const enrolments = new Map(
    ((enrolRows ?? []) as {
      cohort_id: string; student_id: string;
      payment_plan: string; amount_paid_cents: number;
    }[]).map((e) => [`${e.cohort_id}:${e.student_id}`, e]),
  );

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Bootcamp admissions</h1>

        {cohorts.length === 0 && (
          <p className="mt-8 text-ink-secondary">No open cohorts.</p>
        )}

        {cohorts.map((cohort) => {
          const mine = applications.filter((a) => a.cohort_id === cohort.id);
          const accepted = mine.filter((a) => a.status === "accepted").length;
          const availability = cohortAvailability(cohort, accepted, new Date());
          const pending = mine.filter((a) => a.status === "submitted" || a.status === "assessed");

          return (
            <section key={cohort.id} className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
                <h2 className="text-lg font-semibold">
                  {cohort.bootcamp.title} · {cohort.name}
                </h2>
                <span className="text-sm text-ink-secondary">
                  {displaySeatsLeft(availability)} of {cohort.seats} seats left ·{" "}
                  {accepted} accepted · {pending.length} awaiting a decision
                </span>
              </div>
              <p className="text-xs text-ink-muted mb-4">
                Starts {formatCohortDate(cohort.starts_on)} · applications{" "}
                {formatCohortDate(cohort.applications_open_on)} →{" "}
                {formatCohortDate(cohort.applications_close_on)} · state:{" "}
                <span className="font-semibold">{availability.state}</span>
              </p>

              {mine.length === 0 ? (
                <p className="text-sm text-ink-secondary bg-surface border border-border rounded-[12px] p-5">
                  No applications yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {mine.map((a) => (
                    <article key={a.id} className="bg-surface border border-border rounded-[12px] p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">
                            {a.student?.name ?? "—"}{" "}
                            <span className="font-normal text-ink-muted">{a.student?.email}</span>
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">
                            Applied {new Date(a.created_at).toLocaleDateString("en-GB")} ·{" "}
                            {a.timezone ?? "no timezone"} · {a.hours_committed ?? "—"} h/week
                            {!a.local_time_confirmed && (
                              <span className="ml-2 text-error font-semibold">
                                did not confirm the class hour
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 ${STATUS_STYLE[a.status] ?? ""}`}>
                          {a.status}
                          {a.assessment_pct !== null && ` · ${Math.round(Number(a.assessment_pct))}%`}
                        </span>
                      </div>

                      {a.motivation && (
                        <p className="mt-3 text-sm text-ink-secondary leading-relaxed border-l-2 border-border pl-3">
                          {a.motivation}
                        </p>
                      )}

                      {a.decision_note && (
                        <p className="mt-3 text-xs text-ink-muted">
                          Decision note: {a.decision_note}
                        </p>
                      )}

                      {(a.status === "submitted" || a.status === "assessed") && (
                        <DecisionButtons
                          applicationId={a.id}
                          seatsLeft={displaySeatsLeft(availability) ?? 0}
                        />
                      )}

                      {a.status === "accepted" && (() => {
                        const paid = enrolments.get(`${a.cohort_id}:${a.student_id}`);
                        if (paid) {
                          return (
                            <p className="mt-4 text-xs text-success font-semibold">
                              Enrolled · {paid.payment_plan === "full" ? "paid in full" : "three-part plan"}
                              {" · "}{formatUsd(paid.amount_paid_cents)} received
                            </p>
                          );
                        }
                        // An accepted application keeps reading `accepted` until the
                        // daily sweep relabels it, so the deadline is checked here
                        // rather than trusted from the status column.
                        const live = isOfferLive(a.offer_expires_at, new Date());
                        return live ? (
                          <>
                            <p className="mt-4 text-xs text-ink-muted">
                              Unpaid · offer expires in {daysLeftOnOffer(a.offer_expires_at, new Date())}{" "}
                              day(s)
                            </p>
                            <MarkPaidButton applicationId={a.id} />
                          </>
                        ) : (
                          <p className="mt-4 text-xs text-error font-semibold">
                            Offer lapsed and unpaid — the seat returns to the pool at the next
                            sweep. Re-accept if you mean to hold it again.
                          </p>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <p className="mt-12 text-xs text-ink-muted max-w-2xl leading-relaxed">
          Every decision writes an audit row with who made it and why. Accepting is capped at the
          cohort&rsquo;s seat count — the cap is one instructor per 50 students, and it cannot be
          exceeded by clicking faster.{" "}
          <Link href="/desk/newsroom" className="text-brand hover:underline">Newsroom desk</Link>
        </p>
      </div>
    </main>
  );
}
