import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { formatCohortDate } from "@/lib/bootcamp/catalog";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkAssessmentToApplication } from "@/lib/bootcamp/assessment";
import { BOOTCAMP_PRICING, formatUsd, regionForCountry } from "@/lib/bootcamp/pricing";
import { enrolmentStep, scheduleFor } from "@/lib/bootcamp/enrolment";
import { PayPanel } from "@/components/bootcamp/PayPanel";
import type { BootcampApplication, BootcampApplicationStatus } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

/** What the applicant sees, and what they should do about it. Deliberately plain:
 *  a decision about someone's next six months should not arrive as jargon. */
const COPY: Record<BootcampApplicationStatus, { heading: string; body: string; tone: "neutral" | "good" | "bad" }> = {
  submitted: {
    heading: "Application received",
    tone: "neutral",
    body: "Next is a short assessment so we can see where you are starting from. It is not pass-or-fail in the usual sense — it tells us whether this track is the right level for you right now, and we would rather say so before you pay than after.",
  },
  assessed: {
    heading: "Assessment complete — with us for review",
    tone: "neutral",
    body: "A human is reading your application. You will hear either way; we do not leave people wondering.",
  },
  accepted: {
    heading: "You're in",
    tone: "good",
    body: "A seat is held for you, and it is held by this offer rather than by a deposit — so it has a deadline. Pay in full or start the three-part plan before it runs out and the seat is yours.",
  },
  waitlisted: {
    heading: "Waitlisted",
    tone: "neutral",
    body: "You met the bar but the cohort filled. You are first in line if a seat frees up, and you have priority on the next intake.",
  },
  rejected: {
    heading: "Not this cohort",
    tone: "bad",
    body: "We do not think this track is the right level for you yet, and taking your money anyway would be the wrong thing to do. The self-paced curriculum is the same material without the deadlines — build up there and apply again.",
  },
  withdrawn: {
    heading: "Application withdrawn",
    tone: "neutral",
    body: "You withdrew this application. You are welcome to apply again for a future cohort.",
  },
  deferred: {
    heading: "Moved to the next cohort",
    tone: "neutral",
    body: "Your application has been carried over to the next intake. Nothing is lost and you keep your place in the queue.",
  },
  expired: {
    heading: "Your offer ran out",
    tone: "bad",
    body: "You were accepted, but the offer passed its deadline before it was taken up and the seat has gone back to the pool. This is not a rejection — you cleared the bar. Email us and if a seat is still free we will put it back.",
  },
};

