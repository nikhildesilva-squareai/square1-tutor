import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cohortAvailability } from "@/lib/bootcamp/availability";
import { isValidTimeZone } from "@/lib/bootcamp/localtime";
import type { BootcampCohort } from "@/types/database";

// POST /api/bootcamp/waitlist
//
// "Tell me when this opens." Deliberately the lowest-friction thing on the whole
// funnel: an email address and nothing else. Applying needs an account because
// the graded work has to live somewhere; expressing interest should not.
//
// The table has RLS on with no policies and no grants, so this route running
// under the service role is the ONLY way in. That is on purpose — a
// client-writable waitlist is a spam target, and a client-readable one leaks
// every email of everyone interested in the product.

const schema = z.object({
  slug: z.string().min(1).max(80),
  email: z.string().email().max(320),
  timeZone: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const { slug, email, timeZone } = parsed.data;

    const admin = createAdminClient();

    const { data: bootcampRow } = await admin
      .from("bootcamps")
      .select("id, status")
      .eq("slug", slug)
      .in("status", ["waitlist", "open"])
      .maybeSingle();
    if (!bootcampRow) {
      return NextResponse.json({ error: "Unknown bootcamp." }, { status: 404 });
    }
    const bootcamp = bootcampRow as { id: string; status: string };

    // Record WHY they could not join. "We were sold out" and "we had not opened
    // yet" are very different signals about demand, and collapsing them would
    // throw away the only honest read we get on whether the price is right.
    const { data: cohortRow } = await admin
      .from("bootcamp_cohorts")
      .select("*")
      .eq("bootcamp_id", bootcamp.id)
      .eq("status", "open")
      .order("starts_on", { ascending: true })
      .limit(1)
      .maybeSingle();

    const cohort = (cohortRow as BootcampCohort | null) ?? null;
    const availability = cohortAvailability(cohort, 0, new Date());
    const reason = availability.state === "open" ? "not_open_yet" : availability.state;

    // Attach a student id when we happen to know it — but never require one.
    let studentId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: s } = await supabase
          .from("students").select("id").eq("user_id", user.id).maybeSingle();
        studentId = (s as { id: string } | null)?.id ?? null;
      }
    } catch {
      // Signed-out is the normal case here, not an error.
    }

    const { error } = await admin.from("bootcamp_waitlist").insert({
      bootcamp_id: bootcamp.id,
      cohort_id: cohort?.id ?? null,
      student_id: studentId,
      email: email.trim().toLowerCase(),
      timezone: timeZone && isValidTimeZone(timeZone) ? timeZone : null,
      reason,
    });

    // 23505 = already on this list. Signing up twice is a no-op, not an error —
    // telling someone "you already did that" helps nobody.
    if (error && error.code !== "23505") {
      console.error("[bootcamp/waitlist]", error);
      return NextResponse.json({ error: "Could not add you to the list." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[bootcamp/waitlist]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
