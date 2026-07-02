"use client";

import { useState, useEffect } from "react";
import { debounce } from "lodash-es";

interface SearchResult {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar_url: string;
  };
  files: Array<{
    id: string;
    file_url: string;
    original_filename: string;
    thumbnail_url: string;
  }>;
  links: Array<{ url: string }>;
  createdAt: string;
}

interface CommunityMessageSearchProps {
  communityId: string;
}

export function CommunityMessageSearch({
  communityId,
}: CommunityMessageSearchProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "text" | "files" | "links">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const performSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        limit: "20",
        offset: "0",
      });

      const response = await fetch(`/api/communities/${communityId}/search?${params}`);
      const data = await response.json();

      setResults(data.results || []);
      setTotal(data.total || 0);
      setOffset(0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    performSearch(query);
  }, [query, searchType, dateFrom, dateTo]);

  const loadMore = async () => {
    try {
      setLoading(true);
      const newOffset = offset + 20;
      const params = new URLSearchParams({
        q: query,
        type: searchType,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        limit: "20",
        offset: newOffset.toString(),
      });

      const response = await fetch(`/api/communities/${communityId}/search?${params}`);
      const data = await response.json();

      setResults([...results, ...data.results]);
      setOffset(newOffset);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search header */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-border bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="all">All</option>
            <option value="text">Text</option>
            <option value="files">Files</option>
            <option value="links">Links</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />

          {(dateFrom || dateTo || searchType !== "all") && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSearchType("all");
              }}
              className="px-3 py-1.5 rounded-lg text-sm text-brand hover:bg-brand/5 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        {query && (
          <p className="text-xs text-ink-muted">
            {loading ? "Searching..." : `Found ${total} result${total !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Search results */}
      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-3 rounded-lg bg-white/50 border border-border hover:border-brand/20 transition-colors"
          >
            {/* Message header */}
            <div className="flex items-center gap-2 mb-2">
              {result.author.avatar_url && (
                <img
                  src={result.author.avatar_url}
                  alt={result.author.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <p className="text-sm font-semibold text-ink">{result.author.name}</p>
              <p className="text-xs text-ink-muted">
                {new Date(result.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Message content */}
            {result.content && (
              <p className="text-sm text-ink mb-2 line-clamp-3">{result.content}</p>
            )}

            {/* Files */}
            {result.files.length > 0 && (
              <div className="mb-2 space-y-1">
                {result.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 text-xs">
                    <span className="text-lg">📎</span>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline truncate"
                    >
                      {file.original_filename}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Links */}
            {result.links.length > 0 && (
              <div className="space-y-1">
                {result.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-brand hover:underline"
                  >
                    🔗 {new URL(link.url).hostname}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {results.length === 0 && query && !loading && (
          <div className="text-center py-8 text-ink-muted">
            <p>No results found</p>
          </div>
        )}
      </div>

      {/* Load more button */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {loading ? "Loading..." : "Load more results"}
        </button>
      )}
    </div>
  );
}
