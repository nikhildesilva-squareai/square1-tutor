import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/rules
 * Get community rules
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const communityId = (await params).id;

    const { data: rules, error } = await supabase
      .from("community_rules")
      .select(
        `
        id,
        rule_text,
        rule_description,
        rule_category,
        order_index,
        is_active
      `
      )
      .eq("community_id", communityId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch rules" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rules: rules || [],
      count: rules?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/rules
 * Create a new rule (founder only)
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

    const { ruleText, ruleDescription, ruleCategory } = await req.json();
    const communityId = (await params).id;

    // Validate inputs
    if (!ruleText || !ruleText.trim()) {
      return NextResponse.json(
        { error: "Rule text is required" },
        { status: 400 }
      );
    }

    if (ruleText.length > 500) {
      return NextResponse.json(
        { error: "Rule text is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Verify user is founder
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

    const { data: creatorProfile } = await supabase
      .from("community_profiles")
      .select("user_id")
      .eq("id", community.creator_id)
      .maybeSingle();

    if (!creatorProfile || creatorProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only community founder can add rules" },
        { status: 403 }
      );
    }

    // Get next order index
    const { data: lastRule } = await supabase
      .from("community_rules")
      .select("order_index")
      .eq("community_id", communityId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastRule?.order_index ?? -1) + 1;

    // Create rule
    const { data: rule, error } = await supabase
      .from("community_rules")
      .insert({
        community_id: communityId,
        rule_text: ruleText.trim(),
        rule_description: ruleDescription || null,
        rule_category: ruleCategory || "conduct",
        order_index: nextOrder,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error creating rule:", error);
      return NextResponse.json(
        { error: "Failed to create rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
