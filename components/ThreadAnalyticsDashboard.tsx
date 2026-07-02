"use client";

import { useState, useEffect } from "react";

interface ThreadMetrics {
  totalReplies: number;
  uniqueResponders: number;
  threadDepth: number;
  maxReplyDepth: number;
  totalReactions: number;
  averageResponseTimeMinutes: number | null;
  medianResponseTimeMinutes: number | null;
}

interface Timeline {
  firstReplyAt: string;
  lastReplyAt: string;
  durationMinutes: number;
}

interface Thread {
  messageId: string;
  originalMessage: {
    id: string;
    content: string;
    author: { id: string; bio: string; avatar_url: string };
    createdAt: string;
  };
  metrics: ThreadMetrics;
  timeline: Timeline;
}

interface ResponseTimeStats {
  averageMinutes: number;
  medianMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  totalResponses: number;
}

interface ThreadAnalyticsDashboardProps {
  communityId: string;
}

export function ThreadAnalyticsDashboard({
  communityId,
}: ThreadAnalyticsDashboardProps) {
  const [sortBy, setSortBy] = useState<"replies" | "engagement" | "depth">(
    "replies"
  );
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [sortBy]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/analytics/threads?sortBy=${sortBy}&limit=20`
      );

      if (!response.ok) {
        throw new Error("Failed to load thread analytics");
      }

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Thread Analytics 💬</h2>
          <p className="text-sm text-ink-muted mt-1">
            Track engagement metrics and response times
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex gap-2">
          {[
            { value: "replies", label: "Replies" },
            { value: "engagement", label: "Engagement" },
            { value: "depth", label: "Depth" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-brand text-white"
                  : "bg-white/50 text-ink border border-border hover:border-brand"
              }`}
            >
              {opt.label}
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
          <p>Loading thread analytics...</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12 text-ink-muted">
          <p>No threads with replies found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread.messageId}
              className="rounded-lg bg-white/50 border border-border p-4 space-y-3"
            >
              {/* Original message */}
              <div className="flex items-start gap-2">
                {thread.originalMessage.author?.avatar_url && (
                  <img
                    src={thread.originalMessage.author.avatar_url}
                    alt={thread.originalMessage.author.bio}
                    className="w-8 h-8 rounded-full mt-0.5"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {thread.originalMessage.author?.bio || "Unknown"}
                  </p>
                  <p className="text-sm text-ink line-clamp-2">
                    {thread.originalMessage.content}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    {new Date(
                      thread.originalMessage.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Replies */}
                <div className="p-2 rounded-lg bg-white/50 border border-border">
                  <p className="text-2xl font-bold text-brand">
                    {thread.metrics.totalReplies}
                  </p>
                  <p className="text-xs text-ink-muted">Replies</p>
                </div>

                {/* Responders */}
                <div className="p-2 rounded-lg bg-white/50 border border-border">
                  <p className="text-2xl font-bold text-brand">
                    {thread.metrics.uniqueResponders}
                  </p>
                  <p className="text-xs text-ink-muted">Responders</p>
                </div>

                {/* Depth */}
                <div className="p-2 rounded-lg bg-white/50 border border-border">
                  <p className="text-2xl font-bold text-brand">
                    {thread.metrics.threadDepth}
                  </p>
                  <p className="text-xs text-ink-muted">Depth</p>
                </div>

                {/* Reactions */}
                <div className="p-2 rounded-lg bg-white/50 border border-border">
                  <p className="text-2xl font-bold text-brand">
                    {thread.metrics.totalReactions}
                  </p>
                  <p className="text-xs text-ink-muted">Reactions</p>
                </div>
              </div>

              {/* Timeline and response time */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                {/* Duration */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink-muted">
                    Duration
                  </p>
                  <p className="text-sm font-bold text-ink">
                    {formatDuration(thread.timeline.durationMinutes)}
                  </p>
                </div>

                {/* Avg response time */}
                {thread.metrics.averageResponseTimeMinutes !== null && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-ink-muted">
                      Avg Response
                    </p>
                    <p className="text-sm font-bold text-ink">
                      {formatDuration(
                        thread.metrics.averageResponseTimeMinutes
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
