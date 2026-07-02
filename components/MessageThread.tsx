"use client";

import { useState, useEffect } from "react";
import { MessageReactions } from "./MessageReactions";

interface ThreadReply {
  id: string;
  parentMessageId: string;
  replyMessageId: string;
  createdAt: string;
  message: {
    id: string;
    content: string;
    authorId: string;
    createdAt: string;
    editedAt: string | null;
    author: {
      id: string;
      avatar_url: string | null;
      bio: string | null;
    };
    mentionedProfileIds: string[];
    attachments: any[];
  };
}

interface MessageThreadProps {
  parentMessageId: string;
  communityId: string;
  threadCount?: number;
  lastReplyAt?: string;
  onReplyCreated?: (reply: ThreadReply) => void;
}

export function MessageThread({
  parentMessageId,
  communityId,
  threadCount = 0,
  lastReplyAt,
  onReplyCreated,
}: MessageThreadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/messages/${parentMessageId}/threads?limit=50`
      );

      if (!response.ok) throw new Error("Failed to fetch replies");

      const data = await response.json();
      setReplies(data.threads || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && replies.length === 0) {
      fetchReplies();
    }
  }, [isExpanded]);

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;

    try {
      setPosting(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/messages/${parentMessageId}/threads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyContent.trim() }),
        }
      );

      if (!response.ok) throw new Error("Failed to post reply");

      const data = await response.json();
      const newReply = data.thread;

      setReplies([...replies, newReply]);
      setReplyContent("");
      setShowReplyForm(false);

      if (onReplyCreated) {
        onReplyCreated(newReply);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-2 ml-6 pt-2 border-l-2 border-brand/20 space-y-2">
      {/* Thread Summary */}
      {threadCount > 0 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
        >
          💬 {threadCount} {threadCount === 1 ? "reply" : "replies"}
          {lastReplyAt && ` • Last ${new Date(lastReplyAt).toLocaleDateString()}`}
        </button>
      )}

      {/* Expanded Thread */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            ▼ Hide {threadCount} replies
          </button>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <svg
                className="animate-spin h-4 w-4 text-brand mx-auto"
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
          )}

          {/* Error State */}
          {error && (
            <div className="p-2 rounded text-xs text-red-600 bg-red-50">
              {error}
            </div>
          )}

          {/* Replies List */}
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="p-3 rounded-lg bg-white/30 border border-border/50 space-y-2"
            >
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {reply.message.author.avatar_url ? (
                    <img
                      src={reply.message.author.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    "R"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink">
                    {reply.message.author.bio || "User"}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {new Date(reply.message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-ink">{reply.message.content}</p>

              {/* Reactions */}
              <MessageReactions
                messageId={reply.replyMessageId}
                communityId={communityId}
              />
            </div>
          ))}

          {/* Reply Form */}
          {!showReplyForm ? (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
            >
              + Reply
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 rounded border border-border bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
                rows={2}
                maxLength={5000}
              />

              <div className="flex gap-2">
                <button
                  onClick={handlePostReply}
                  disabled={posting || !replyContent.trim()}
                  className="text-xs px-3 py-1 rounded bg-brand text-white font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors"
                >
                  {posting ? "Posting..." : "Reply"}
                </button>

                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                  className="text-xs px-3 py-1 rounded bg-white/50 text-ink hover:bg-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-ink-muted">
                {replyContent.length}/5000
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
