"use client";

import { useState, useEffect } from "react";

interface PreviewData {
  id?: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  domain: string;
  og_type: string;
}

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [url]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await fetch(`/api/previews?url=${encodeURIComponent(url)}`);

      if (!response.ok) throw new Error("Failed to fetch preview");

      const data = await response.json();

      if (data.preview) {
        setPreview(data.preview);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-3 rounded-lg bg-white/50 border border-border animate-pulse">
        <div className="h-4 bg-white/50 rounded w-1/2 mb-2" />
        <div className="h-3 bg-white/50 rounded w-3/4" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-sm"
      >
        🔗 {new URL(url).hostname}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-white/50 border border-border hover:border-brand/20 transition-colors overflow-hidden"
    >
      <div className="flex gap-3">
        {/* Preview image */}
        {preview.image_url && (
          <div className="w-24 h-24 rounded-lg bg-white/30 overflow-hidden shrink-0">
            <img
              src={preview.image_url}
              alt={preview.image_url || ""}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Preview content */}
        <div className="flex-1 min-w-0">
          {/* Favicon + Domain */}
          <div className="flex items-center gap-1.5 mb-2">
            {preview.favicon_url && (
              <img
                src={preview.favicon_url}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <p className="text-xs text-ink-muted font-medium">
              {preview.domain}
            </p>
          </div>

          {/* Title */}
          {preview.title && (
            <p className="text-sm font-semibold text-ink line-clamp-2 mb-1">
              {preview.title}
            </p>
          )}

          {/* Description */}
          {preview.description && (
            <p className="text-xs text-ink-muted line-clamp-2">
              {preview.description}
            </p>
          )}

          {/* Type badge */}
          {preview.og_type !== "website" && (
            <div className="mt-2">
              <span className="text-[10px] font-bold text-brand/70 bg-brand/5 px-2 py-0.5 rounded">
                {preview.og_type}
              </span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
