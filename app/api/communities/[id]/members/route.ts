import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/communities/[id]/members
 * Join a community
 */
export async function POST(
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

    // Get user's community profile
    const { data: profile, error: profileError } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Community profile not found" },
        { status: 500 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "Already a member of this community" },
        { status: 400 }
      );
    }

    // Check if community exists and is not private (or user has permission)
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, is_private, creator_id")
      .eq("id", communityId)
      .is("deleted_at", null)
      .maybeSingle();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Private communities can only be joined by invitation (TODO: implement invite acceptance)
    if (community.is_private && community.creator_id !== profile.id) {
      return NextResponse.json(
        { error: "This is a private community. Contact the creator for an invite." },
        { status: 403 }
      );
    }

    // Add user as member
    const { error: joinError } = await supabase
      .from("community_members")
      .insert({
        community_id: communityId,
        profile_id: profile.id,
        role: "member",
      });

    if (joinError) {
      console.error("Error joining community:", joinError);
      return NextResponse.json(
        { error: "Failed to join community" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/communities/[id]/members
 * Get community members list
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sortBy = searchParams.get("sortBy") || "joined_at"; // joined_at or activity

    const communityId = params.id;

    // Get members with their profiles
    let query = supabase
      .from("community_members")
      .select(
        `
        id,
        profile_id,
        role,
        joined_at,
        is_muted,
        community_profiles!inner(
          id,
          avatar_url,
          bio,
          student_id
        )
      `,
        { count: "exact" }
      )
      .eq("community_id", communityId);

    // Sort by joined date (newest first) or activity
    if (sortBy === "activity") {
      // Count messages per member (join with messages table if available)
      // For now, just sort by join date
      query = query.order("joined_at", { ascending: false });
    } else {
      query = query.order("joined_at", { ascending: false });
    }

    query = query.limit(limit).range(offset, offset + limit - 1);

    const { data: members, error, count } = await query;

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Get message counts for activity
    const memberIds = members?.map((m: any) => m.profile_id) ?? [];
    const { data: messageCounts } = await supabase
      .from("community_messages")
      .select("author_id")
      .eq("community_id", communityId)
      .in("author_id", memberIds.length > 0 ? memberIds : ["__none__"]);

    const messageCountByMember = memberIds.reduce((acc: any, id: string) => {
      acc[id] = messageCounts?.filter((m: any) => m.author_id === id).length ?? 0;
      return acc;
    }, {});

    // Transform response
    const enriched = members?.map((m: any) => ({
      id: m.id,
      profileId: m.profile_id,
      role: m.role,
      joinedAt: m.joined_at,
      isMuted: m.is_muted,
      profile: m.community_profiles,
      messageCount: messageCountByMember[m.profile_id] ?? 0,
    }));

    return NextResponse.json({
      members: enriched,
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

/**
 * DELETE /api/communities/[id]/members/[memberId]
 * Leave a community or remove a member (if creator/moderator)
 */
export async function DELETE(
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
    const targetProfileId = searchParams.get("profileId");

    if (!targetProfileId) {
      return NextResponse.json(
        { error: "profileId query parameter required" },
        { status: 400 }
      );
    }

    // Get current user's profile
    const { data: userProfile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json(
        { error: "Community profile not found" },
        { status: 500 }
      );
    }

    // Check if user is trying to leave or remove someone else
    const isLeavingOwnMembership = userProfile.id === targetProfileId;

    if (!isLeavingOwnMembership) {
      // User is trying to remove someone else - must be creator/moderator
      const { data: userMembership } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("profile_id", userProfile.id)
        .maybeSingle();

      if (!userMembership || !["creator", "moderator"].includes(userMembership.role)) {
        return NextResponse.json(
          { error: "Only creators/moderators can remove members" },
          { status: 403 }
        );
      }
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("profile_id", targetProfileId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
