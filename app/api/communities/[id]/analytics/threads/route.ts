import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/analytics/threads
 * Get thread engagement analytics for a community
 * Query params: sortBy (replies|engagement|depth), limit, messageId (optional)
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
    const sortBy = searchParams.get("sortBy") || "replies";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const messageId = searchParams.get("messageId");

    // Verify community access
    const { data: community } = await supabase
      .from("communities")
      .select("visibility")
      .eq("id", communityId)
      .maybeSingle();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

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

    let analyticsQuery = supabase
      .from("thread_analytics")
      .select(
        `
        message_id,
        total_replies,
        unique_responders,
        thread_depth,
        max_reply_depth,
        total_reactions,
        first_reply_at,
        last_reply_at,
        avg_response_time_minutes,
        median_response_time_minutes,
        community_messages!message_id (
          id,
          content,
          posted_by_id,
          created_at,
          community_profiles!posted_by_id (id, bio, avatar_url)
        )
      `
      )
      .eq("community_id", communityId)
      .gt("total_replies", 0); // Only threads with replies

    // Sort
    switch (sortBy) {
      case "engagement":
        analyticsQuery = analyticsQuery.order("unique_responders", {
          ascending: false,
        });
        break;
      case "depth":
        analyticsQuery = analyticsQuery.order("thread_depth", {
          ascending: false,
        });
        break;
      case "replies":
      default:
        analyticsQuery = analyticsQuery.order("total_replies", {
          ascending: false,
        });
    }

    analyticsQuery = analyticsQuery.limit(limit);

    const { data: threads, error } = await analyticsQuery;

    if (error) {
      throw error;
    }

    // Get member engagement summary if messageId provided
    let memberEngagement = null;
    if (messageId) {
      const { data: engagement } = await supabase
        .from("member_thread_engagement")
        .select(
          `
          member_id,
          reply_count,
          reaction_count,
          first_reply_at,
          last_engagement_at,
          community_profiles!member_id (id, bio, avatar_url)
        `
        )
        .eq("message_id", messageId)
        .order("reply_count", { ascending: false })
        .limit(10);

      memberEngagement = engagement;
    }

    // Get response time statistics
    const { data: responseTimes } = await supabase
      .from("thread_response_times")
      .select("response_time_minutes")
      .eq("message_id", messageId || "")
      .not("response_time_minutes", "is", null);

    let responseTimeStats = null;
    if (responseTimes && responseTimes.length > 0) {
      const times = responseTimes.map((r: any) => r.response_time_minutes);
      const sorted = [...times].sort((a, b) => a - b);
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const median =
        sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];

      responseTimeStats = {
        averageMinutes: Math.round(average),
        medianMinutes: Math.round(median),
        minMinutes: Math.min(...times),
        maxMinutes: Math.max(...times),
        totalResponses: times.length,
      };
    }

    return NextResponse.json({
      sortBy,
      communityId,
      threads: (threads || []).map((t: any) => ({
        messageId: t.message_id,
        originalMessage: {
          id: t.community_messages.id,
          content: t.community_messages.content,
          author: t.community_messages.community_profiles,
          createdAt: t.community_messages.created_at,
        },
        metrics: {
          totalReplies: t.total_replies,
          uniqueResponders: t.unique_responders,
          threadDepth: t.thread_depth,
          maxReplyDepth: t.max_reply_depth,
          totalReactions: t.total_reactions,
          averageResponseTimeMinutes: t.avg_response_time_minutes,
          medianResponseTimeMinutes: t.median_response_time_minutes,
        },
        timeline: {
          firstReplyAt: t.first_reply_at,
          lastReplyAt: t.last_reply_at,
          durationMinutes: t.last_reply_at
            ? Math.round(
                (new Date(t.last_reply_at).getTime() -
                  new Date(t.first_reply_at).getTime()) /
                  60000
              )
            : 0,
        },
      })),
      memberEngagement: memberEngagement
        ? memberEngagement.map((e: any) => ({
            memberId: e.member_id,
            profile: e.community_profiles,
            replies: e.reply_count,
            reactions: e.reaction_count,
            firstReplyAt: e.first_reply_at,
            lastEngagementAt: e.last_engagement_at,
          }))
        : null,
      responseTimeStats,
    });
  } catch (error) {
    console.error("Thread analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread analytics" },
      { status: 500 }
    );
  }
}
