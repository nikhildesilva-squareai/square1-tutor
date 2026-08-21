import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOTCAMP_PRICING, formatUsd, regionForCountry } from "@/lib/bootcamp/pricing";
import {
  INSTALMENT_GRACE_DAYS,
  nextDueInstalment,
  shouldSuspendForNonPayment,
} from "@/lib/bootcamp/enrolment";
import { sendInstalmentReminder } from "@/lib/email/resend";

/**
 * GET /api/cron/bootcamp — return lapsed seats to the pool.
 *
 * With no deposit, ACCEPTANCE ITSELF holds a seat. An accepted applicant who
 * never pays would otherwise hold one of fifty indefinitely, and the cap — the
 * one genuinely scarce thing in the product — quietly fills with people who are
 * not coming. This is what stops that.
 *
 * Expiry is a STATUS CHANGE, not a deletion. The row stays so the desk can see
 * what happened, tell the difference between "changed their mind" and "we never
 * heard back", and offer the seat on with a reason.
 *
 * Only ever touches applications that are `accepted`, past their deadline, and
 * NOT enrolled. Someone who paid keeps their seat even if the sweep runs late —
 * money always outranks a timer.
 *
 * Protected by CRON_SECRET, matching /api/cron/daily. Vercel sends it as a Bearer
 * header automatically when the env var is set on the project.
 */
