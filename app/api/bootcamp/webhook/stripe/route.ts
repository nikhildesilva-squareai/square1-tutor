import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOTCAMP_PRICING, type PriceRegion } from "@/lib/bootcamp/pricing";
// The site-wide guard, not a bootcamp-specific one: the entitlement question
// ("may this card buy at the South Asia rate?") is the same for every product,
// and a second copy of that rule is a second place for it to drift.
import { verifyRegionAtCheckout } from "@/lib/pricing";
import { planTotalCents } from "@/lib/bootcamp/enrolment";
import { getStripe, webhookSecretConfigured, billingCountryFrom } from "@/lib/bootcamp/stripe";

// POST /api/bootcamp/webhook/stripe
//
// Where money becomes an enrolment. Authenticated by SIGNATURE, not by session —
// Stripe is the caller, so isAdminEmail() has nothing to check. An unsigned or
// badly-signed request is refused before its body is read as anything but text.
//
// IDEMPOTENT ON THE PAYMENT INTENT. Stripe redelivers on any non-2xx and on its
// own timeouts. s1_bootcamp_enrol() takes a row lock and then checks whether a
// PAID ledger row already carries this provider_ref; if so it returns the
// existing enrolment and writes nothing. The payment_intent is the only value
// stable across deliveries, which is why the guard keys on it rather than on the
// ledger's own uniqueness.
//
// THE REGION IS DECIDED HERE, NOT AT CHECKOUT
//
// Checkout priced the session from the student's own profile country, which is
// self-declared. This re-checks it against the country Stripe saw on the card.
// If they disagree, the LEDGER RECORDS THE ENTITLED REGION while the amount
// stays what they actually paid — so a global-card holder who claimed the South
// Asia rate simply carries an outstanding balance, rather than silently
// receiving a ~$400 discount. Nobody is refused after their money has been
// taken; the desk sees the shortfall and picks it up.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !webhookSecretConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // The RAW body is required — any parsing or re-encoding invalidates the
  // signature, which is the only thing standing between this route and anyone
  // who can POST an "enrol this person" payload.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      signature,
      process.env["STRIPE_WEBHOOK_SECRET"] as string,
    );
  } catch (err) {
    console.error("[bootcamp/webhook] bad signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // A session can complete without the money arriving (delayed methods).
        if (session.payment_status !== "paid") {
          return NextResponse.json({ received: true, ignored: "not yet paid" });
        }

        const applicationId = session.metadata?.["applicationId"];
        const plan = session.metadata?.["plan"] as "full" | undefined;
        const claimedRegion = session.metadata?.["claimedRegion"] as PriceRegion | undefined;
        if (!applicationId || !plan || !claimedRegion) {
          console.error("[bootcamp/webhook] session missing metadata", session.id);
          // 200 on purpose: retrying will not add the metadata back, and a
          // permanent failure loop buries the events that matter.
          return NextResponse.json({ received: true, ignored: "missing metadata" });
        }

        const entitledRegion: PriceRegion = verifyRegionAtCheckout(
          claimedRegion,
          billingCountryFrom(session),
        );
        const amountPaid = session.amount_total ?? 0;

        const { data: enrolmentId, error } = await admin.rpc("s1_bootcamp_enrol", {
          p_application_id: applicationId,
          p_plan: plan,
          p_amount_cents: amountPaid,
          p_region: entitledRegion,
          p_provider: "stripe",
          p_provider_ref: session.payment_intent as string | null,
          p_note: entitledRegion !== claimedRegion
            ? `Region mismatch: claimed ${claimedRegion}, card billing country entitles ${entitledRegion}. Charged at the claimed rate; the balance is outstanding.`
            : null,
          p_recorded_by: "stripe-webhook",
        });

        if (error) {
          console.error("[bootcamp/webhook] enrol failed", error);
          // 500 so Stripe retries: the money is real and the enrolment is not.
          return NextResponse.json({ error: "Enrolment failed" }, { status: 500 });
        }

        await admin.from("bootcamp_audit_log").insert({
          actor_email: "stripe-webhook",
          action: "payment.succeeded",
          subject_table: "bootcamp_applications",
          subject_id: applicationId,
          reason: entitledRegion !== claimedRegion ? "region mismatch at settlement" : null,
          after_state: {
            enrolment_id: enrolmentId,
            plan,
            amount_cents: amountPaid,
            claimed_region: claimedRegion,
            entitled_region: entitledRegion,
            outstanding_cents: Math.max(
              0,
              planTotalCents(BOOTCAMP_PRICING[entitledRegion].plans, plan) - amountPaid,
            ),
            payment_intent: session.payment_intent,
          },
        });

        return NextResponse.json({ received: true, enrolmentId });
      }

      // A FAILED PAYMENT NO LONGER MEANS SUSPENSION, because tuition is a single
      // charge: if it fails, the student was never enrolled and there is nothing
      // to suspend. Their offer keeps running until its own deadline, so the
      // right response is to record what happened and leave them able to retry.
      //
      // Suspending here — as this did while a three-part plan existed — would
      // have meant reaching for an enrolment row that does not exist, and in the
      // worst case suspending someone whose earlier payment had succeeded.
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const applicationId = intent.metadata?.["applicationId"];
        if (!applicationId) {
          return NextResponse.json({ received: true, ignored: "no application" });
        }

        await admin.from("bootcamp_audit_log").insert({
          actor_email: "stripe-webhook",
          action: "payment.failed",
          subject_table: "bootcamp_applications",
          subject_id: applicationId,
          reason: intent.last_payment_error?.message ?? "card declined",
          after_state: {
            payment_intent: intent.id,
            note: "Not enrolled; the offer stands until its deadline and the student can retry.",
          },
        });

        return NextResponse.json({ received: true, recorded: true });
      }

      default:
        // Everything else is acknowledged and ignored. Returning non-2xx for an
        // event we simply do not handle would make Stripe retry it forever.
        return NextResponse.json({ received: true, ignored: event.type });
    }
  } catch (err) {
    console.error("[bootcamp/webhook]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
