import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOTCAMP_PRICING, regionForCountry, type PriceRegion } from "@/lib/bootcamp/pricing";
import { dueOnAcceptanceCents, isOfferLive, nextInstalment } from "@/lib/bootcamp/enrolment";
import { getStripe, stripeConfigured, siteUrl } from "@/lib/bootcamp/stripe";

// POST /api/bootcamp/checkout
//
// Opens a Stripe Checkout session for tuition. The student pays; the WEBHOOK
// enrols them. Nothing here writes an enrolment, because a session that is
// created is not a session that is paid, and treating those as the same thing is
// how people end up enrolled without having paid.
//
// WHAT THIS ROUTE MUST NEVER DO
//
//   Take an amount from the client. The price comes from BOOTCAMP_PRICING and
//   the region resolved on the server.
//
//   Charge against a dead offer. With no deposit, acceptance IS the seat hold;
//   an expired offer means the seat went back to the pool, and collecting for it
//   would be selling something we no longer have.
//
// THE REGION HERE IS PROVISIONAL. It comes from the student's own profile
// country, which is self-declared. It is re-checked at settlement in the webhook
// against the card's billing country via verifyRegionAtCheckout() — a ~$400 gap
// makes editing a profile field worth someone's time.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  applicationId: z.string().regex(UUID),
  plan: z.enum(["full", "three_part"]),
});

export async function POST(request: Request) {
  try {
    if (!stripeConfigured()) {
      // Not an error state — it is the current state. The pay panel shows the
      // manual route (write to admissions) while this is true.
      return NextResponse.json(
        { error: "Card checkout is not open yet.", unconfigured: true },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { applicationId, plan } = parsed.data;

    const { data: studentRow } = await supabase
      .from("students").select("id, email, country").eq("user_id", user.id).maybeSingle();
    const student = studentRow as { id: string; email: string; country: string | null } | null;
    if (!student) return NextResponse.json({ error: "No student profile" }, { status: 403 });

    const admin = createAdminClient();
    const { data: appRow } = await admin
      .from("bootcamp_applications")
      .select("id, cohort_id, student_id, status, offer_expires_at")
      .eq("id", applicationId)
      .maybeSingle();
    const application = appRow as {
      id: string; cohort_id: string; student_id: string;
      status: string; offer_expires_at: string | null;
    } | null;
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    // The admin client bypasses RLS, so this ownership check IS the
    // authorisation. Without it any signed-in user could open a checkout against
    // someone else's application by guessing a UUID.
    if (application.student_id !== student.id) {
      return NextResponse.json({ error: "Not your application" }, { status: 403 });
    }

    if (application.status !== "accepted") {
      return NextResponse.json(
        { error: `Only an accepted application can be paid — this one is ${application.status}.` },
        { status: 409 },
      );
    }

    // Already enrolled? Then this is instalment 2 or 3, and the OFFER IS
    // IRRELEVANT — it expired weeks ago by design, because a seat held by
    // payment is not a seat held by a deadline. Checking offer liveness here
    // unconditionally would make the later instalments impossible to pay.
    const { data: existing } = await admin
      .from("bootcamp_enrollments")
      .select("id")
      .eq("cohort_id", application.cohort_id)
      .eq("student_id", application.student_id)
      .maybeSingle();

    if (!existing && !isOfferLive(application.offer_expires_at)) {
      return NextResponse.json(
        { error: "This offer has expired and the seat has gone back to the pool." },
        { status: 409 },
      );
    }

    const region: PriceRegion = regionForCountry(student.country);
    const prices = BOOTCAMP_PRICING[region].plans;

    // Which charge this is. Instalment 1 unlocks enrolment; 2 and 3 are the
    // rest of the three-part plan, collected in weeks 4 and 8.
    const { data: paidRows } = await admin
      .from("bootcamp_payments")
      .select("instalment")
      .eq("application_id", application.id)
      .eq("status", "paid");
    const paid = ((paidRows ?? []) as { instalment: number }[]).map((r) => r.instalment);

    const next = paid.length === 0
      ? { number: 1, amountCents: dueOnAcceptanceCents(prices, plan), dueWeek: null }
      : nextInstalment(prices, plan, paid);
    if (!next) {
      return NextResponse.json({ error: "Nothing is outstanding." }, { status: 409 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Card checkout is not open yet." }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: student.email,
      // Required: the billing country is what decides the regional rate, and
      // Stripe only returns an address if we ask for one.
      billing_address_collection: "required",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: next.amountCents,
          product_data: {
            name: plan === "full"
              ? "Square 1 AI Bootcamp — tuition, paid in full"
              : `Square 1 AI Bootcamp — payment ${next.number} of 3`,
          },
        },
      }],
      // Everything the webhook needs to enrol without trusting its own inputs.
      metadata: {
        applicationId: application.id,
        plan,
        claimedRegion: region,
        instalment: String(next.number),
      },
      // THE SAME METADATA ON THE PAYMENT INTENT, AND IT IS NOT REDUNDANT.
      // Stripe does not copy session metadata onto the PaymentIntent, and
      // payment_intent.payment_failed delivers the INTENT, not the session. The
      // failure handler reads applicationId off the intent — without this it
      // finds nothing, and the suspension path is dead code that looks alive.
      payment_intent_data: {
        metadata: {
          applicationId: application.id,
          plan,
          claimedRegion: region,
          instalment: String(next.number),
        },
      },
      success_url: siteUrl(`/bootcamp/application/${application.id}?paid=1`),
      cancel_url: siteUrl(`/bootcamp/application/${application.id}`),
    });

    return NextResponse.json({ url: session.url, amountCents: next.amountCents });
  } catch (err) {
    console.error("[bootcamp/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
