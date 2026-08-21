import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BOOTCAMP_PASS_BAR, MAX_ATTEMPTS, RESUBMIT_WINDOW_DAYS, formatUsd } from "@/lib/bootcamp";
import { weekDueDate, fmtDate, daysUntil } from "@/lib/schedule";
import { DeferRequestForm } from "@/components/bootcamp/DeferRequestForm";
import { loadEnrolmentContext, loadGates } from "../_lib/cockpit";

// ═══════════════════════════════════════════════════════════════════════════════
// The learning contract (ST-12, ST-40).
//
// One page restating what the student agreed to, in the same words they agreed
// to it in: hours, attendance, the 75% gate bar, the refund window, and the
// recording consent they gave at apply time. Nothing here is new terms — if a
// line on this page is not also true at checkout, one of the two is a bug.
//
// The defer request lives at the bottom, UNDER the entitlement rules, because
// somebody who is about to ask for help should not have to ask in order to find
// out what it costs them.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

/** The refund window, in weeks from the cohort start. Expressed through
 *  weekDueDate so there is no second piece of week arithmetic in the codebase. */
const REFUND_WINDOW_WEEKS = 2;

export default async function ContractPage() {
  const ctx = await loadEnrolmentContext();
  if (!ctx) redirect("/bootcamp");

  const now = new Date();
  const { enrolment, cohort, bootcamp, cohortStart } = ctx;

  const supabase = await createClient();
  const [{ data: applicationRow }, gates] = await Promise.all([
    // RLS scopes applications to the caller's own rows.
    supabase
      .from("bootcamp_applications")
      .select("hours_committed, local_time_confirmed, created_at")
      .eq("cohort_id", cohort.id)
      .eq("student_id", ctx.studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadGates(ctx),
  ]);
  const application = applicationRow as {
    hours_committed: number | null; local_time_confirmed: boolean; created_at: string;
  } | null;

  const hoursCommitted = application?.hours_committed ?? bootcamp.hours_per_week;
  const refundDeadline = weekDueDate(cohortStart, REFUND_WINDOW_WEEKS);
  const refundDaysLeft = daysUntil(refundDeadline, now);
  const gatesPassed = gates.filter(
    (g) => g.status === "passed" || g.status === "waived",
  ).length;

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-3xl mx-auto text-ink">
      <Link href="/bootcamp/home" className="text-sm font-medium text-brand hover:underline">
        ← Back to your cohort
      </Link>

      <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
        Your learning contract
      </h1>
      <p className="mt-2 text-ink-secondary">
        {bootcamp.title} · {cohort.name} · starts {fmtDate(cohortStart)}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        This is what you agreed to when you took the seat, restated in one place so you
        never have to reconstruct it from emails.
      </p>

      {/* ── The commitments ─────────────────────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          What you committed to
        </h2>
        <dl className="mt-3 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Hours a week</dt>
            <dd className="text-ink-secondary mt-0.5">
              You told us <span className="font-semibold text-ink">{hoursCommitted} hours a week</span>
              {application ? "" : " (the programme's own estimate — your application did not record a figure)"}.
              The programme is built around roughly {bootcamp.hours_per_week} hours over{" "}
              {bootcamp.weeks} weeks. Consistently below that and the gate deadlines stop
              being reachable, which is why we ask rather than assume.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Attendance</dt>
            <dd className="text-ink-secondary mt-0.5">
              Turn up to the live class each week and to your 30-minute 1-1. Attendance is
              recorded automatically from the session itself — you never mark yourself
              present. Watching the recording afterwards counts for half a live session, so
              an unavoidable clash is recoverable and a habit of missing class is not.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Six gates, at {BOOTCAMP_PASS_BAR}%</dt>
            <dd className="text-ink-secondary mt-0.5">
              Every gate is compulsory and strictly ordered: the next block does not open
              until the last gate is cleared. The bar is {BOOTCAMP_PASS_BAR}% — deliberately
              higher than the self-paced track, because that is what you are paying for.
              Passing is a human sign-off, never an automatic score. Fail and you get written
              reasons and a remediation path, with a resubmission inside{" "}
              {RESUBMIT_WINDOW_DAYS} days and {MAX_ATTEMPTS} attempts at any one gate; run out
              and you defer to the next cohort at no extra cost.
              {gates.length > 0 && (
                <>
                  {" "}
                  <span className="text-ink font-medium">
                    You have cleared {gatesPassed} of {gates.length}.
                  </span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Your own work</dt>
            <dd className="text-ink-secondary mt-0.5">
              Squad gates count the pull requests you personally authored and the reviews you
              personally gave, read from GitHub rather than self-reported. Nobody passes on a
              teammate&rsquo;s work.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Money ───────────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Money
        </h2>
        <dl className="mt-3 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Paid</dt>
            <dd className="text-ink-secondary mt-0.5">
              {formatUsd(enrolment.amount_paid_cents)} {enrolment.currency}
              {enrolment.paid_in_full_at ? " — paid in full." : "."}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Refund window</dt>
            <dd className="text-ink-secondary mt-0.5">
              Full refund if you withdraw within two weeks of the cohort starting — that is
              up to <span className="font-semibold text-ink">{fmtDate(refundDeadline)}</span>.
              {refundDaysLeft >= 0 ? (
                <>
                  {" "}That window is still open
                  {refundDaysLeft === 0 ? " today" : `, ${refundDaysLeft} ${refundDaysLeft === 1 ? "day" : "days"} left`}.
                </>
              ) : (
                <> That window has closed. Deferring, below, is the route from here.</>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Recording consent ───────────────────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Recording
        </h2>
        <p className="mt-3 text-sm text-ink-secondary">
          Every live class is recorded, and your capstone viva is recorded because the
          recording is the evidence behind the credential.
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          {enrolment.recording_consent_at ? (
            <>
              You gave that consent when you applied, on{" "}
              <span className="font-semibold text-ink">
                {fmtDate(new Date(enrolment.recording_consent_at))}
              </span>
              .
            </>
          ) : (
            <>
              We do not have a consent date recorded against this enrolment. If that looks
              wrong, tell your instructor — it should have been captured when you applied.
            </>
          )}{" "}
          Whether your viva is published beyond the assessment is a separate choice, it is
          off unless you turn it on, and you can turn it off again at any time.
        </p>
      </section>

      {/* ── Defer: rules first, form second ─────────────────────────────── */}
      <section className="mt-6 rounded-[12px] border border-border bg-surface-tint-soft p-5 shadow-sm">
        <h2 className="font-semibold text-lg">If life gets in the way</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          A bad quarter should not end your programme. You can ask to move to the next
          cohort. Here is exactly what that does, before you ask:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-ink-secondary list-disc pl-5">
          <li>
            Your seat moves to the next cohort of this bootcamp{" "}
            <span className="font-semibold text-ink">at no extra cost</span>. You do not pay
            again and you do not lose what you have paid.
          </li>
          <li>
            Gates you have already cleared{" "}
            <span className="font-semibold text-ink">carry over</span> — you do not resit
            them. Your submissions, feedback and notes stay exactly where they are.
          </li>
          <li>
            It is a request, not a switch. A person reads it and replies; nothing about your
            place changes until they do, so keep going in the meantime.
          </li>
          <li>
            It is not a refund. The refund window is the two weeks above; after that,
            deferring is the route, and it is a better one than disappearing.
          </li>
          <li>
            Asking does not count against you. It is not recorded as a failure and it has no
            effect on your standing or your credential.
          </li>
        </ul>
        <DeferRequestForm />
      </section>

      <p className="mt-6 text-sm text-ink-muted">
        Something here not matching what you were told?{" "}
        <a href="mailto:admissions@square1ai.com" className="text-brand hover:underline">
          Write to admissions
        </a>{" "}
        and we will fix it rather than argue about it.
      </p>
    </div>
  );
}
