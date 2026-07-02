"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Recommendation {
  id: string;
  community_id: string;
  reason: string;
  relevance_score: number;
  communities: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    memberCount?: number;
  };
}

export function CommunityRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/recommendations?limit=6");

      if (!response.ok) throw new Error("Failed to fetch recommendations");

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (recommendationId: string) => {
    try {
      const response = await fetch("/api/user/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId }),
      });

      if (!response.ok) throw new Error("Failed to dismiss recommendation");

      setDismissedIds([...dismissedIds, recommendationId]);
      setRecommendations((prev) =>
        prev.filter((r) => r.id !== recommendationId)
      );
    } catch (err) {
      console.error("Failed to dismiss:", err);
    }
  };

  const visibleRecommendations = recommendations.filter(
    (r) => !dismissedIds.includes(r.id)
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center">
          <svg
            className="animate-spin h-6 w-6 text-brand"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (visibleRecommendations.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-surface border border-border text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mx-auto mb-4 text-ink-muted opacity-50"
        >
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold text-ink mb-1">
          No recommendations yet
        </h3>
        <p className="text-sm text-ink-muted">
          Check back soon as we learn more about your interests!
        </p>
      </div>
    );
  }

  const reasonLabels: Record<string, { label: string; icon: string }> = {
    enrollment_match: { label: "Your Course", icon: "📚" },
    skill_match: { label: "Your Skills", icon: "⭐" },
    peer_connection: { label: "Your Peers", icon: "👥" },
    trending: { label: "Trending", icon: "🔥" },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink mb-4">
        Recommended For You
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleRecommendations.map((rec) => {
          const reasonInfo = reasonLabels[rec.reason];
          const confidence = Math.round(rec.relevance_score * 100);

          return (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-surface border border-border hover:border-brand/20 transition-colors group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-ink text-sm line-clamp-2">
                    {rec.communities.name}
                  </h3>
                  <p className="text-xs text-brand mt-1">
                    {reasonInfo.icon} {reasonInfo.label}
                  </p>
                </div>

                <button
                  onClick={() => handleDismiss(rec.id)}
                  className="text-ink-muted hover:text-ink ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-ink-muted line-clamp-2 mb-3">
                {rec.communities.description || "A community for learning and collaboration"}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ink-muted">{rec.communities.category}</span>
                  <div className="w-1 h-1 bg-border rounded-full" />
                  <span className="text-brand font-semibold">{confidence}% match</span>
                </div>

                <Link
                  href={`/community/${rec.communities.slug}`}
                  className="px-3 py-1 rounded-lg bg-brand/10 text-brand font-semibold text-xs hover:bg-brand/20 transition-colors"
                >
                  View
                </Link>
              </div>

              {/* Confidence Bar */}
              <div className="mt-3 w-full bg-white/50 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-brand h-full transition-all"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {visibleRecommendations.length < recommendations.length && (
        <p className="text-center text-sm text-ink-muted mt-4">
          {recommendations.length - visibleRecommendations.length} more recommendations dismissed
        </p>
      )}
    </div>
  );
}
