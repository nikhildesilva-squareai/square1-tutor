import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler for payment events
 *
 * Events handled:
 * - payment_intent.succeeded: Complete subscription and transaction
 * - payment_intent.payment_failed: Mark transaction as failed
 * - customer.subscription.deleted: Cancel subscription
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();

    // In production, verify webhook signature:
    // const sig = req.headers.get('stripe-signature');
    // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    // For MVP, parse the event directly
    const event = JSON.parse(body);

    // Initialize Supabase with service role for webhook operations
    const supabase = await createClient();

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(supabase, event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}

async function handlePaymentSucceeded(
  supabase: any,
  paymentIntent: any
) {
  try {
    const { community_id, user_id, subscription_type, creator_id } =
      paymentIntent.metadata;

    if (!community_id || !user_id) {
      console.error("Missing metadata in payment intent");
      return;
    }

    // Update transaction status to completed
    const { error: txError } = await supabase
      .from("community_transactions")
      .update({
        status: "completed",
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.client_secret);

    if (txError) throw txError;

    // Create or update subscription
    const { data: existing } = await supabase
      .from("community_subscriptions")
      .select("id")
      .eq("community_id", community_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      // Update existing subscription
      await supabase
        .from("community_subscriptions")
        .update({
          status: "active",
          stripe_subscription_id: paymentIntent.id,
          current_period_start: new Date().toISOString(),
          current_period_end: calculatePeriodEnd(subscription_type),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new subscription
      await supabase
        .from("community_subscriptions")
        .insert({
          community_id,
          user_id,
          subscription_type,
          status: "active",
          stripe_subscription_id: paymentIntent.id,
          stripe_customer_id: paymentIntent.customer,
          current_period_start: new Date().toISOString(),
          current_period_end: calculatePeriodEnd(subscription_type),
        });
    }

    // Update earnings summary
    await updateEarningsSummary(supabase, community_id);

    console.log(`Payment succeeded for user ${user_id} in community ${community_id}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

async function handlePaymentFailed(
  supabase: any,
  paymentIntent: any
) {
  try {
    const { community_id, user_id } = paymentIntent.metadata;

    if (!community_id || !user_id) {
      console.error("Missing metadata in payment intent");
      return;
    }

    // Update transaction status to failed
    const { error } = await supabase
      .from("community_transactions")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) throw error;

    console.log(`Payment failed for user ${user_id} in community ${community_id}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: any
) {
  try {
    const communityId = subscription.metadata?.community_id;
    const userId = subscription.metadata?.user_id;

    if (!communityId || !userId) {
      console.error("Missing metadata in subscription");
      return;
    }

    // Cancel subscription
    const { error } = await supabase
      .from("community_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("community_id", communityId)
      .eq("user_id", userId);

    if (error) throw error;

    // Update earnings summary
    await updateEarningsSummary(supabase, communityId);

    console.log(`Subscription cancelled for user ${userId} in community ${communityId}`);
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}

function calculatePeriodEnd(subscriptionType: string): string {
  const now = new Date();
  if (subscriptionType === "monthly") {
    now.setMonth(now.getMonth() + 1);
  } else if (subscriptionType === "annual") {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
}

async function updateEarningsSummary(
  supabase: any,
  communityId: string
) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get subscription counts
    const { data: subscriptions } = await supabase
      .from("community_subscriptions")
      .select("subscription_type, status")
      .eq("community_id", communityId);

    const activeMembers = subscriptions?.filter(
      (s: { status: string; subscription_type: string }) => s.status === "active"
    ).length || 0;
    const paidMembers = subscriptions?.filter(
      (s: { status: string; subscription_type: string }) => s.status === "active" && ["monthly", "annual"].includes(s.subscription_type)
    ).length || 0;
    const freeMembers = subscriptions?.filter(
      (s: { status: string; subscription_type: string }) => s.status === "active" && s.subscription_type === "free"
    ).length || 0;

    // Get transactions for month
    const { data: transactions } = await supabase
      .from("community_transactions")
      .select("creator_earnings")
      .eq("community_id", communityId)
      .eq("status", "completed")
      .gte("created_at", monthStart.toISOString());

    const totalRevenue = transactions?.reduce(
      (sum: number, tx: { creator_earnings: string }) => sum + parseFloat(tx.creator_earnings),
      0
    ) || 0;

    // Upsert earnings summary
    await supabase
      .from("community_earnings_summary")
      .upsert({
        community_id: communityId,
        month_year: monthStart,
        total_revenue: totalRevenue,
        total_members: activeMembers,
        paid_members: paidMembers,
        free_members: freeMembers,
        updated_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error("Error updating earnings summary:", error);
    // Don't throw - webhook should not fail on summary update
  }
}
