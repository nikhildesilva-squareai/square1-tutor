import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/messages/[messageId]/threads
 * Get all replies to a message (thread)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { messageId } = await params;

    // Get thread count
    const { data: threadCount } = await supabase
      .from("message_thread_counts")
      .select("reply_count, last_reply_at, last_replier_id")
      .eq("parent_message_id", messageId)
      .maybeSingle();

    // Get replies ordered by creation
    const { data: threads, error: threadsError } = await supabase
      .from("message_threads")
      .select(
        `
        id,
        reply_message_id,
        created_at,
        community_messages!reply_message_id(
          id,
          content,
          author_id,
          created_at,
          edited_at,
          community_profiles!author_id(
            id,
            avatar_url,
            bio
          ),
          message_mentions(mentioned_profile_id),
          message_attachments(
            id,
            file_url,
            file_type,
            file_name
          )
        )
      `
      )
      .eq("parent_message_id", messageId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      return NextResponse.json(
        { error: "Failed to fetch threads" },
        { status: 500 }
      );
    }

    // Transform response
    const enriched = threads?.map((t: any) => ({
      id: t.id,
      parentMessageId: messageId,
      replyMessageId: t.reply_message_id,
      createdAt: t.created_at,
      message: {
        id: t.community_messages.id,
        content: t.community_messages.content,
        authorId: t.community_messages.author_id,
        createdAt: t.community_messages.created_at,
        editedAt: t.community_messages.edited_at,
        author: t.community_messages.community_profiles,
        mentionedProfileIds: t.community_messages.message_mentions?.map((m: any) => m.mentioned_profile_id) ?? [],
        attachments: t.community_messages.message_attachments ?? [],
      },
    }));

    return NextResponse.json({
      threads: enriched,
      threadCount: threadCount?.reply_count ?? 0,
      lastReplyAt: threadCount?.last_reply_at,
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
 * POST /api/communities/[id]/messages/[messageId]/threads
 * Reply to a message (create thread)
 */
export async function POST(
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
    const { id: communityId, messageId: parentMessageId } = await params;

    // Validate content
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Reply content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Reply is too long (max 5000 characters)" },
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

    // Verify user is member and not muted
    const { data: membership } = await supabase
      .from("community_members")
      .select("id, is_muted")
      .eq("community_id", communityId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!membership || membership.is_muted) {
      return NextResponse.json(
        { error: "Not a member or muted in this community" },
        { status: 403 }
      );
    }

    // Verify parent message exists
    const { data: parentMessage } = await supabase
      .from("community_messages")
      .select("id, community_id")
      .eq("id", parentMessageId)
      .maybeSingle();

    if (!parentMessage || parentMessage.community_id !== communityId) {
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 }
      );
    }

    // Create reply message
    const { data: replyMessage, error: messageError } = await supabase
      .from("community_messages")
      .insert({
        community_id: communityId,
        author_id: profile.id,
        content: content.trim(),
      })
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
        )
      `
      )
      .maybeSingle();

    if (messageError || !replyMessage) {
      console.error("Error creating reply:", messageError);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }

    // Create thread link
    const { data: thread, error: threadError } = await supabase
      .from("message_threads")
      .insert({
        parent_message_id: parentMessageId,
        reply_message_id: replyMessage.id,
      })
      .select()
      .maybeSingle();

    if (threadError) {
      console.error("Error creating thread:", threadError);
      return NextResponse.json(
        { error: "Failed to create thread" },
        { status: 500 }
      );
    }

    // Add mentions if provided
    if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      const mentionInserts = mentions.map((mentionId: string) => ({
        message_id: replyMessage.id,
        mentioned_profile_id: mentionId,
      }));

      await supabase.from("message_mentions").insert(mentionInserts);
    }

    // Auto-subscribe author to thread
    await supabase.from("thread_subscriptions").insert({
      parent_message_id: parentMessageId,
      subscriber_profile_id: profile.id,
    }).select().maybeSingle();

    return NextResponse.json(
      {
        thread: {
          id: thread.id,
          parentMessageId: parentMessageId,
          replyMessageId: replyMessage.id,
          createdAt: thread.created_at,
          message: {
            ...replyMessage,
            mentionedProfileIds: [],
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