export async function GET(request: Request) {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: lapsed } = await admin
      .from("bootcamp_applications")
      .select("id, cohort_id, student_id, offer_expires_at")
      .eq("status", "accepted")
      .lt("offer_expires_at", nowIso);

    const candidates = (lapsed ?? []) as {
      id: string; cohort_id: string; student_id: string; offer_expires_at: string;
    }[];

    const instalments = await sweepInstalments(admin);

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, expired: 0, instalments, ms: Date.now() - startedAt });
    }

    // Anyone who actually paid keeps their seat, whatever the timer says. The
    // sweep can run late, a webhook can arrive slowly, and neither is a reason to
    // take a seat back off someone who has handed over money.
    const { data: enrolled } = await admin
      .from("bootcamp_enrollments")
      .select("cohort_id, student_id")
      .in("cohort_id", [...new Set(candidates.map((c) => c.cohort_id))]);

    const paidKeys = new Set(
      ((enrolled ?? []) as { cohort_id: string; student_id: string }[])
        .map((e) => `${e.cohort_id}:${e.student_id}`),
    );

    const toExpire = candidates.filter(
      (c) => !paidKeys.has(`${c.cohort_id}:${c.student_id}`),
    );

    if (toExpire.length === 0) {
      return NextResponse.json({
        ok: true, expired: 0, keptBecausePaid: candidates.length,
        instalments, ms: Date.now() - startedAt,
      });
    }

    const ids = toExpire.map((c) => c.id);

    await admin
      .from("bootcamp_applications")
      .update({ status: "expired", offer_expires_at: null })
      .in("id", ids)
      .eq("status", "accepted"); // re-checked in the write: a payment landing mid-sweep wins

    // Every seat that goes back to the pool leaves a trace. "Why did this person
    // lose their place" must always be answerable.
    await admin.from("bootcamp_audit_log").insert(
      toExpire.map((c) => ({
        actor_email: "cron:bootcamp",
        action: "application.expired",
        subject_table: "bootcamp_applications",
        subject_id: c.id,
        reason: "Offer deadline passed with no payment; seat returned to the pool.",
        before_state: { status: "accepted", offer_expires_at: c.offer_expires_at },
        after_state: { status: "expired" },
      })),
    );

    return NextResponse.json({
      ok: true,
      expired: toExpire.length,
      keptBecausePaid: candidates.length - toExpire.length,
      instalments,
      ms: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[cron/bootcamp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Ask for instalments 2 and 3, and eventually suspend for the ones that never come.
 *
 * Tuition is ONE-OFF CHECKOUT by choice: no card is stored, nothing is charged
 * while the student is away. The price of that is that the later instalments do
 * not collect themselves — this is what asks.
 *
 * TWO THINGS IT MUST NOT DO
 *
 *   Suspend anyone who is up to date. Every three-part student carries a balance
 *   from the day they enrol, so a rule keyed on "outstanding > 0" would suspend
 *   the whole cohort on day one. Suspension keys off a MISSED instalment that has
 *   run past its grace, and nothing else.
 *
 *   Email daily. A reminder repeated every morning stops being a reminder and
 *   becomes noise someone filters. One per instalment per week, established by
 *   reading back the audit log rather than by adding a table — the log is already
 *   the record of what we did to whom.
 */
async function sweepInstalments(admin: ReturnType<typeof createAdminClient>) {
  const now = new Date();
  const result = { reminded: 0, suspended: 0, skipped: 0 };

  const { data: enrolRows } = await admin
    .from("bootcamp_enrollments")
    .select("id, cohort_id, student_id, status, payment_plan, cohort:bootcamp_cohorts(starts_on, bootcamp:bootcamps(title))")
    .eq("payment_plan", "three_part")
    .in("status", ["active", "suspended"]);

  // Cast through unknown: the generated types model every embedded relation as
  // an array, but a to-one join returns an object at runtime.
  const enrolments = (enrolRows ?? []) as unknown as {
    id: string; cohort_id: string; student_id: string; status: string;
    payment_plan: "three_part";
    cohort: { starts_on: string; bootcamp: { title: string } | null } | null;
  }[];
  if (enrolments.length === 0) return result;

  const studentIds = [...new Set(enrolments.map((e) => e.student_id))];

  const { data: appRows } = await admin
    .from("bootcamp_applications")
    .select("id, cohort_id, student_id")
    .in("student_id", studentIds);
  const applicationFor = new Map(
    ((appRows ?? []) as { id: string; cohort_id: string; student_id: string }[])
      .map((a) => [`${a.cohort_id}:${a.student_id}`, a.id]),
  );

  const { data: payRows } = await admin
    .from("bootcamp_payments")
    .select("application_id, instalment")
    .eq("status", "paid")
    .in("application_id", [...applicationFor.values()].length ? [...applicationFor.values()] : ["__none__"]);
  const paidBy = new Map<string, number[]>();
  for (const row of (payRows ?? []) as { application_id: string; instalment: number }[]) {
    paidBy.set(row.application_id, [...(paidBy.get(row.application_id) ?? []), row.instalment]);
  }

  const { data: studentRows } = await admin
    .from("students").select("id, name, email, country").in("id", studentIds);
  const students = new Map(
    ((studentRows ?? []) as { id: string; name: string | null; email: string; country: string | null }[])
      .map((s) => [s.id, s]),
  );

  // What we have already said, so a reminder is not sent every morning.
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const { data: recentRows } = await admin
    .from("bootcamp_audit_log")
    .select("subject_id, after_state, created_at")
    .eq("action", "payment.reminded")
    .gte("created_at", weekAgo);
  const remindedRecently = new Set(
    ((recentRows ?? []) as { subject_id: string; after_state: { instalment?: number } | null }[])
      .map((r) => `${r.subject_id}:${r.after_state?.instalment ?? "?"}`),
  );

  for (const enrolment of enrolments) {
    const applicationId = applicationFor.get(`${enrolment.cohort_id}:${enrolment.student_id}`);
    const startsOn = enrolment.cohort?.starts_on;
    const student = students.get(enrolment.student_id);
    if (!applicationId || !startsOn || !student) { result.skipped++; continue; }

    const prices = BOOTCAMP_PRICING[regionForCountry(student.country)].plans;
    const paid = paidBy.get(applicationId) ?? [];

    const due = nextDueInstalment(prices, "three_part", paid, startsOn, now);
    if (!due || due.state === "upcoming") continue;

    if (shouldSuspendForNonPayment(prices, "three_part", paid, startsOn, now)) {
      if (enrolment.status !== "suspended") {
        // Suspension pauses live access and gate submission. It does NOT touch
        // recordings, submitted work or the seat — a billing problem is not a
        // reason to erase what somebody has already done.
        await admin.from("bootcamp_enrollments")
          .update({ status: "suspended" }).eq("id", enrolment.id);
        await admin.from("bootcamp_audit_log").insert({
          actor_email: "cron:bootcamp",
          action: "enrolment.suspended",
          subject_table: "bootcamp_applications",
          subject_id: applicationId,
          reason: `Instalment ${due.number} unpaid ${due.daysLate} days after it was due (grace is ${INSTALMENT_GRACE_DAYS} days).`,
          before_state: { status: enrolment.status },
          after_state: { status: "suspended", instalment: due.number },
        });
        result.suspended++;
      }
    }

    if (remindedRecently.has(`${applicationId}:${due.number}`)) continue;

    try {
      await sendInstalmentReminder(student.email, student.name ?? "there", {
        instalment: due.number,
        amount: formatUsd(due.amountCents),
        dueDate: due.dueDate.toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
        }),
        daysLate: due.daysLate,
        graceDaysLeft: Math.max(0, INSTALMENT_GRACE_DAYS - due.daysLate),
        applicationId,
        trackTitle: enrolment.cohort?.bootcamp?.title ?? "your bootcamp",
      });
      await admin.from("bootcamp_audit_log").insert({
        actor_email: "cron:bootcamp",
        action: "payment.reminded",
        subject_table: "bootcamp_applications",
        subject_id: applicationId,
        reason: due.daysLate > 0 ? `${due.daysLate} days late` : "due today",
        after_state: { instalment: due.number, amount_cents: due.amountCents, state: due.state },
      });
      result.reminded++;
    } catch (err) {
      // A bounced email must not stop the rest of the sweep, and must never
      // silently swallow the suspension that may have just happened above.
      console.error("[cron/bootcamp] reminder failed", applicationId, err);
      result.skipped++;
    }
  }

  return result;
}
