import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { reviewFlag, escalateFlag } from "@/lib/community/moderation";

/**
 * PATCH /api/communities/[id]/moderation/flags/[flagId]
 * Review a moderation flag (founder action)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; flagId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, notes, escalate } = await req.json();
    const communityId = params.id;
    const flagId = params.flagId;

    // Validate action
    if (!["approved", "deleted", "warned_author", "dismissed"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

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

    const { data: creatorProfile } = await supabase
      .from("community_profiles")
      .select("id, user_id")
      .eq("id", community.creator_id)
      .maybeSingle();

    if (!creatorProfile || creatorProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only community founder can review flags" },
        { status: 403 }
      );
    }

    // Verify flag belongs to this community
    const { data: flag } = await supabase
      .from("moderation_flags")
      .select("community_id, id")
      .eq("id", flagId)
      .maybeSingle();

    if (!flag || flag.community_id !== communityId) {
      return NextResponse.json(
        { error: "Flag not found" },
        { status: 404 }
      );
    }

    // Review the flag
    await reviewFlag(flagId, creatorProfile.id, action, notes);

    // Escalate if requested
    if (escalate) {
      await escalateFlag(flagId, creatorProfile.id, notes);
    }

    // Get updated flag
    const { data: updatedFlag } = await supabase
      .from("moderation_flags")
      .select(
        `
        id,
        message_id,
        author_id,
        flag_reason,
        ai_confidence,
        ai_explanation,
        status,
        reviewer_action,
        reviewer_notes,
        escalated_to_square1,
        reviewed_at,
        escalated_at
      `
      )
      .eq("id", flagId)
      .maybeSingle();

    return NextResponse.json({ flag: updatedFlag });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
