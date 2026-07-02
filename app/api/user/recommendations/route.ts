import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserRecommendations, dismissRecommendation } from "@/lib/community/sharing";

/**
 * GET /api/user/recommendations
 * Get community recommendations for current user
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const recommendations = await getUserRecommendations(user.id, limit);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/recommendations/[recommendationId]
 * Dismiss a recommendation
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recommendationId } = await req.json();

    if (!recommendationId) {
      return NextResponse.json(
        { error: "Recommendation ID required" },
        { status: 400 }
      );
    }

    // Verify recommendation belongs to user
    const { data: recommendation } = await supabase
      .from("community_recommendations")
      .select("user_id")
      .eq("id", recommendationId)
      .maybeSingle();

    if (!recommendation || recommendation.user_id !== user.id) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    await dismissRecommendation(recommendationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
