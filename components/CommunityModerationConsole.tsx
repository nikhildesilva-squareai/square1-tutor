"use client";

import { useState, useEffect } from "react";

interface ModerationFlag {
  id: string;
  messageId: string;
  authorId: string;
  flagReason: string;
  aiConfidence: number | null;
  aiExplanation: string | null;
  status: string;
  createdAt: string;
  message: {
    id: string;
    content: string;
    created_at: string;
  };
  author: {
    id: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface CommunityModerationConsoleProps {
  communityId: string;
}

export function CommunityModerationConsole({
  communityId,
}: CommunityModerationConsoleProps) {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchPendingFlags();
    const interval = setInterval(fetchPendingFlags, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [communityId]);

  const fetchPendingFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/moderation/flags?limit=50`
      );

      if (!response.ok) throw new Error("Failed to fetch flags");

      const data = await response.json();
      setFlags(data.flags || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    flagId: string,
    action: "approved" | "deleted" | "warned_author" | "dismissed",
    escalate: boolean = false
  ) => {
    try {
      setReviewing(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/moderation/flags/${flagId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            notes: reviewNotes,
            escalate,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to review flag");

      // Remove from list
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
      setSelectedFlag(null);
      setReviewNotes("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setReviewing(false);
    }
  };

  if (loading && flags.length === 0) {
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

  if (flags.length === 0) {
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
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-ink mb-1">
          No flags pending
        </h3>
        <p className="text-sm text-ink-muted">
          Your community is clean! Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Flags List */}
      <div className="lg:col-span-1">
        <h2 className="text-lg font-bold text-ink mb-4">
          Pending Flags ({flags.length})
        </h2>
        <div className="space-y-2">
          {flags.map((flag) => (
            <button
              key={flag.id}
              onClick={() => setSelectedFlag(flag)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedFlag?.id === flag.id
                  ? "bg-brand/10 border-brand"
                  : "bg-surface border-border hover:border-brand/20"
              }`}
            >
              <p className="text-xs font-bold text-brand uppercase">
                {flag.flagReason}
              </p>
              <p className="text-sm text-ink font-semibold truncate mt-1">
                {flag.author.bio || flag.authorId.slice(0, 8)}
              </p>
              <p className="text-xs text-ink-muted truncate">
                {flag.message.content.slice(0, 50)}...
              </p>
              {flag.aiConfidence && (
                <p className="text-xs text-brand mt-2">
                  AI Confidence: {(flag.aiConfidence * 100).toFixed(0)}%
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Flag Details */}
      {selectedFlag && (
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-lg bg-surface border border-border">
            {/* Author Info */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
                {selectedFlag.author.avatar_url ? (
                  <img
                    src={selectedFlag.author.avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  "A"
                )}
              </div>
              <div>
                <p className="font-semibold text-ink">
                  {selectedFlag.author.bio || `User ${selectedFlag.authorId.slice(0, 8)}`}
                </p>
                <p className="text-xs text-ink-muted">
                  {new Date(selectedFlag.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Flag Reason */}
            <div className="mb-4">
              <p className="text-xs font-bold text-brand uppercase mb-1">
                Flag Reason
              </p>
              <p className="text-sm text-ink">{selectedFlag.flagReason}</p>
            </div>

            {/* AI Analysis */}
            {selectedFlag.aiConfidence && (
              <div className="mb-4 p-3 rounded-lg bg-brand/5 border border-brand/10">
                <p className="text-xs font-bold text-brand uppercase mb-1">
                  AI Analysis
                </p>
                <p className="text-sm text-ink mb-2">
                  Confidence: {(selectedFlag.aiConfidence * 100).toFixed(0)}%
                </p>
                {selectedFlag.aiExplanation && (
                  <p className="text-xs text-ink-muted">
                    {selectedFlag.aiExplanation}
                  </p>
                )}
              </div>
            )}

            {/* Message Content */}
            <div className="mb-4">
              <p className="text-xs font-bold text-ink-muted uppercase mb-2">
                Message
              </p>
              <div className="p-3 rounded-lg bg-white/50 border border-border">
                <p className="text-sm text-ink whitespace-pre-wrap">
                  {selectedFlag.message.content}
                </p>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <div className="p-4 rounded-lg bg-surface border border-border space-y-3">
            <div>
              <label className="text-xs font-bold text-ink-muted uppercase block mb-2">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Optional notes about your decision..."
                className="w-full p-2 rounded border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleReview(selectedFlag.id, "approved")
                }
                disabled={reviewing}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-sm hover:bg-green-200 disabled:opacity-50 transition-colors"
              >
                {reviewing ? "..." : "✓ Approve"}
              </button>

              <button
                onClick={() =>
                  handleReview(selectedFlag.id, "dismissed")
                }
                disabled={reviewing}
                className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {reviewing ? "..." : "✕ Dismiss"}
              </button>

              <button
                onClick={() =>
                  handleReview(selectedFlag.id, "deleted")
                }
                disabled={reviewing}
                className="px-3 py-2 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm hover:bg-orange-200 disabled:opacity-50 transition-colors"
              >
                {reviewing ? "..." : "🗑 Delete"}
              </button>

              <button
                onClick={() =>
                  handleReview(selectedFlag.id, "warned_author", true)
                }
                disabled={reviewing}
                className="px-3 py-2 rounded-lg bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                {reviewing ? "..." : "⚠ Escalate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
