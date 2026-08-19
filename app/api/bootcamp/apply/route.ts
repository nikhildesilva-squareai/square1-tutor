import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cohortAvailability } from "@/lib/bootcamp/availability";
import { isValidTimeZone } from "@/lib/bootcamp/localtime";
import type { BootcampCohort } from "@/types/database";

// POST /api/bootcamp/apply
//
// Creates a bootcamp application. Free, commits the applicant to nothing, and
// deliberately does NOT touch money — payment happens after a human decision.
//
// EVERY GUARD HERE IS RE-CHECKED SERVER-SIDE. The apply page already refuses to
// render for a cohort that is full or outside its window, but a page is a
// suggestion and a POST body is user input: seats can sell out between render
// and submit, and the endpoint is reachable directly.
//
// The client may only ever write the columns migration 021 grants to
// `authenticated`: cohort_id, student_id, hours_committed, timezone, motivation,
// local_time_confirmed. `status` and every decision column are service-role only,
// so an applicant cannot accept themselves.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  cohortId: z.string().regex(UUID, "Invalid cohort"),
  timeZone: z.string().min(1).max(64),
  hoursCommitted: z.number().int().min(1).max(80),
  motivation: z.string().max(4000).optional(),
  // ST-01 as a server-side requirement, not a UI nicety. An application that did
  // not confirm the local class hour is not accepted at all — the whole point is
  // that nobody buys a seat they cannot attend.
  localTimeConfirmed: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to apply." }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const confirm = parsed.error.issues.some((i) => i.path[0] === "localTimeConfirmed");
      return NextResponse.json(
        {
          error: confirm
            ? "Please confirm you can attend the live class at that time."
            : "Please check the form and try again.",
        },
        { status: 400 },
      );
    }
    const input = parsed.data;

    if (!isValidTimeZone(input.timeZone)) {
      return NextResponse.json({ error: "That timezone was not recognised." }, { status: 400 });
    }

    const { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) {
      return NextResponse.json({ error: "No student profile found." }, { status: 404 });
    }
    const studentId = (student as { id: string }).id;

    // Admin client from here: counting OTHER applicants' accepted rows is not
    // something the authenticated role can do (its policy scopes reads to the
    // caller's own applications), and it must not be able to.
    const admin = createAdminClient();

    const { data: cohortRow } = await admin
      .from("bootcamp_cohorts")
      .select("*")
      .eq("id", input.cohortId)
      .maybeSingle();
    if (!cohortRow) {
      return NextResponse.json({ error: "That cohort no longer exists." }, { status: 404 });
    }
    const cohort = cohortRow as BootcampCohort;

    if (cohort.status !== "open") {
      return NextResponse.json(
        { error: "This cohort is not accepting applications." },
        { status: 409 },
      );
    }

    const { count } = await admin
      .from("bootcamp_applications")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", cohort.id)
      .eq("status", "accepted");

    const availability = cohortAvailability(cohort, count ?? 0, new Date());
    if (availability.state !== "open") {
      const message =
        availability.state === "full"
          ? "The last seat went while you were filling this in. We are sorry — join the list for the next intake."
          : availability.state === "not_open_yet"
            ? "Applications for this cohort have not opened yet."
            : "Applications for this cohort have closed.";
      return NextResponse.json({ error: message, state: availability.state }, { status: 409 });
    }

    const { data: inserted, error } = await admin
      .from("bootcamp_applications")
      .insert({
        cohort_id: cohort.id,
        student_id: studentId,
        timezone: input.timeZone,
        hours_committed: input.hoursCommitted,
        motivation: input.motivation ?? null,
        local_time_confirmed: true,
      })
      .select("id")
      .single();

    if (error) {
      // 23505 = the (cohort_id, student_id) unique constraint. Not an error from
      // the applicant's point of view — they already applied.
      if (error.code === "23505") {
        const { data: existing } = await admin
          .from("bootcamp_applications")
          .select("id")
          .eq("cohort_id", cohort.id)
          .eq("student_id", studentId)
          .maybeSingle();
        return NextResponse.json(
          { applicationId: (existing as { id: string } | null)?.id, alreadyApplied: true },
          { status: 200 },
        );
      }
      console.error("[bootcamp/apply]", error);
      return NextResponse.json({ error: "Could not save your application." }, { status: 500 });
    }

    return NextResponse.json({ applicationId: (inserted as { id: string }).id }, { status: 201 });
  } catch (err) {
    console.error("[bootcamp/apply]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
