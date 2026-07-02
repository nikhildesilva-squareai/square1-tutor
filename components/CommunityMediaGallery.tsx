"use client";

import { useState, useEffect } from "react";
import { LinkPreview } from "./LinkPreview";

interface MediaItem {
  id: string;
  type: "file" | "link";
  title: string;
  description?: string;
  thumbnail?: string;
  url: string;
  mediaType: "image" | "document" | "video" | "audio" | "link";
  fileSize?: number;
  postedAt: string;
  author: {
    id: string;
    name: string;
    avatar_url: string;
  };
  viewCount: number;
}

interface CommunityMediaGalleryProps {
  communityId: string;
}

export function CommunityMediaGallery({
  communityId,
}: CommunityMediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "views">("recent");
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadMedia = async (newOffset: number = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        limit: "20",
        offset: newOffset.toString(),
        ...(mediaType && { type: mediaType }),
      });

      const response = await fetch(`/api/communities/${communityId}/media?${params}`);
      const data = await response.json();

      if (newOffset === 0) {
        setItems(data.items || []);
      } else {
        setItems((prev) => [...prev, ...data.items]);
      }

      setOffset(newOffset);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Media load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia(0);
  }, [mediaType, sortBy]);

  // Filter items by type
  useEffect(() => {
    if (mediaType) {
      setFilteredItems(items.filter((item) => item.mediaType === mediaType));
    } else {
      setFilteredItems(items);
    }
  }, [items, mediaType]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "video":
        return "🎥";
      case "audio":
        return "🎵";
      case "link":
        return "🔗";
      default:
        return "📎";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setMediaType(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mediaType === null
                ? "bg-brand text-white"
                : "bg-white/50 text-ink border border-border hover:border-brand"
            }`}
          >
            All
          </button>
          {["image", "document", "video", "audio", "link"].map((type) => (
            <button
              key={type}
              onClick={() => setMediaType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mediaType === type
                  ? "bg-brand text-white"
                  : "bg-white/50 text-ink border border-border hover:border-brand"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="recent">Recent</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 gap-3 auto-rows-max">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg bg-white/50 border border-border overflow-hidden hover:border-brand/20 transition-colors"
          >
            {/* Image/thumbnail preview */}
            {item.type === "file" && item.mediaType === "image" && item.thumbnail && (
              <div className="w-full h-48 bg-white/30 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Link preview component */}
            {item.type === "link" && (
              <div className="p-3">
                <LinkPreview url={item.url} />
              </div>
            )}

            {/* Item details */}
            <div className="p-3 space-y-2">
              {/* Title */}
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">{getMediaIcon(item.mediaType)}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand hover:underline flex-1 line-clamp-2"
                >
                  {item.title}
                </a>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-ink-muted line-clamp-2">{item.description}</p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
                {/* Author */}
                <div className="flex items-center gap-1">
                  {item.author.avatar_url && (
                    <img
                      src={item.author.avatar_url}
                      alt={item.author.name}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span>{item.author.name}</span>
                </div>

                {/* Date */}
                <span>•</span>
                <span>{new Date(item.postedAt).toLocaleDateString()}</span>

                {/* File size */}
                {item.fileSize && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </>
                )}

                {/* View count */}
                {item.viewCount > 0 && (
                  <>
                    <span>•</span>
                    <span>👁️ {item.viewCount}</span>
                  </>
                )}
              </div>

              {/* Download button for files */}
              {item.type === "file" && (
                <a
                  href={item.url}
                  download
                  className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-xs font-medium"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12 text-ink-muted">
          <p className="text-lg">📂 No media found</p>
          <p className="text-sm mt-1">
            {mediaType ? `No ${mediaType}s shared yet` : "No files or links shared yet"}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && filteredItems.length === 0 && (
        <div className="text-center py-12 text-ink-muted">
          <p>Loading media...</p>
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <button
          onClick={() => loadMedia(offset + 20)}
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
