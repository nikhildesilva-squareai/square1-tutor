import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { cohortAvailability } from "@/lib/bootcamp/availability";
import type { BootcampCohort } from "@/types/database";

// POST /api/bootcamp/decide
//
// An admissions decision. This is the route that tells someone whether their
// next six months look different, so two things are non-negotiable:
//
//   1. EVERY decision writes bootcamp_audit_log — actor, action, before, after
//      and a reason. Overrides are allowed; silent ones are not. Migration 021
//      made forging a decision impossible; this makes making one traceable.
//   2. Accepting cannot exceed the seat cap. The cap is what the whole product
//      rests on — one instructor per 50 students — and "we accidentally accepted
//      53" is not something you can walk back from once people have paid.
//
// Auth is session-based (getUser + isAdminEmail), matching /desk/newsroom.
// Nothing about the caller comes from the request body.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  applicationId: z.string().regex(UUID),
  decision: z.enum(["accepted", "waitlisted", "rejected", "deferred"]),
  // Free text, shown to nobody but the audit log and whoever reads it later.
  // Required for a rejection: "why did we turn this person down" should never be
  // a question the record cannot answer.
  reason: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { applicationId, decision, reason } = parsed.data;

    if (decision === "rejected" && !reason?.trim()) {
      return NextResponse.json(
        { error: "A rejection needs a reason — it goes in the permanent record." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: appRow } = await admin
      .from("bootcamp_applications")
      .select("id, cohort_id, student_id, status, assessment_pct")
      .eq("id", applicationId)
      .maybeSingle();
    if (!appRow) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const application = appRow as {
      id: string; cohort_id: string; student_id: string; status: string; assessment_pct: number | null;
    };

    if (application.status === decision) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    // Seat cap. Only checked when ACCEPTING, and only counting other rows — an
    // application already accepted must be able to be re-saved without tripping
    // its own count.
    if (decision === "accepted") {
      const { data: cohortRow } = await admin
        .from("bootcamp_cohorts").select("*").eq("id", application.cohort_id).maybeSingle();
      const cohort = cohortRow as BootcampCohort | null;
      if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });

      const { count } = await admin
        .from("bootcamp_applications")
        .select("id", { count: "exact", head: true })
        .eq("cohort_id", cohort.id)
        .eq("status", "accepted")
        .neq("id", application.id);

      const availability = cohortAvailability(cohort, count ?? 0, new Date());
      if (availability.state === "full") {
        return NextResponse.json(
          { error: `All ${cohort.seats} seats are taken. Waitlist instead, or raise the cap deliberately.` },
          { status: 409 },
        );
      }
    }

    const { error: updateErr } = await admin
      .from("bootcamp_applications")
      .update({
        status: decision,
        decision_note: reason?.trim() || null,
        reviewed_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateErr) {
      console.error("[bootcamp/decide]", updateErr);
      return NextResponse.json({ error: "Could not save the decision." }, { status: 500 });
    }

    // The audit row is written AFTER the update on purpose: a log entry for a
    // decision that failed to save would be worse than no entry at all.
    await admin.from("bootcamp_audit_log").insert({
      actor_id: null,
      actor_email: user.email,
      action: `application.${decision}`,
      subject_table: "bootcamp_applications",
      subject_id: application.id,
      reason: reason?.trim() || null,
      before_state: { status: application.status, assessment_pct: application.assessment_pct },
      after_state: { status: decision },
    });

    return NextResponse.json({ ok: true, status: decision });
  } catch (err) {
    console.error("[bootcamp/decide]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
