import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/search
 * Search messages in a community
 * Query params: q (search query), type (text|files|links), dateFrom, dateTo, limit, offset
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
    const query = searchParams.get("q") || "";
    const searchType = searchParams.get("type") || "all"; // all, text, files, links
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify user is member of community or community is public
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

    let messageQuery = supabase
      .from("community_messages")
      .select(
        `
        id, content, posted_by_id, created_at,
        community_profiles!posted_by_id (id, name, avatar_url),
        message_attachments (id, file_url, file_type, original_filename, thumbnail_url),
        message_links (url)
      `,
        { count: "exact" }
      )
      .eq("community_id", communityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Search by content
    if (query && (searchType === "all" || searchType === "text")) {
      messageQuery = messageQuery.or(
        `content.ilike.%${query}%,community_profiles.name.ilike.%${query}%`
      );
    }

    // Filter by date range
    if (dateFrom) {
      messageQuery = messageQuery.gte("created_at", dateFrom);
    }
    if (dateTo) {
      messageQuery = messageQuery.lte("created_at", dateTo);
    }

    // Execute search
    const { data: messages, count, error } = await messageQuery;

    if (error) {
      throw error;
    }

    // Filter by type if specified
    let results = messages || [];
    if (searchType === "files") {
      results = results.filter(
        (m) => m.message_attachments && m.message_attachments.length > 0
      );
    } else if (searchType === "links") {
      results = results.filter(
        (m) => m.message_links && m.message_links.length > 0
      );
    }

    // Record search in history
    if (user && query) {
      await supabase.from("user_search_history").upsert({
        user_id: user.id,
        community_id: communityId,
        query,
        search_type: searchType,
        result_count: count || 0,
      });
    }

    return NextResponse.json({
      results: results.map((msg) => ({
        id: msg.id,
        content: msg.content,
        author: msg.community_profiles,
        files: msg.message_attachments || [],
        links: msg.message_links || [],
        createdAt: msg.created_at,
      })),
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
