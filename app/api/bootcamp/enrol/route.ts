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
  // Tuition is a single payment; there is no plan to choose.
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
    const { applicationId, provider, providerRef, note } = parsed.data;
    const plan = "full" as const;

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

    // ONE FUNCTION, ONE TRANSACTION. This used to be two sequential inserts —
    // student_enrollments, then bootcamp_enrollments — and a failure between them
    // left a base enrolment with no cohort row. It self-healed on retry, but a
    // payment path is exactly where nobody is watching. s1_bootcamp_enrol also
    // re-checks status and offer liveness under a row lock, so two concurrent
    // calls cannot both enrol.
    const { data: enrolmentId, error: enrolErr } = await admin.rpc("s1_bootcamp_enrol", {
      p_application_id: application.id,
      p_plan: plan,
      p_amount_cents: amountCents,
      p_region: region,
      p_provider: provider,
      p_provider_ref: providerRef ?? null,
      p_note: note ?? null,
      p_recorded_by: user.email,
    });

    if (enrolErr || !enrolmentId) {
      console.error("[bootcamp/enrol]", enrolErr);
      // The function raises check_violation for a state the desk can fix (not
      // accepted, offer lapsed, already fully paid), so say which rather than
      // reporting a generic failure.
      const message = enrolErr?.message ?? "Could not create the enrolment.";
      const isState = /not accepted|expired|already paid/i.test(message);
      return NextResponse.json(
        { error: isState ? message : "Could not create the enrolment." },
        { status: isState ? 409 : 500 },
      );
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

