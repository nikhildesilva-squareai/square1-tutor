"use client";

import { useState, useEffect } from "react";

interface PinnedMessage {
  id: string;
  message_id: string;
  pin_title: string;
  pin_description: string | null;
  pin_category: string;
  pin_order: number;
  expires_at: string | null;
  views: number;
  pinned_at: string;
  community_messages: {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
    community_profiles: {
      id: string;
      avatar_url: string | null;
      bio: string | null;
    };
  };
}

interface CommunityPinnedMessagesProps {
  communityId: string;
  compact?: boolean;
}

const categoryIcons: Record<string, { icon: string; color: string }> = {
  announcement: { icon: "📢", color: "bg-blue-50 border-blue-200" },
  important: { icon: "⚠️", color: "bg-red-50 border-red-200" },
  resource: { icon: "📚", color: "bg-purple-50 border-purple-200" },
  event: { icon: "📅", color: "bg-green-50 border-green-200" },
  guide: { icon: "📖", color: "bg-yellow-50 border-yellow-200" },
};

export function CommunityPinnedMessages({
  communityId,
  compact = false,
}: CommunityPinnedMessagesProps) {
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPinned();
  }, [communityId]);

  const fetchPinned = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/communities/${communityId}/pinned`);

      if (!response.ok) throw new Error("Failed to fetch pinned messages");

      const data = await response.json();
      setPinned(data.pinned || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <svg
          className="animate-spin h-5 w-5 text-brand mx-auto"
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
    );
  }

  if (error || pinned.length === 0) {
    return null;
  }

  if (compact) {
    // Compact view: show as banner/alert style
    return (
      <div className="space-y-2 mb-6">
        {pinned.slice(0, 3).map((pin) => {
          const cat = categoryIcons[pin.pin_category] || categoryIcons.announcement;
          return (
            <div
              key={pin.id}
              className={`p-3 rounded-lg border flex items-start gap-3 ${cat.color}`}
            >
              <span className="text-lg shrink-0">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink">
                  {pin.pin_title}
                </p>
                {pin.pin_description && (
                  <p className="text-xs text-ink-muted truncate">
                    {pin.pin_description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink">📌 Pinned Announcements</h2>

      <div className="space-y-3">
        {pinned.map((pin) => {
          const cat = categoryIcons[pin.pin_category] || categoryIcons.announcement;
          const isExpanded = expandedId === pin.id;
          const isExpired = pin.expires_at && new Date(pin.expires_at) < new Date();

          return (
            <button
              key={pin.id}
              onClick={() =>
                setExpandedId(isExpanded ? null : pin.id)
              }
              className={`w-full text-left p-4 rounded-lg border transition-all ${cat.color} hover:shadow-md`}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{cat.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold text-ink">
                      {pin.pin_title}
                    </h3>
                    {isExpired && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        Expired
                      </span>
                    )}
                  </div>

                  {pin.pin_description && (
                    <p className="text-sm text-ink-muted mt-1">
                      {pin.pin_description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                    <span>👁️ {pin.views} views</span>
                    <span>📝 {pin.community_messages.content.length} chars</span>
                  </div>
                </div>

                <span className="text-lg shrink-0">
                  {isExpanded ? "▼" : "▶"}
                </span>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-current/10">
                  <div className="mb-3 p-3 rounded-lg bg-white/50">
                    <p className="text-sm text-ink whitespace-pre-wrap">
                      {pin.community_messages.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {pin.community_messages.community_profiles.avatar_url ? (
                        <img
                          src={pin.community_messages.community_profiles.avatar_url}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        "A"
                      )}
                    </div>
                    <span>
                      {pin.community_messages.community_profiles.bio || "User"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(pin.community_messages.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
