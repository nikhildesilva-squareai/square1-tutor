"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CommunityCreationForm } from "@/components/CommunityCreationForm";

const CATEGORIES = ["Trending", "Tech", "AI/ML", "Data Science", "Startup", "Research", "Other"];

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template_type: string;
  category: string;
  is_private: boolean;
  creator_id: string;
  memberCount: number;
  created_at: string;
}

export function CommunityDiscoveryClient() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory, search]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== "Trending" && selectedCategory !== "Other") {
        params.append("category", selectedCategory);
      }
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/communities?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch communities");
      }

      const data = await response.json();
      setCommunities(data.communities || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreationSuccess = (communityId: string, communityName: string) => {
    setShowCreationForm(false);
    // Toast notification could go here
    console.log(`Created community: ${communityName}`);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="flex-1 relative">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        {/* Create button */}
        <button
          onClick={() => setShowCreationForm(true)}
          className="px-6 py-2.5 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all whitespace-nowrap"
        >
          + Create Community
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-brand text-white"
                : "bg-surface-alt text-ink hover:bg-surface-alt/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Communities grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-surface border border-border animate-pulse space-y-3">
              <div className="h-5 rounded bg-surface-alt" />
              <div className="h-3 rounded bg-surface-alt" />
              <div className="h-3 rounded bg-surface-alt w-2/3" />
            </div>
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-alt mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-1">No communities found</h3>
          <p className="text-sm text-ink-muted mb-6">
            {search ? "Try a different search" : "Be the first to create one!"}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreationForm(true)}
              className="px-6 py-2.5 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all"
            >
              Create a Community
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/community/${community.slug}`}
              className="p-5 rounded-xl border border-border bg-surface hover:shadow-card hover:border-brand/15 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
                    {community.name}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">{community.category}</p>
                </div>
              </div>

              {/* Description */}
              {community.description && (
                <p className="text-sm text-ink-muted mb-3 line-clamp-2">{community.description}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-ink-muted">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                  <span className="text-xs text-ink-muted font-medium">
                    {community.memberCount} member{community.memberCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {community.is_private && (
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Private
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Community creation modal */}
      {showCreationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-surface">
              <div>
                <h2 className="text-2xl font-black text-ink">Create a Community</h2>
                <p className="text-sm text-ink-muted mt-1">Start a new community to connect with peers</p>
              </div>
              <button
                onClick={() => setShowCreationForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6">
              <CommunityCreationForm
                onSuccess={handleCreationSuccess}
                onCancel={() => setShowCreationForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
