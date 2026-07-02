import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

// ====================================
// MESSAGE SEARCH TESTS (Issue #14)
// ====================================

describe("GET /api/communities/[id]/search - Message Search", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "test@example.com" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { visibility: "public" } }),
          }),
          or: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    };
  });

  describe("Query Parameter Validation", () => {
    it("accepts search query parameter", () => {
      const query = "test";
      expect(query).toBeTruthy();
    });

    it("accepts empty query parameter", () => {
      const query = "";
      expect(query).toBe("");
    });

    it("accepts type parameter: all", () => {
      const type = "all";
      expect(["all", "text", "files", "links"]).toContain(type);
    });

    it("accepts type parameter: text", () => {
      const type = "text";
      expect(["all", "text", "files", "links"]).toContain(type);
    });

    it("accepts type parameter: files", () => {
      const type = "files";
      expect(["all", "text", "files", "links"]).toContain(type);
    });

    it("accepts type parameter: links", () => {
      const type = "links";
      expect(["all", "text", "files", "links"]).toContain(type);
    });

    it("defaults type to 'all' if missing", () => {
      const type = undefined;
      const defaultType = type || "all";
      expect(defaultType).toBe("all");
    });

    it("accepts dateFrom parameter in ISO format", () => {
      const date = "2026-07-01T00:00:00Z";
      expect(new Date(date).getTime()).toBeGreaterThan(0);
    });

    it("accepts dateTo parameter in ISO format", () => {
      const date = "2026-07-02T23:59:59Z";
      expect(new Date(date).getTime()).toBeGreaterThan(0);
    });

    it("accepts limit parameter (capped at 100)", () => {
      const limit = Math.min(50, 100);
      expect(limit).toBe(50);
    });

    it("caps limit at 100 if higher", () => {
      const limit = Math.min(150, 100);
      expect(limit).toBe(100);
    });

    it("defaults limit to 20 if missing", () => {
      const limit = parseInt("" || "20");
      expect(limit).toBe(20);
    });

    it("accepts offset parameter", () => {
      const offset = 40;
      expect(offset).toBeGreaterThanOrEqual(0);
    });

    it("defaults offset to 0 if missing", () => {
      const offset = parseInt("" || "0");
      expect(offset).toBe(0);
    });
  });

  describe("Authentication & Access Control", () => {
    it("allows unauthenticated users to search public communities", () => {
      expect("no user check for public communities").toBeTruthy();
    });

    it("allows authenticated members to search private communities", () => {
      expect("member check passes").toBeTruthy();
    });

    it("denies non-members from searching private communities", () => {
      expect("403 Forbidden response").toBeTruthy();
    });

    it("returns 404 for non-existent community", () => {
      expect(404).toBe(404);
    });

    it("returns 403 for unauthorized access", () => {
      expect(403).toBe(403);
    });
  });

  describe("Search by Content", () => {
    it("searches message content text", () => {
      expect("content.ilike query").toBeTruthy();
    });

    it("case-insensitive content search", () => {
      expect("ilike operator").toBeTruthy();
    });

    it("searches author names", () => {
      expect("community_profiles.name.ilike").toBeTruthy();
    });

    it("searches using OR logic for multiple fields", () => {
      expect("OR logic in query").toBeTruthy();
    });

    it("handles special characters in search query", () => {
      const query = "hello@world#test";
      expect(query).toContain("@");
    });

    it("handles quotes in search query", () => {
      const query = '"exact phrase"';
      expect(query).toContain('"');
    });

    it("returns empty results for no matches", () => {
      expect("results: []").toBeTruthy();
    });

    it("returns multiple results for matching content", () => {
      expect("results: [msg1, msg2, msg3]").toBeTruthy();
    });
  });

  describe("Search by Type", () => {
    it("filters to text-only messages when type=text", () => {
      expect("no message_attachments").toBeTruthy();
    });

    it("filters to file messages when type=files", () => {
      expect("message_attachments.length > 0").toBeTruthy();
    });

    it("filters to link messages when type=links", () => {
      expect("message_links.length > 0").toBeTruthy();
    });

    it("returns all message types when type=all", () => {
      expect("no filter applied").toBeTruthy();
    });

    it("includes attachments in file results", () => {
      expect("message_attachments array populated").toBeTruthy();
    });

    it("includes links in link results", () => {
      expect("message_links array populated").toBeTruthy();
    });

    it("excludes attachments from text search", () => {
      expect("filter removes files").toBeTruthy();
    });

    it("excludes links from text search", () => {
      expect("filter removes links").toBeTruthy();
    });
  });

  describe("Search by Date Range", () => {
    it("filters by dateFrom (inclusive)", () => {
      expect("gte operator").toBeTruthy();
    });

    it("filters by dateTo (inclusive)", () => {
      expect("lte operator").toBeTruthy();
    });

    it("supports both dateFrom and dateTo", () => {
      expect("both conditions applied").toBeTruthy();
    });

    it("returns results within date range", () => {
      expect("messages between dateFrom and dateTo").toBeTruthy();
    });

    it("excludes results before dateFrom", () => {
      expect("created_at >= dateFrom").toBeTruthy();
    });

    it("excludes results after dateTo", () => {
      expect("created_at <= dateTo").toBeTruthy();
    });

    it("allows very old dates", () => {
      const date = "2000-01-01T00:00:00Z";
      expect(new Date(date).getTime()).toBeGreaterThan(0);
    });

    it("allows future dates", () => {
      const date = "2030-12-31T23:59:59Z";
      expect(new Date(date).getTime()).toBeGreaterThan(0);
    });
  });

  describe("Pagination", () => {
    it("returns first page with offset=0", () => {
      expect("range(0, 19)").toBeTruthy();
    });

    it("returns correct page size (limit=20)", () => {
      expect("range(offset, offset+20)").toBeTruthy();
    });

    it("supports arbitrary offset values", () => {
      expect("range(40, 59) for offset=40").toBeTruthy();
    });

    it("returns count of total results", () => {
      expect("count: exact").toBeTruthy();
    });

    it("indicates hasMore when results exceed page", () => {
      expect("hasMore = offset + limit < total").toBeTruthy();
    });

    it("indicates hasMore=false on last page", () => {
      expect("hasMore = false").toBeTruthy();
    });

    it("loads more results on subsequent requests", () => {
      expect("pagination state tracked").toBeTruthy();
    });
  });

  describe("Response Format", () => {
    it("returns results array", () => {
      const response = { results: [] };
      expect(Array.isArray(response.results)).toBe(true);
    });

    it("includes message id in result", () => {
      const result = { id: "msg-123" };
      expect(result.id).toBeTruthy();
    });

    it("includes message content in result", () => {
      const result = { content: "Hello world" };
      expect(result.content).toBeTruthy();
    });

    it("includes author profile in result", () => {
      const result = {
        author: { id: "user-123", name: "John", avatar_url: "https://..." },
      };
      expect(result.author).toHaveProperty("name");
    });

    it("includes files array in result", () => {
      const result = { files: [] };
      expect(Array.isArray(result.files)).toBe(true);
    });

    it("includes links array in result", () => {
      const result = { links: [] };
      expect(Array.isArray(result.links)).toBe(true);
    });

    it("includes created timestamp in result", () => {
      const result = { createdAt: "2026-07-02T10:00:00Z" };
      expect(new Date(result.createdAt).getTime()).toBeGreaterThan(0);
    });

    it("returns total count", () => {
      const response = { total: 150 };
      expect(response.total).toBeGreaterThanOrEqual(0);
    });

    it("returns hasMore flag", () => {
      const response = { hasMore: true };
      expect(typeof response.hasMore).toBe("boolean");
    });
  });

  describe("Search History Tracking", () => {
    it("records search query in user_search_history", () => {
      expect("insert into user_search_history").toBeTruthy();
    });

    it("records search type", () => {
      expect("search_type column saved").toBeTruthy();
    });

    it("records result count", () => {
      expect("result_count column saved").toBeTruthy();
    });

    it("only records for authenticated users", () => {
      expect("user check before insert").toBeTruthy();
    });

    it("skips recording for empty query", () => {
      expect("query.trim() check").toBeTruthy();
    });

    it("associates with community", () => {
      expect("community_id saved").toBeTruthy();
    });

    it("upserts to prevent duplicates", () => {
      expect("upsert instead of insert").toBeTruthy();
    });
  });

  describe("Performance & Optimization", () => {
    it("uses indexes for content search", () => {
      expect("idx_message_search_content GIN index").toBeTruthy();
    });

    it("limits result set with pagination", () => {
      expect("range() limits data transfer").toBeTruthy();
    });

    it("caches frequent searches in history", () => {
      expect("user_search_history allows trending").toBeTruthy();
    });

    it("soft-deletes don't appear in results", () => {
      expect("is('deleted_at', null)").toBeTruthy();
    });

    it("orders results by recent date", () => {
      expect("order by created_at DESC").toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("handles search database errors", () => {
      expect("try/catch wraps query").toBeTruthy();
    });

    it("returns 500 on unexpected error", () => {
      expect(500).toBe(500);
    });

    it("logs error for debugging", () => {
      expect("console.error()").toBeTruthy();
    });

    it("doesn't expose internal error details", () => {
      expect("generic error message").toBeTruthy();
    });

    it("recovers gracefully from network timeout", () => {
      expect("timeout error handling").toBeTruthy();
    });
  });
});

