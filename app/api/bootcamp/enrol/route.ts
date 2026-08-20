import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { BOOTCAMP_PRICING, regionForCountry, type PriceRegion } from "@/lib/bootcamp/pricing";
import { dueOnAcceptanceCents, isOfferLive } from "@/lib/bootcamp/enrolment";
import type { BootcampCohort } from "@/types/database";

// POST /api/bootcamp/enrol
//
// Records a payment and turns an accepted application into a real enrolment.
//
// PROVIDER-AGNOSTIC ON PURPOSE. Today the only provider is `manual` — the desk
// marks a bank transfer or a card taken elsewhere as paid. Stripe arriving next
// week adds a `stripe` branch that verifies a payment_intent and then calls the
// SAME code path below. The ledger, the enrolment creation and the audit row do
// not change.
//
// WHAT THIS ROUTE MUST NEVER DO
//
//   Trust an amount from the client. The price comes from BOOTCAMP_PRICING and
//   the region on the server. A body that says "I paid $1" must not enrol anyone.
//
//   Enrol against a dead offer. With no deposit, acceptance IS the seat hold, and
//   an expired offer means the seat went back to the pool. Taking money for it
//   would be selling something we no longer have.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  applicationId: z.string().regex(UUID),
  plan: z.enum(["full", "three_part"]),
  // Manual only for now. The amount is NOT accepted from the client at all.
  provider: z.literal("manual").default("manual"),
  providerRef: z.string().max(200).optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Manual payments are a desk action. When Stripe lands, its webhook will
    // authenticate by signature instead and skip this check.
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { applicationId, plan, provider, providerRef, note } = parsed.data;

    const admin = createAdminClient();

    const { data: appRow } = await admin
      .from("bootcamp_applications")
      .select("id, cohort_id, student_id, status, offer_expires_at, timezone")
      .eq("id", applicationId)
      .maybeSingle();
    if (!appRow) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const application = appRow as {
      id: string; cohort_id: string; student_id: string; status: string;
      offer_expires_at: string | null; timezone: string | null;
    };

    if (application.status !== "accepted") {
      return NextResponse.json(
        { error: `Only an accepted application can be enrolled — this one is ${application.status}.` },
        { status: 409 },
      );
    }

    if (!isOfferLive(application.offer_expires_at)) {
      return NextResponse.json(
        { error: "This offer has expired and the seat has gone back to the pool. Re-accept first if you mean to hold it again." },
        { status: 409 },
      );
    }

    const { data: cohortRow } = await admin
      .from("bootcamp_cohorts").select("*").eq("id", application.cohort_id).maybeSingle();
    if (!cohortRow) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    const cohort = cohortRow as BootcampCohort;

    // Region from the student's own country, resolved server-side. A displayed
    // price is never an entitlement — at a ~$350 gap the arbitrage is worth
    // someone's time, so the rate is decided here and not by whoever is asking.
    const { data: studentRow } = await admin
      .from("students").select("id, country").eq("id", application.student_id).maybeSingle();
    const region: PriceRegion = regionForCountry(
      (studentRow as { country: string | null } | null)?.country,
    );
    const amountCents = dueOnAcceptanceCents(BOOTCAMP_PRICING[region].plans, plan);

    // The base enrolment. A bootcamp student IS a normal enrolled student, so the
    // ordinary row comes first and everything else hangs off it — dashboard,
    // streaks, Nova memory and certificates keep working with no special cases.
    let baseEnrolmentId: string;
    const { data: existingBase } = await admin
      .from("student_enrollments")
      .select("id")
      .eq("student_id", application.student_id)
      .eq("course_id", (await courseIdFor(admin, cohort.bootcamp_id)) ?? "")
      .maybeSingle();

    if (existingBase) {
      baseEnrolmentId = (existingBase as { id: string }).id;
    } else {
      const courseId = await courseIdFor(admin, cohort.bootcamp_id);
      if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      const { data: created, error: baseErr } = await admin
        .from("student_enrollments")
        .insert({
          student_id: application.student_id,
          course_id: courseId,
          plan_months: 6,
          status: "active",
        })
        .select("id")
        .single();
      if (baseErr || !created) {
        console.error("[bootcamp/enrol] base enrolment", baseErr);
        return NextResponse.json({ error: "Could not create the enrolment." }, { status: 500 });
      }
      baseEnrolmentId = (created as { id: string }).id;
    }

    const { data: enrolment, error: enrolErr } = await admin
      .from("bootcamp_enrollments")
      .upsert(
        {
          cohort_id: cohort.id,
          student_id: application.student_id,
          enrollment_id: baseEnrolmentId,
          status: "active",
          timezone: application.timezone,
          payment_plan: plan,
          amount_paid_cents: amountCents,
          currency: "USD",
          paid_in_full_at: plan === "full" ? new Date().toISOString() : null,
        },
        { onConflict: "cohort_id,student_id" },
      )
      .select("id")
      .single();

    if (enrolErr || !enrolment) {
      console.error("[bootcamp/enrol] cohort enrolment", enrolErr);
      return NextResponse.json({ error: "Could not create the enrolment." }, { status: 500 });
    }
    const enrolmentId = (enrolment as { id: string }).id;

    // Ledger row. UNIQUE (application_id, instalment) means a double-clicked
    // button or a retried webhook lands once, not twice.
    const { error: payErr } = await admin.from("bootcamp_payments").insert({
      application_id: application.id,
      bootcamp_enrollment_id: enrolmentId,
      student_id: application.student_id,
      provider,
      provider_ref: providerRef ?? null,
      plan,
      instalment: 1,
      amount_cents: amountCents,
      region,
      status: "paid",
      note: note ?? null,
      recorded_by: user.email,
    });

    if (payErr && payErr.code !== "23505") {
      console.error("[bootcamp/enrol] payment", payErr);
      return NextResponse.json({ error: "Enrolled, but the payment did not record." }, { status: 500 });
    }

    await admin.from("bootcamp_audit_log").insert({
      actor_email: user.email,
      action: "application.enrolled",
      subject_table: "bootcamp_applications",
      subject_id: application.id,
      reason: note ?? null,
      before_state: { status: "accepted" },
      after_state: {
        status: "accepted",
        enrolment_id: enrolmentId,
        plan,
        amount_cents: amountCents,
        region,
        provider,
      },
    });

    return NextResponse.json({ ok: true, enrolmentId, amountCents, region, plan });
  } catch (err) {
    console.error("[bootcamp/enrol]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** The curriculum a bootcamp runs on. A track is a delivery mode over an existing
 *  course, so the base enrolment is against that course. */
async function courseIdFor(
  admin: ReturnType<typeof createAdminClient>,
  bootcampId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("bootcamps").select("course_id").eq("id", bootcampId).maybeSingle();
  return (data as { course_id: string } | null)?.course_id ?? null;
}
