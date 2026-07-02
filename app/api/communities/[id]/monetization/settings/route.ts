import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/monetization/settings
 * Get community monetization settings
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const communityId = (await params).id;

    const { data: settings, error } = await supabase
      .from("community_monetization_settings")
      .select("*")
      .eq("community_id", communityId)
      .maybeSingle();

    if (error) throw error;

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        community_id: communityId,
        is_monetized: false,
        is_free: true,
        monthly_price: null,
        annual_price: null,
        currency: "USD",
        allow_free_tier: true,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Monetization settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monetization settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/monetization/settings
 * Create or update monetization settings (creator only)
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
    const body = await req.json();

    // Verify user is the creator
    const { data: community } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .maybeSingle();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.id !== community.creator_id) {
      return NextResponse.json(
        { error: "Only community creator can update monetization" },
        { status: 403 }
      );
    }

    // Validate pricing
    const { is_monetized, is_free, monthly_price, annual_price, allow_free_tier } = body;

    if (is_monetized && !is_free) {
      // Paid community requires pricing
      if (!monthly_price || monthly_price < 1) {
        return NextResponse.json(
          { error: "Monthly price must be at least $1" },
          { status: 400 }
        );
      }
    }

    if (annual_price && annual_price < 12) {
      return NextResponse.json(
        { error: "Annual price must be at least $12" },
        { status: 400 }
      );
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from("community_monetization_settings")
      .upsert({
        community_id: communityId,
        is_monetized,
        is_free,
        monthly_price: is_free ? null : monthly_price,
        annual_price,
        allow_free_tier,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(settings, { status: 201 });
  } catch (error) {
    console.error("Monetization settings error:", error);
    return NextResponse.json(
      { error: "Failed to update monetization settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]/monetization/settings
 * Update specific monetization settings
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
    const body = await req.json();

    // Verify user is the creator
    const { data: community } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .maybeSingle();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.id !== community.creator_id) {
      return NextResponse.json(
        { error: "Only community creator can update monetization" },
        { status: 403 }
      );
    }

    // Get current settings
    const { data: currentSettings } = await supabase
      .from("community_monetization_settings")
      .select("*")
      .eq("community_id", communityId)
      .maybeSingle();

    // Prepare update object
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // If switching to paid, require pricing
    if (updateData.is_monetized && !updateData.is_free && !updateData.monthly_price) {
      return NextResponse.json(
        { error: "Monthly price required for paid communities" },
        { status: 400 }
      );
    }

    // If switching to free, clear pricing
    if (updateData.is_free && !updateData.is_monetized) {
      updateData.monthly_price = null;
      updateData.annual_price = null;
    }

    const { data: settings, error } = await supabase
      .from("community_monetization_settings")
      .update(updateData)
      .eq("community_id", communityId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Monetization settings error:", error);
    return NextResponse.json(
      { error: "Failed to update monetization settings" },
      { status: 500 }
    );
  }
}