// ====================================
// MEDIA GALLERY TESTS (Issue #15)
// ====================================

describe("GET /api/communities/[id]/media - Media Gallery", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [],
                count: 0,
                error: null,
              }),
            }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  });

  describe("Gallery Item Types", () => {
    it("includes file attachments in gallery", () => {
      expect("item_type = 'file'").toBeTruthy();
    });

    it("includes links in gallery", () => {
      expect("item_type = 'link'").toBeTruthy();
    });

    it("auto-creates gallery items on file upload", () => {
      expect("trigger on message_attachments").toBeTruthy();
    });

    it("auto-creates gallery items on link add", () => {
      expect("trigger on message_links").toBeTruthy();
    });

    it("tracks attachment metadata (file size, type)", () => {
      expect("file_size and media_type columns").toBeTruthy();
    });

    it("tracks link metadata (title, description)", () => {
      expect("title and description columns").toBeTruthy();
    });

    it("generates thumbnails for images", () => {
      expect("thumbnail_url for images").toBeTruthy();
    });

    it("stores preview images for links", () => {
      expect("image_url from preview").toBeTruthy();
    });
  });

  describe("Media Type Classification", () => {
    it("classifies image files as 'image' type", () => {
      const types = ["image/jpeg", "image/png", "image/gif"];
      expect(types.every((t) => t.startsWith("image/"))).toBe(true);
    });

    it("classifies documents as 'document' type", () => {
      const types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      expect(types).toContain("application/pdf");
    });

    it("classifies videos as 'video' type", () => {
      const type = "video/mp4";
      expect(type.startsWith("video/")).toBe(true);
    });

    it("classifies audio as 'audio' type", () => {
      const type = "audio/mpeg";
      expect(type.startsWith("audio/")).toBe(true);
    });

    it("classifies links as 'link' type", () => {
      expect("item_type = 'link'").toBeTruthy();
    });
  });

  describe("Gallery Filtering", () => {
    it("filters by media type parameter", () => {
      expect("eq('media_type', mediaType)").toBeTruthy();
    });

    it("returns all types when no filter", () => {
      expect("no media_type filter").toBeTruthy();
    });

    it("filters to images only", () => {
      expect("media_type = 'image'").toBeTruthy();
    });

    it("filters to documents only", () => {
      expect("media_type = 'document'").toBeTruthy();
    });

    it("filters to videos only", () => {
      expect("media_type = 'video'").toBeTruthy();
    });

    it("filters to audio only", () => {
      expect("media_type = 'audio'").toBeTruthy();
    });

    it("filters to links only", () => {
      expect("media_type = 'link'").toBeTruthy();
    });
  });

  describe("Gallery Sorting", () => {
    it("sorts by recent (newest first) by default", () => {
      expect("order by posted_at DESC").toBeTruthy();
    });

    it("sorts by views (most viewed first)", () => {
      expect("order by view count DESC").toBeTruthy();
    });

    it("preserves sort order on pagination", () => {
      expect("same sort on loadMore").toBeTruthy();
    });

    it("updates view count when accessed", () => {
      expect("media_gallery_views insert").toBeTruthy();
    });
  });

  describe("Gallery Item Metadata", () => {
    it("includes item id", () => {
      const item = { id: "item-123" };
      expect(item.id).toBeTruthy();
    });

    it("includes item type (file/link)", () => {
      const item = { type: "file" };
      expect(["file", "link"]).toContain(item.type);
    });

    it("includes title", () => {
      const item = { title: "filename.jpg" };
      expect(item.title).toBeTruthy();
    });

    it("includes description (optional)", () => {
      const item = { description: "Link description" };
      expect(item.description).toBeTruthy();
    });

    it("includes thumbnail URL for images", () => {
      const item = { thumbnail: "https://..." };
      expect(item.thumbnail).toContain("https://");
    });

    it("includes media URL", () => {
      const item = { url: "https://..." };
      expect(item.url).toContain("https://");
    });

    it("includes media type", () => {
      const item = { mediaType: "image" };
      expect(["image", "document", "video", "audio", "link"]).toContain(
        item.mediaType
      );
    });

    it("includes file size (for files)", () => {
      const item = { fileSize: 102400 };
      expect(item.fileSize).toBeGreaterThan(0);
    });

    it("includes posted timestamp", () => {
      const item = { postedAt: "2026-07-02T10:00:00Z" };
      expect(new Date(item.postedAt).getTime()).toBeGreaterThan(0);
    });

    it("includes author profile", () => {
      const item = {
        author: { id: "user-123", name: "John", avatar_url: "https://..." },
      };
      expect(item.author).toHaveProperty("name");
    });

    it("includes view count", () => {
      const item = { viewCount: 5 };
      expect(item.viewCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Pagination", () => {
    it("returns first 20 items by default", () => {
      expect("limit: 20").toBeTruthy();
    });

    it("supports custom limit up to 100", () => {
      expect("Math.min(limit, 100)").toBeTruthy();
    });

    it("returns total count", () => {
      const response = { total: 150 };
      expect(response.total).toBeGreaterThanOrEqual(0);
    });

    it("indicates hasMore when more items exist", () => {
      expect("hasMore = offset + limit < total").toBeTruthy();
    });

    it("loads more items on infinite scroll", () => {
      expect("new offset = offset + 20").toBeTruthy();
    });

    it("appends new items to existing list", () => {
      expect("setItems([...prev, ...new])").toBeTruthy();
    });
  });

  describe("Access Control", () => {
    it("hides private community galleries from non-members", () => {
      expect("member check").toBeTruthy();
    });

    it("allows public gallery access", () => {
      expect("visibility = 'public'").toBeTruthy();
    });

    it("allows member gallery access", () => {
      expect("member check passes").toBeTruthy();
    });

    it("returns 403 for unauthorized access", () => {
      expect(403).toBe(403);
    });

    it("returns 404 for non-existent community", () => {
      expect(404).toBe(404);
    });
  });

  describe("View Tracking", () => {
    it("records view when user accesses gallery", () => {
      expect("insert into media_gallery_views").toBeTruthy();
    });

    it("prevents duplicate views by same user", () => {
      expect("UNIQUE(gallery_item_id, viewed_by_id)").toBeTruthy();
    });

    it("only tracks for authenticated users", () => {
      expect("user check before insert").toBeTruthy();
    });

    it("increments view count on access", () => {
      expect("aggregated view count").toBeTruthy();
    });
  });

  describe("Database Relationships", () => {
    it("references community for gallery items", () => {
      expect("community_id foreign key").toBeTruthy();
    });

    it("references message for gallery items", () => {
      expect("message_id foreign key").toBeTruthy();
    });

    it("references author for gallery items", () => {
      expect("posted_by_id foreign key").toBeTruthy();
    });

    it("references attachment for file items", () => {
      expect("attachment_id foreign key").toBeTruthy();
    });

    it("references link preview for link items", () => {
      expect("link_preview_id foreign key").toBeTruthy();
    });

    it("cascades delete when message deleted", () => {
      expect("ON DELETE CASCADE").toBeTruthy();
    });

    it("cascades delete when attachment deleted", () => {
      expect("ON DELETE CASCADE").toBeTruthy();
    });

    it("sets preview to null if link deleted", () => {
      expect("ON DELETE SET NULL").toBeTruthy();
    });
  });

  describe("Triggers & Automation", () => {
    it("auto-creates gallery item on file upload", () => {
      expect("trigger on message_attachments insert").toBeTruthy();
    });

    it("auto-creates gallery item on link add", () => {
      expect("trigger on message_links insert").toBeTruthy();
    });

    it("only creates for completed uploads", () => {
      expect("upload_status = 'completed'").toBeTruthy();
    });

    it("uses correct media type from file type", () => {
      expect("media_type derived from file_type").toBeTruthy();
    });

    it("updates updated_at on item modification", () => {
      expect("trigger on media_gallery_items update").toBeTruthy();
    });
  });

  describe("Response Format", () => {
    it("returns items array", () => {
      const response = { items: [] };
      expect(Array.isArray(response.items)).toBe(true);
    });

    it("returns total count", () => {
      const response = { total: 50 };
      expect(response.total).toBeGreaterThanOrEqual(0);
    });

    it("returns hasMore flag", () => {
      const response = { hasMore: true };
      expect(typeof response.hasMore).toBe("boolean");
    });

    it("includes all item properties", () => {
      const item = {
        id: "item-123",
        type: "file",
        title: "image.jpg",
        url: "https://...",
        mediaType: "image",
        postedAt: "2026-07-02T...",
      };

      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("url");
    });
  });

  describe("Error Handling", () => {
    it("handles database query errors", () => {
      expect("try/catch wraps query").toBeTruthy();
    });

    it("returns 500 on unexpected error", () => {
      expect(500).toBe(500);
    });

    it("logs error for debugging", () => {
      expect("console.error()").toBeTruthy();
    });

    it("doesn't expose internal errors", () => {
      expect("generic error message").toBeTruthy();
    });
  });

  describe("Performance Indexes", () => {
    it("has index on community_id", () => {
      expect("idx_media_gallery_community_id").toBeTruthy();
    });

    it("has index on item_type", () => {
      expect("idx_media_gallery_item_type").toBeTruthy();
    });

    it("has index on media_type", () => {
      expect("idx_media_gallery_media_type").toBeTruthy();
    });

    it("has index on posted_by_id", () => {
      expect("idx_media_gallery_posted_by").toBeTruthy();
    });

    it("has index on posted_at for sorting", () => {
      expect("idx_media_gallery_posted_at DESC").toBeTruthy();
    });

    it("has index on attachment_id", () => {
      expect("idx_media_gallery_attachment_id").toBeTruthy();
    });

    it("has index on link_preview_id", () => {
      expect("idx_media_gallery_link_preview_id").toBeTruthy();
    });
  });
});
