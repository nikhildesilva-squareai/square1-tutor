import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/messages/[messageId]/reactions
 * Get all reactions on a message
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = await createClient();
    const { messageId } = params;

    // Get reaction counts aggregated by emoji
    const { data: reactionCounts, error: countsError } = await supabase
      .from("message_reaction_counts")
      .select("emoji, count, reactor_ids")
      .eq("message_id", messageId)
      .order("count", { ascending: false });

    if (countsError) {
      console.error("Error fetching reactions:", countsError);
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      );
    }

    // Get all individual reactions (for user who reacted)
    const { data: { user } } = await supabase.auth.getUser();
    let userReactions: string[] = [];

    if (user) {
      const { data: profile } = await supabase
        .from("community_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const { data: reactions } = await supabase
          .from("message_reactions")
          .select("emoji")
          .eq("message_id", messageId)
          .eq("reactor_profile_id", profile.id);

        userReactions = reactions?.map(r => r.emoji) ?? [];
      }
    }

    return NextResponse.json({
      reactions: reactionCounts || [],
      userReactions,
      totalReactions: reactionCounts?.reduce((sum, r) => sum + r.count, 0) ?? 0,
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
 * POST /api/communities/[id]/messages/[messageId]/reactions
 * Add a reaction to a message
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emoji } = await req.json();
    const { messageId } = params;

    // Validate emoji
    if (!emoji || typeof emoji !== "string" || emoji.trim() === "") {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 500 }
      );
    }

    // Verify message exists
    const { data: message } = await supabase
      .from("community_messages")
      .select("id")
      .eq("id", messageId)
      .maybeSingle();

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Add reaction (upsert in case of duplicate)
    const { data: reaction, error } = await supabase
      .from("message_reactions")
      .insert({
        message_id: messageId,
        reactor_profile_id: profile.id,
        emoji: emoji.trim(),
      })
      .select()
      .maybeSingle();

    if (error) {
      // Check if it's a unique constraint violation (already reacted with this emoji)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already reacted with this emoji" },
          { status: 400 }
        );
      }

      console.error("Error adding reaction:", error);
      return NextResponse.json(
        { error: "Failed to add reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]/messages/[messageId]/reactions?emoji=👍
 * Remove a reaction from a message
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const emoji = searchParams.get("emoji");
    const { messageId } = params;

    if (!emoji) {
      return NextResponse.json(
        { error: "Emoji query parameter required" },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 500 }
      );
    }

    // Delete reaction
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("reactor_profile_id", profile.id)
      .eq("emoji", emoji);

    if (error) {
      console.error("Error removing reaction:", error);
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
