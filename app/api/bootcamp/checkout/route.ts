import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOTCAMP_PRICING, regionForCountry, type PriceRegion } from "@/lib/bootcamp/pricing";
import { dueOnAcceptanceCents, isOfferLive } from "@/lib/bootcamp/enrolment";
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
//   Charge twice. Tuition is a SINGLE payment, so a paid application has nothing
//   left to collect and a second session must not open.
//
// THE REGION HERE IS PROVISIONAL. It comes from the student's own profile
// country, which is self-declared. It is re-checked at settlement in the webhook
// against the card's billing country via verifyRegionAtCheckout() — a ~$400 gap
// makes editing a profile field worth someone's time.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// No plan field: tuition is a single payment. Accepting a plan from the client
// would be accepting an amount from the client by another name.
const schema = z.object({
  applicationId: z.string().regex(UUID),
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
    const { applicationId } = parsed.data;
    const plan = "full" as const;

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

    // Already paid? Then there is nothing to collect, and opening a second
    // session would take someone's money twice. With a single payment this is
    // also the "already enrolled" check — the two are the same fact now.
    const { count: paidCount } = await admin
      .from("bootcamp_payments")
      .select("id", { count: "exact", head: true })
      .eq("application_id", application.id)
      .eq("status", "paid");
    if ((paidCount ?? 0) > 0) {
      return NextResponse.json({ error: "This is already paid." }, { status: 409 });
    }

    // Unconditional: every payment is the first payment, so a lapsed offer means
    // the seat is genuinely gone.
    if (!isOfferLive(application.offer_expires_at)) {
      return NextResponse.json(
        { error: "This offer has expired and the seat has gone back to the pool." },
        { status: 409 },
      );
    }

    const region: PriceRegion = regionForCountry(student.country);
    const prices = BOOTCAMP_PRICING[region].plans;

    const amountCents = dueOnAcceptanceCents(prices, plan);

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
          unit_amount: amountCents,
          product_data: { name: "Square 1 AI Bootcamp — tuition" },
        },
      }],
      // Everything the webhook needs to enrol without trusting its own inputs.
      metadata: {
        applicationId: application.id,
        plan,
        claimedRegion: region,
      },
      // THE SAME METADATA ON THE PAYMENT INTENT, AND IT IS NOT REDUNDANT.
      // Stripe does not copy session metadata onto the PaymentIntent, and
      // payment_intent.payment_failed delivers the INTENT, not the session. The
      // failure handler reads applicationId off the intent — without this it
      // finds nothing and a declined card goes unrecorded.
      payment_intent_data: {
        metadata: {
          applicationId: application.id,
          plan,
          claimedRegion: region,
        },
      },
      success_url: siteUrl(`/bootcamp/application/${application.id}?paid=1`),
      cancel_url: siteUrl(`/bootcamp/application/${application.id}`),
    });

    return NextResponse.json({ url: session.url, amountCents });
  } catch (err) {
    console.error("[bootcamp/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
