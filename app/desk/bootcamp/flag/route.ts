import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { INTERVENTION_ACTION } from "../data";

// POST /desk/bootcamp/flag
//
// "I am calling this one." Writes a single bootcamp_audit_log row and touches
// nothing else — no standing change, no student-visible state, no email.
//
// It exists because the failure mode at 50 students is not that nobody calls,
// it is that two people call the same person and nobody calls the other four.
// The row records WHO and WHEN, which is the entire feature.
//
// Auth follows /api/bootcamp/decide: session only (getUser + isAdminEmail).
// The actor is taken from the session, never from the body — a route that let
// the caller name themselves would make the audit log worthless.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  enrollmentId: z.string().regex(UUID),
  note: z.string().max(2000).optional(),
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
    const { enrollmentId, note } = parsed.data;

    const admin = createAdminClient();

    // Existence check before the log entry: an audit row pointing at a student
    // who is not enrolled is noise in the one place that has to stay trustworthy.
    const { data: enrolRow } = await admin
      .from("bootcamp_enrollments")
      .select("id, cohort_id, student_id, status, standing")
      .eq("id", enrollmentId)
      .maybeSingle();
    if (!enrolRow) {
      return NextResponse.json({ error: "Enrolment not found" }, { status: 404 });
    }
    const enrolment = enrolRow as {
      id: string; cohort_id: string; student_id: string; status: string; standing: string;
    };

    const { error: logErr } = await admin.from("bootcamp_audit_log").insert({
      actor_id: null,
      actor_email: user.email,
      action: INTERVENTION_ACTION,
      subject_table: "bootcamp_enrollments",
      subject_id: enrolment.id,
      reason: note?.trim() || null,
      // No before/after: nothing changed. This is a record of a human act, not
      // of a mutation, and pretending otherwise would put a fake diff in the log.
      before_state: null,
      after_state: {
        standing: enrolment.standing,
        status: enrolment.status,
        cohort_id: enrolment.cohort_id,
      },
    });

    if (logErr) {
      console.error("[desk/bootcamp/flag]", logErr);
      return NextResponse.json({ error: "Could not record the flag." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, flaggedBy: user.email });
  } catch (err) {
    console.error("[desk/bootcamp/flag]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
