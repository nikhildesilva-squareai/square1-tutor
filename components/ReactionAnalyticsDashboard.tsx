"use client";

import { useState, useEffect } from "react";

interface EmojiStat {
  emoji: string;
  totalUsage: number;
  uniqueUsers: number;
  lastUsedAt: string;
}

interface TopReactor {
  memberId: string;
  profile: { id: string; bio: string; avatar_url: string };
  totalReactions: number;
}

interface ReactionAnalyticsDashboardProps {
  communityId: string;
}

export function ReactionAnalyticsDashboard({
  communityId,
}: ReactionAnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");
  const [topEmojis, setTopEmojis] = useState<EmojiStat[]>([]);
  const [topReactors, setTopReactors] = useState<TopReactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/analytics/reactions?timeframe=${timeframe}&topN=15`
      );

      if (!response.ok) {
        throw new Error("Failed to load reaction analytics");
      }

      const data = await response.json();
      setTopEmojis(data.topEmojis || []);
      setTopReactors(data.topReactors || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Reaction Analytics 😊</h2>
          <p className="text-sm text-ink-muted mt-1">
            Track emoji usage and member reaction patterns
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-2">
          {["week", "month", "all"].map((tf) => (
            <button
              key={tf}
              onClick={() =>
                setTimeframe(tf as "week" | "month" | "all")
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeframe === tf
                  ? "bg-brand text-white"
                  : "bg-white/50 text-ink border border-border hover:border-brand"
              }`}
            >
              {tf === "all" ? "All Time" : tf === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-muted">
          <p>Loading analytics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Emojis */}
          <div className="rounded-lg bg-white/50 border border-border p-4 space-y-3">
            <h3 className="font-semibold text-ink">Top Reactions</h3>

            {topEmojis.length === 0 ? (
              <p className="text-sm text-ink-muted py-4">
                No reaction data available yet
              </p>
            ) : (
              <div className="space-y-2">
                {topEmojis.map((emoji, idx) => (
                  <div
                    key={emoji.emoji}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{emoji.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          #{idx + 1}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {emoji.uniqueUsers} people
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand">
                        {emoji.totalUsage}
                      </p>
                      <p className="text-xs text-ink-muted">uses</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Reactors */}
          <div className="rounded-lg bg-white/50 border border-border p-4 space-y-3">
            <h3 className="font-semibold text-ink">Most Active Reactors</h3>

            {topReactors.length === 0 ? (
              <p className="text-sm text-ink-muted py-4">
                No reactor data available yet
              </p>
            ) : (
              <div className="space-y-2">
                {topReactors.map((reactor, idx) => (
                  <div
                    key={reactor.memberId}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {reactor.profile?.avatar_url && (
                        <img
                          src={reactor.profile.avatar_url}
                          alt={reactor.profile.bio}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {reactor.profile?.bio || "Unknown"}
                        </p>
                        <p className="text-xs text-ink-muted">
                          Rank #{idx + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand">
                        {reactor.totalReactions}
                      </p>
                      <p className="text-xs text-ink-muted">reactions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
