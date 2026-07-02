import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/communities/[id]/payments/create-intent
 * Create a Stripe payment intent for subscription
 * Body: { subscription_type: 'monthly' | 'annual' }
 *
 * Returns: { clientSecret, amount, currency, subscription_type }
 * Client uses clientSecret with Stripe to complete payment
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const communityId = (await params).id;
    const { subscription_type } = await req.json();

    // Validate subscription type
    if (!["monthly", "annual"].includes(subscription_type)) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 }
      );
    }

    // Get community info
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, name, creator_id")
      .eq("id", communityId)
      .maybeSingle();

    if (communityError) throw communityError;

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Get monetization settings
    const { data: settings, error: settingsError } = await supabase
      .from("community_monetization_settings")
      .select("*")
      .eq("community_id", communityId)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (!settings || !settings.is_monetized) {
      return NextResponse.json(
        { error: "Community does not accept paid subscriptions" },
        { status: 400 }
      );
    }

    // Get pricing
    let amount = 0;
    if (subscription_type === "monthly") {
      amount = Math.round((settings.monthly_price || 0) * 100); // Convert to cents
    } else {
      amount = Math.round((settings.annual_price || 0) * 100);
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Invalid pricing for this subscription type" },
        { status: 400 }
      );
    }

    // Check if user already subscribed
    const { data: existing } = await supabase
      .from("community_subscriptions")
      .select("id, status")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing && existing.status === "active") {
      return NextResponse.json(
        { error: "Already subscribed to this community" },
        { status: 400 }
      );
    }

    // Get creator info for Stripe
    const { data: creator } = await supabase
      .from("community_profiles")
      .select("id, user_id, stripe_account_id")
      .eq("id", community.creator_id)
      .maybeSingle();

    // Create a Stripe payment intent
    // In production, this would call Stripe API:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount,
    //   currency: 'usd',
    //   metadata: {
    //     community_id: communityId,
    //     user_id: user.id,
    //     subscription_type,
    //     creator_id: community.creator_id,
    //   },
    //   on_behalf_of: creator?.stripe_account_id, // For connected account
    // });

    // For MVP, return a mock client secret
    const clientSecret = `pi_${communityId}_${user.id}_${Date.now()}`;

    // Store the payment intent reference in a pending transaction
    const { data: transaction, error: txError } = await supabase
      .from("community_transactions")
      .insert({
        community_id: communityId,
        user_id: user.id,
        creator_id: community.creator_id,
        amount: amount / 100, // Convert back to dollars
        platform_fee: (amount / 100) * 0.1,
        creator_earnings: (amount / 100) * 0.9,
        subscription_type,
        stripe_payment_intent_id: clientSecret,
        status: "pending",
      })
      .select()
      .single();

    if (txError) throw txError;

    return NextResponse.json(
      {
        clientSecret,
        amount,
        currency: settings.currency || "USD",
        subscription_type,
        transactionId: transaction.id,
        communityName: community.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
