import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/communities/[id]/media
 * Get media gallery items (files and links) in a community
 * Query params: type (file|link|image|document|link), sortBy (recent|views), limit, offset
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
    const mediaType = searchParams.get("type"); // file, link, image, document
    const sortBy = searchParams.get("sortBy") || "recent"; // recent, views
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify access
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

    let query = supabase
      .from("media_gallery_items")
      .select(
        `
        id, item_type, title, description, thumbnail_url, media_url, media_type,
        file_size, posted_at,
        community_profiles!posted_by_id (id, name, avatar_url),
        media_gallery_views (count)
      `,
        { count: "exact" }
      )
      .eq("community_id", communityId)
      .order(
        sortBy === "views" ? "id" : "posted_at",
        { ascending: sortBy === "views" ? false : false }
      );

    // Filter by media type
    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: items, count, error } = await query;

    if (error) {
      throw error;
    }

    // Record view
    if (user) {
      for (const item of items || []) {
        await supabase.from("media_gallery_views").upsert({
          gallery_item_id: item.id,
          viewed_by_id: user.id,
        });
      }
    }

    return NextResponse.json({
      items: (items || []).map((item) => ({
        id: item.id,
        type: item.item_type,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail_url,
        url: item.media_url,
        mediaType: item.media_type,
        fileSize: item.file_size,
        postedAt: item.posted_at,
        author: item.community_profiles,
        viewCount: item.media_gallery_views?.[0]?.count || 0,
      })),
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    console.error("Media gallery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
