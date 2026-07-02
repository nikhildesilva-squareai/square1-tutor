import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/communities/[id]/members/[memberId]
 * Update member role or status (founder/moderator only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, isMuted, mutedReason } = await req.json();
    const communityId = params.id;
    const memberRowId = params.memberId;

    // Verify user is founder or moderator
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

    const { data: actorProfile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!actorProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 500 }
      );
    }

    // Check if user is founder or moderator
    const { data: actorMembership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("profile_id", actorProfile.id)
      .maybeSingle();

    const isFounder = community.creator_id === actorProfile.id;
    const isModerator = actorMembership?.role === "moderator";

    if (!isFounder && !isModerator) {
      return NextResponse.json(
        { error: "Only founders and moderators can manage members" },
        { status: 403 }
      );
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from("community_members")
      .select("id, profile_id, role, is_muted")
      .eq("id", memberRowId)
      .eq("community_id", communityId)
      .maybeSingle();

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Validate role change (only founder can assign moderator/creator)
    if (role && role !== targetMember.role) {
      if ((role === "moderator" || role === "creator") && !isFounder) {
        return NextResponse.json(
          { error: "Only founder can assign moderator/creator roles" },
          { status: 403 }
        );
      }

      if (role === "creator") {
        return NextResponse.json(
          { error: "Cannot reassign creator role" },
          { status: 400 }
        );
      }
    }

    // Prepare update
    const updates: any = {};
    const actionDetails: any = {};

    if (role && role !== targetMember.role) {
      updates.role = role;
      actionDetails.previous_role = targetMember.role;
      actionDetails.new_role = role;
    }

    if (isMuted !== undefined && isMuted !== targetMember.is_muted) {
      updates.is_muted = isMuted;
      updates.muted_reason = isMuted ? mutedReason || null : null;
      updates.muted_at = isMuted ? new Date().toISOString() : null;
      updates.muted_by_id = isMuted ? actorProfile.id : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400 }
      );
    }

    // Update member
    const { data: updatedMember, error: updateError } = await supabase
      .from("community_members")
      .update(updates)
      .eq("id", memberRowId)
      .select(
        `
        id,
        profile_id,
        role,
        joined_at,
        is_muted,
        muted_reason,
        community_profiles!inner(
          id,
          avatar_url,
          bio
        )
      `
      )
      .maybeSingle();

    if (updateError || !updatedMember) {
      console.error("Error updating member:", updateError);
      return NextResponse.json(
        { error: "Failed to update member" },
        { status: 500 }
      );
    }

    // Log action
    const actionType = Object.keys(actionDetails).length > 0
      ? Object.keys(actionDetails)[0].includes("role") ? "role_assigned" : "muted"
      : isMuted === false ? "unmuted" : "muted";

    await supabase.from("member_moderation_log").insert({
      community_id: communityId,
      member_id: targetMember.id,
      actor_id: actorProfile.id,
      action: actionType,
      action_details: actionDetails,
      reason: mutedReason,
    });

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        profileId: updatedMember.profile_id,
        role: updatedMember.role,
        joinedAt: updatedMember.joined_at,
        isMuted: updatedMember.is_muted,
        mutedReason: updatedMember.muted_reason,
        profile: updatedMember.community_profiles,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
