import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, expired: 0, ms: Date.now() - startedAt });
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
        ok: true, expired: 0, keptBecausePaid: candidates.length, ms: Date.now() - startedAt,
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
      ms: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[cron/bootcamp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
