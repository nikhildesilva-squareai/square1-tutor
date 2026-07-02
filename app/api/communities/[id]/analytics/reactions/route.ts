import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/analytics/reactions
 * Get reaction analytics for a community
 * Query params: timeframe (week|month|all), topN (default 10), memberId (optional)
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);

    const communityId = params.id;
    const timeframe = searchParams.get("timeframe") || "month";
    const topN = Math.min(parseInt(searchParams.get("topN") || "10"), 50);
    const memberId = searchParams.get("memberId");

    // Verify community access
    const { data: community } = await supabase
      .from("communities")
      .select("visibility")
      .eq("id", communityId)
      .maybeSingle();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check membership for private communities
    if (community.visibility === "private" && user) {
      const { data: membership } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    let emojiStatsQuery = supabase
      .from("community_emoji_statistics")
      .select("emoji, total_usage, unique_users, last_used_at")
      .eq("community_id", communityId)
      .order("total_usage", { ascending: false })
      .limit(topN);

    // Apply timeframe filter
    const now = new Date();
    let dateFrom: Date | null = null;

    switch (timeframe) {
      case "week":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    if (dateFrom) {
      emojiStatsQuery = emojiStatsQuery.gte("last_used_at", dateFrom.toISOString());
    }

    const { data: emojiStats, error: emojiError } = await emojiStatsQuery;

    if (emojiError) {
      throw emojiError;
    }

    // Get member preferences if memberId provided
    let memberPreferences = null;
    if (memberId) {
      const { data: prefs } = await supabase
        .from("member_reaction_preferences")
        .select("emoji, usage_count")
        .eq("community_id", communityId)
        .eq("member_id", memberId)
        .order("usage_count", { ascending: false })
        .limit(topN);

      memberPreferences = prefs;
    }

    // Get top responders (members who react most)
    const { data: topReactors } = await supabase
      .from("member_reaction_preferences")
      .select(
        `
        member_id,
        community_profiles!member_id (id, bio, avatar_url),
        total_reactions: usage_count
      `
      )
      .eq("community_id", communityId)
      .order("usage_count", { ascending: false })
      .limit(10);

    return NextResponse.json({
      timeframe,
      communityId,
      topEmojis: (emojiStats || []).map((e: any) => ({
        emoji: e.emoji,
        totalUsage: e.total_usage,
        uniqueUsers: e.unique_users,
        lastUsedAt: e.last_used_at,
      })),
      memberPreferences: memberPreferences
        ? memberPreferences.map((p: any) => ({
            emoji: p.emoji,
            usageCount: p.usage_count,
          }))
        : null,
      topReactors: topReactors
        ? topReactors.map((r: any) => ({
            memberId: r.member_id,
            profile: r.community_profiles,
            totalReactions: r.total_reactions,
          }))
        : [],
    });
  } catch (error) {
    console.error("Reaction analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reaction analytics" },
      { status: 500 }
    );
  }
}
