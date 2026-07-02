import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/pinned
 * Get pinned messages for community
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const communityId = params.id;

    const { data: pinned, error } = await supabase
      .from("pinned_messages")
      .select(
        `
        id,
        message_id,
        pin_title,
        pin_description,
        pin_category,
        pin_order,
        expires_at,
        views,
        pinned_at,
        community_messages(
          id,
          content,
          author_id,
          created_at,
          community_profiles!author_id(
            id,
            avatar_url,
            bio
          )
        )
      `
      )
      .eq("community_id", communityId)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("pin_order", { ascending: true })
      .order("pinned_at", { ascending: false });

    if (error) {
      console.error("Error fetching pinned messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch pinned messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pinned: pinned || [],
      count: pinned?.length || 0,
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
 * POST /api/communities/[id]/pinned
 * Pin a message (founder only)
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

    const { messageId, pinTitle, pinDescription, pinCategory, expiresAt } =
      await req.json();
    const communityId = params.id;

    // Validate inputs
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    if (!pinTitle || !pinTitle.trim()) {
      return NextResponse.json(
        { error: "Pin title is required" },
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
      .select("id, user_id")
      .eq("id", community.creator_id)
      .maybeSingle();

    if (!creatorProfile || creatorProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only community founder can pin messages" },
        { status: 403 }
      );
    }

    // Verify message exists
    const { data: message } = await supabase
      .from("community_messages")
      .select("id")
      .eq("id", messageId)
      .eq("community_id", communityId)
      .maybeSingle();

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Create pinned message
    const { data: pinned, error } = await supabase
      .from("pinned_messages")
      .insert({
        community_id: communityId,
        message_id: messageId,
        pinned_by_id: creatorProfile.id,
        pin_title: pinTitle.trim(),
        pin_description: pinDescription || null,
        pin_category: pinCategory || "announcement",
        expires_at: expiresAt || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error pinning message:", error);
      return NextResponse.json(
        { error: "Failed to pin message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pinned }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
