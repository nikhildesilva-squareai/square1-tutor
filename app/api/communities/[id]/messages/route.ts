import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { autoModerateMessage } from "@/lib/community/moderation";

/**
 * POST /api/communities/[id]/messages
 * Create a new message in a community
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, mentions, attachments } = await req.json();
    const communityId = (await params).id;

    // Validate content
    if ((!content || typeof content !== "string" || !content.trim()) && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Message content or attachments are required" },
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

    // Check if user is a member of the community
    const { data: membership } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this community" },
        { status: 403 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabase
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

    if (messageError || !message) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    // Add attachments if provided. Map the client payload to the real
    // message_attachments columns (the size column is file_size_bytes; also
    // populate file_name + mime_type, which the GET query selects).
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentInserts = attachments.map((file: any) => ({
        message_id: message.id,
        file_url: file.file_url,
        file_type: file.file_type,
        mime_type: file.file_type,
        file_name: file.original_filename,
        original_filename: file.original_filename,
        file_size_bytes: file.file_size,
        upload_status: "completed",
      }));

      const { error: attachErr } = await supabase
        .from("message_attachments")
        .insert(attachmentInserts);
      if (attachErr) console.error("Error saving message attachments:", attachErr);
    }

    // Add mentions if provided
    if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      const mentionInserts = mentions.map((profileId: string) => ({
        message_id: message.id,
        mentioned_profile_id: profileId,
      }));

      await supabase
        .from("message_mentions")
        .insert(mentionInserts)
        .select();
    }

    // Fetch mentions
    const { data: messageMentions } = await supabase
      .from("message_mentions")
      .select("mentioned_profile_id")
      .eq("message_id", message.id);

    // Trigger auto-moderation asynchronously (non-blocking)
    try {
      autoModerateMessage(communityId, message.id, content.trim(), profile.id).catch(
        (err) => console.error("Auto-moderation error:", err)
      );
    } catch (err) {
      console.error("Error triggering auto-moderation:", err);
    }

    return NextResponse.json(
      {
        message: {
          ...message,
          mentionedProfileIds: messageMentions?.map((m: any) => m.mentioned_profile_id) ?? [],
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

/**
 * GET /api/communities/[id]/messages
 * Get messages from a community with pagination
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const communityId = (await params).id;

    // Get messages
    const { data: messages, error, count } = await supabase
      .from("community_messages")
      .select(
        `
        id,
        community_id,
        author_id,
        content,
        created_at,
        edited_at,
        deleted_at,
        community_profiles!author_id(
          id,
          avatar_url,
          bio,
          student_id
        ),
        message_mentions(mentioned_profile_id),
        message_attachments(
          id,
          file_url,
          file_type,
          file_name,
          mime_type
        )
      `,
        { count: "exact" }
      )
      .eq("community_id", communityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Transform response
    const enriched = messages?.map((m: any) => ({
      id: m.id,
      communityId: m.community_id,
      authorId: m.author_id,
      content: m.content,
      createdAt: m.created_at,
      editedAt: m.edited_at,
      isDeleted: !!m.deleted_at,
      author: m.community_profiles,
      mentionedProfileIds: m.message_mentions?.map((mention: any) => mention.mentioned_profile_id) ?? [],
      attachments: m.message_attachments ?? [],
    }));

    return NextResponse.json({
      messages: enriched,
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