export default async function ApplicationStatusPage({ params }: PageProps) {
  if (!BOOTCAMP_ENABLED) notFound();

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/bootcamp/application/${id}`)}`);

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle();
  if (!student) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("bootcamp_applications")
    .select("*, cohort:bootcamp_cohorts(name, starts_on, timezone, bootcamp:bootcamps(slug, title, course_id, course:courses(slug, title)))")
    .eq("id", id)
    .maybeSingle();

  // Scoped to the owner explicitly: the admin client bypasses RLS, so this check
  // IS the authorisation. Without it, any signed-in user could read any
  // application by guessing a UUID.
  const app = data as (BootcampApplication & {
    cohort: {
      name: string; starts_on: string; timezone: string;
      bootcamp: { slug: string; title: string; course_id: string; course: { slug: string; title: string } };
    };
  }) | null;
  if (!app || app.student_id !== (student as { id: string }).id) notFound();

  // ST-03: self-healing link between the placement assessment and this
  // application. The assessment flow knows nothing about bootcamps — it ends at
  // its own report page — so instead of threading a return path through three
  // files of shared, working code, we ask here whether a graded attempt exists
  // and record it. Idempotent, so a student can take it, wander off, and come
  // back whenever.
  const linked = await linkAssessmentToApplication(admin, app, app.cohort.bootcamp.course_id);
  if (linked && app.status === "submitted") {
    app.status = "assessed";
    app.assessment_pct = linked.percentage;
  }
  const courseSlug = app.cohort.bootcamp.course.slug;

  // What actually happens next. Resolved by the SAME function the desk and the
  // enrol route use, so a student is never invited to pay for a seat the server
  // would refuse — three screens deriving this independently is exactly how that
  // happens.
  const { data: enrolRow } = await admin
    .from("bootcamp_enrollments")
    .select("id, payment_plan, amount_paid_cents")
    .eq("cohort_id", app.cohort_id)
    .eq("student_id", app.student_id)
    .maybeSingle();
  const enrolment = enrolRow as
    { id: string; payment_plan: "full" | "three_part"; amount_paid_cents: number } | null;

  const { data: countryRow } = await admin
    .from("students").select("country").eq("id", app.student_id).maybeSingle();
  // Region is resolved server-side from the student's own country, never from
  // anything the page was asked for. A displayed price is not an entitlement.
  const region = regionForCountry((countryRow as { country: string | null } | null)?.country);
  const prices = BOOTCAMP_PRICING[region].plans;

  const step = enrolmentStep({
    applicationStatus: app.status,
    offerExpiresAt: app.offer_expires_at,
    assessmentRecorded: app.assessment_pct !== null,
    enrolled: enrolment !== null,
    prices,
    plan: enrolment?.payment_plan ?? "full",
    paidCents: enrolment?.amount_paid_cents ?? 0,
  });

  // An accepted application whose offer has lapsed still reads `accepted` in the
  // database until the daily sweep relabels it. Show the applicant the truth now
  // rather than a pay button that would 409.
  const copy = step.step === "offer_expired" ? COPY.expired : COPY[app.status];
  const tone =
    copy.tone === "good" ? "border-success bg-success-bg"
    : copy.tone === "bad" ? "border-error bg-error-bg"
    : "border-border bg-surface";

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <nav className="max-w-3xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
        <Link href="/bootcamp" className="text-sm font-medium text-ink-secondary hover:text-brand">
          All bootcamps
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-6 pb-20">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          {app.cohort.bootcamp.title} · {app.cohort.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{copy.heading}</h1>

        <div className={`mt-6 border rounded-[12px] p-6 shadow-sm ${tone}`}>
          <p className="text-sm leading-relaxed">{copy.body}</p>
        </div>

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Cohort starts</dt>
            <dd className="mt-1 font-semibold text-sm">{formatCohortDate(app.cohort.starts_on)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Your timezone</dt>
            <dd className="mt-1 font-semibold text-sm">{app.timezone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Hours a week</dt>
            <dd className="mt-1 font-semibold text-sm">{app.hours_committed ?? "—"}</dd>
          </div>
        </dl>

        {app.status === "rejected" && (
          <Link
            href="/"
            className="mt-8 inline-flex rounded-[8px] border border-border font-semibold text-sm px-5 py-2.5 hover:border-brand hover:text-brand transition"
          >
            See the self-paced track
          </Link>
        )}

        {app.status === "submitted" && (
          <div className="mt-8 rounded-[12px] border border-brand bg-surface p-6 shadow-sm max-w-2xl">
            <p className="text-[11px] font-semibold text-brand uppercase tracking-widest">
              Next step
            </p>
            <h2 className="mt-2 font-semibold">Take the placement assessment</h2>
            <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
              About twenty minutes. It is not pass-or-fail in the usual sense — it tells us
              whether this track is the right level for you right now. Come back to this page
              afterwards and your result will be attached automatically. Nothing has been
              charged.
            </p>
            <Link
              href={`/courses/${courseSlug}/assess`}
              className="mt-5 inline-flex rounded-[8px] bg-brand text-white font-semibold text-sm px-5 py-2.5 hover:opacity-90 transition"
            >
              Start the assessment
            </Link>
          </div>
        )}

        {step.step === "pay" && (
          <PayPanel
            dueCents={step.dueCents}
            daysLeft={step.daysLeft}
            fullCents={prices.full}
            threePart={[...prices.threePart]}
            cohortStarts={formatCohortDate(app.cohort.starts_on)}
          />
        )}

        {step.step === "enrolled" && (
          <div className="mt-8 rounded-[12px] border border-success bg-success-bg p-6 shadow-sm max-w-2xl">
            <p className="text-[11px] font-semibold text-success uppercase tracking-widest">
              Enrolled
            </p>
            <h2 className="mt-2 font-semibold">
              Your seat is paid for and confirmed
            </h2>
            {step.outstandingCents === 0 ? (
              <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                Nothing further is owed. You will get the joining details and the class
                calendar before {formatCohortDate(app.cohort.starts_on)}.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                  You are on the three-part plan. {formatUsd(step.outstandingCents)} is still to
                  come, collected in weeks 4 and 8 — the whole plan is settled by week 8, so
                  nothing is chasing you late in the course.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {scheduleFor(prices, enrolment?.payment_plan ?? "three_part").map((i) => (
                    <li key={i.number} className="text-sm flex justify-between max-w-xs">
                      <span className="text-ink-secondary">
                        {i.dueWeek === null ? "Paid on acceptance" : `Week ${i.dueWeek}`}
                      </span>
                      <span className="font-semibold">{formatUsd(i.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {app.assessment_pct !== null && (
          <div className="mt-8 rounded-[12px] border border-border bg-surface p-6 shadow-sm max-w-2xl">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
              Your placement assessment
            </p>
            <p className="mt-2 text-3xl font-bold">{Math.round(Number(app.assessment_pct))}%</p>
            <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
              This is context for the person reading your application, not a pass mark. A lower
              score on a track you are new to is expected and is not on its own a reason we would
              turn you down.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
