import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/subscriptions
 * Get user's subscription to a community
 */
export async function GET(
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

    const { data: subscription, error } = await supabase
      .from("community_subscriptions")
      .select("*")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!subscription) {
      return NextResponse.json(
        { error: "Not subscribed to this community" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/subscriptions
 * Create or join a community subscription
 * Body: { subscription_type: 'free' | 'monthly' | 'annual' }
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
    if (!["free", "monthly", "annual"].includes(subscription_type)) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 }
      );
    }

    // Get community monetization settings
    const { data: settings, error: settingsError } = await supabase
      .from("community_monetization_settings")
      .select("*")
      .eq("community_id", communityId)
      .maybeSingle();

    if (settingsError) throw settingsError;

    // Validate subscription against community settings
    if (subscription_type === "free" && !settings?.allow_free_tier) {
      return NextResponse.json(
        { error: "Free tier not allowed for this community" },
        { status: 400 }
      );
    }

    if (
      ["monthly", "annual"].includes(subscription_type) &&
      !settings?.is_monetized
    ) {
      return NextResponse.json(
        { error: "Paid subscriptions not available for this community" },
        { status: 400 }
      );
    }

    // Check if user already subscribed
    const { data: existing } = await supabase
      .from("community_subscriptions")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed to this community" },
        { status: 400 }
      );
    }

    // Get pricing from settings
    const monthlyPrice =
      subscription_type === "monthly" ? settings?.monthly_price : null;
    const annualPrice =
      subscription_type === "annual" ? settings?.annual_price : null;

    // Create subscription
    const { data: subscription, error } = await supabase
      .from("community_subscriptions")
      .insert({
        community_id: communityId,
        user_id: user.id,
        subscription_type,
        monthly_price: monthlyPrice,
        annual_price: annualPrice,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]/subscriptions
 * Update subscription (e.g., change plan type)
 * Body: { subscription_type?: 'monthly' | 'annual', status?: 'active' | 'cancelled' }
 */
export async function PATCH(
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
    const { subscription_type, status } = await req.json();

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from("community_subscriptions")
      .select("*")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) throw subError;

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Handle status change (e.g., cancellation)
    if (status === "cancelled") {
      updateData.status = "cancelled";
      updateData.cancelled_at = new Date().toISOString();
    } else if (status) {
      updateData.status = status;
    }

    // Handle plan change
    if (subscription_type && subscription_type !== subscription.subscription_type) {
      // Get updated pricing
      const { data: settings } = await supabase
        .from("community_monetization_settings")
        .select("*")
        .eq("community_id", communityId)
        .maybeSingle();

      if (subscription_type === "monthly" && settings?.monthly_price) {
        updateData.subscription_type = "monthly";
        updateData.monthly_price = settings.monthly_price;
        updateData.annual_price = null;
      } else if (subscription_type === "annual" && settings?.annual_price) {
        updateData.subscription_type = "annual";
        updateData.monthly_price = null;
        updateData.annual_price = settings.annual_price;
      }
    }

    // Update subscription
    const { data: updated, error } = await supabase
      .from("community_subscriptions")
      .update(updateData)
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
