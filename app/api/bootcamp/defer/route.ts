import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BootcampEnrollment } from "@/types/database";

// POST /api/bootcamp/defer
//
// A student asks to move to the next cohort (ST-40). This endpoint RECORDS THE
// REQUEST and nothing else — it does not change `status`, does not move the
// seat, does not touch money. Deferring is a human decision, and the desk needs
// a trail of who asked, when, and why.
//
// The write therefore lands in bootcamp_audit_log, which has NO policies and no
// grant to `authenticated` (migration 021): it is service-role only, exactly so
// that the record of a request cannot be edited by the person who made it.
//
// The enrolment is resolved SERVER-SIDE from the session. The client sends only
// a reason — it never names the enrolment it wants deferred, so there is no
// parameter to tamper with.

const schema = z.object({
  reason: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please tell us briefly what has happened (2,000 characters or fewer)." },
        { status: 400 },
      );
    }

    const { data: studentRow } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!studentRow) {
      return NextResponse.json({ error: "No student profile found." }, { status: 404 });
    }
    const studentId = (studentRow as { id: string }).id;

    // RLS scopes this to the caller's own enrolments.
    const { data: rows } = await supabase
      .from("bootcamp_enrollments")
      .select("id, cohort_id, status, standing, created_at")
      .eq("student_id", studentId)
      .in("status", ["active", "suspended"])
      .order("created_at", { ascending: false })
      .limit(1);

    const enrolment = ((rows ?? []) as Pick<
      BootcampEnrollment, "id" | "cohort_id" | "status" | "standing" | "created_at"
    >[])[0];
    if (!enrolment) {
      return NextResponse.json(
        { error: "You do not have an active bootcamp place to defer." },
        { status: 404 },
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("bootcamp_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: "enrolment.defer_requested",
      subject_table: "bootcamp_enrollments",
      subject_id: enrolment.id,
      reason: parsed.data.reason,
      before_state: { status: enrolment.status, standing: enrolment.standing },
      // Deliberately not an after_state that implies a change: nothing changed.
      after_state: { requested_at: new Date().toISOString(), cohort_id: enrolment.cohort_id },
    });

    if (error) {
      return NextResponse.json(
        { error: "We could not record that. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
