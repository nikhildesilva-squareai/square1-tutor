import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPendingFlags, reviewFlag, escalateFlag } from "@/lib/community/moderation";

/**
 * GET /api/communities/[id]/moderation/flags
 * Get pending moderation flags for community (founder only)
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const communityId = params.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Verify user is community founder
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

    // Get creator's profile to verify
    const { data: creatorProfile } = await supabase
      .from("community_profiles")
      .select("user_id")
      .eq("id", community.creator_id)
      .maybeSingle();

    if (!creatorProfile || creatorProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only community founder can view moderation flags" },
        { status: 403 }
      );
    }

    // Get pending flags
    const { flags, count } = await getPendingFlags(communityId, limit, offset);

    return NextResponse.json({
      flags: flags?.map((f: any) => ({
        id: f.id,
        messageId: f.message_id,
        authorId: f.author_id,
        flagReason: f.flag_reason,
        aiConfidence: f.ai_confidence,
        aiExplanation: f.ai_explanation,
        status: f.status,
        createdAt: f.created_at,
        message: f.community_messages,
        author: f.community_profiles,
      })),
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
