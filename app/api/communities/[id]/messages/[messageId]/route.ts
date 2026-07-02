import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/communities/[id]/messages/[messageId]
 * Edit a message
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, mentions } = await req.json();
    const { messageId } = await params;

    // Validate content
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)" },
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
        { error: "Community profile not found" },
        { status: 500 }
      );
    }

    // Get message and verify ownership
    const { data: message } = await supabase
      .from("community_messages")
      .select("id, author_id, community_id")
      .eq("id", messageId)
      .maybeSingle();

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.author_id !== profile.id) {
      return NextResponse.json(
        { error: "Can only edit your own messages" },
        { status: 403 }
      );
    }

    // Update message
    const { error: updateError } = await supabase
      .from("community_messages")
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (updateError) {
      console.error("Error updating message:", updateError);
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    // Update mentions if provided
    if (mentions && Array.isArray(mentions)) {
      // Delete existing mentions
      await supabase
        .from("message_mentions")
        .delete()
        .eq("message_id", messageId);

      // Add new mentions
      if (mentions.length > 0) {
        const mentionInserts = mentions.map((profileId: string) => ({
          message_id: messageId,
          mentioned_profile_id: profileId,
        }));

        await supabase
          .from("message_mentions")
          .insert(mentionInserts);
      }
    }

    // Fetch updated message
    const { data: updatedMessage } = await supabase
      .from("community_messages")
      .select(
        `
        id,
        community_id,
        author_id,
        content,
        created_at,
        edited_at,
        community_profiles!author_id(
          id,
          avatar_url,
          bio
        ),
        message_mentions(mentioned_profile_id)
      `
      )
      .eq("id", messageId)
      .maybeSingle();

    return NextResponse.json({
      message: {
        ...updatedMessage,
        mentionedProfileIds: updatedMessage?.message_mentions?.map((m: any) => m.mentioned_profile_id) ?? [],
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

/**
 * DELETE /api/communities/[id]/messages/[messageId]
 * Delete a message (soft delete)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;

    // Get user's profile
    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Community profile not found" },
        { status: 500 }
      );
    }

    // Get message and verify ownership
    const { data: message } = await supabase
      .from("community_messages")
      .select("id, author_id")
      .eq("id", messageId)
      .maybeSingle();

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.author_id !== profile.id) {
      return NextResponse.json(
        { error: "Can only delete your own messages" },
        { status: 403 }
      );
    }

    // Soft delete message
    const { error: deleteError } = await supabase
      .from("community_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);

    if (deleteError) {
      console.error("Error deleting message:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete message" },
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
