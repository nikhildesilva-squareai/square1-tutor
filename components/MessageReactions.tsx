"use client";

import { useState, useEffect } from "react";

interface ReactionCount {
  emoji: string;
  count: number;
  reactor_ids: string[];
}

interface MessageReactionsProps {
  messageId: string;
  communityId: string;
}

const POPULAR_EMOJIS = ["👍", "😂", "❤️", "😍", "🔥", "😢", "🤔", "👏"];

export function MessageReactions({
  messageId,
  communityId,
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();
  }, [messageId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/messages/${messageId}/reactions`
      );

      if (!response.ok) throw new Error("Failed to fetch reactions");

      const data = await response.json();
      setReactions(data.reactions || []);
      setUserReactions(data.userReactions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      const response = await fetch(
        `/api/communities/${communityId}/messages/${messageId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        }
      );

      if (!response.ok) throw new Error("Failed to add reaction");

      setUserReactions([...userReactions, emoji]);
      setShowPicker(false);

      // Optimistically update count
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing) {
        setReactions(
          reactions.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
          )
        );
      } else {
        setReactions([...reactions, { emoji, count: 1, reactor_ids: [] }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    try {
      const response = await fetch(
        `/api/communities/${communityId}/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to remove reaction");

      setUserReactions(userReactions.filter((e) => e !== emoji));

      // Optimistically update count
      setReactions(
        reactions
          .map((r) =>
            r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r
          )
          .filter((r) => r.count > 0)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  const toggleReaction = (emoji: string) => {
    if (userReactions.includes(emoji)) {
      handleRemoveReaction(emoji);
    } else {
      handleAddReaction(emoji);
    }
  };

  if (error) {
    return (
      <div className="text-xs text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Existing Reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => toggleReaction(reaction.emoji)}
          className={`px-2 py-1 rounded-full text-sm font-medium transition-colors ${
            userReactions.includes(reaction.emoji)
              ? "bg-brand/20 text-brand border border-brand"
              : "bg-white/50 text-ink hover:bg-white/70 border border-border"
          }`}
          title={`You and ${reaction.count - (userReactions.includes(reaction.emoji) ? 1 : 0)} others`}
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-2 py-1 rounded-full text-sm hover:bg-white/50 transition-colors"
          title="Add reaction"
        >
          😊
        </button>

        {/* Emoji Picker */}
        {showPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 rounded-lg bg-surface border border-border shadow-lg z-10 grid grid-cols-4 gap-1 min-w-48">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleAddReaction(emoji);
                }}
                className="p-2 hover:bg-white/50 rounded text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
