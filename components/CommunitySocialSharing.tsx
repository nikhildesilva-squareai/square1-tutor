"use client";

import { useState } from "react";

interface CommunitySocialSharingProps {
  communityId: string;
  communityName: string;
  communitySlug: string;
}

type ShareChannel = "whatsapp" | "linkedin" | "facebook" | "twitter" | "email" | "direct_link";

const SHARE_CHANNELS: { channel: ShareChannel; icon: string; label: string; color: string }[] = [
  { channel: "whatsapp", icon: "💬", label: "WhatsApp", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  { channel: "linkedin", icon: "💼", label: "LinkedIn", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { channel: "facebook", icon: "f", label: "Facebook", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { channel: "twitter", icon: "𝕏", label: "Twitter", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  { channel: "email", icon: "✉️", label: "Email", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
];

export function CommunitySocialSharing({
  communityId,
  communityName,
  communitySlug,
}: CommunitySocialSharingProps) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleShare = async (channel: ShareChannel) => {
    try {
      setSharing(true);
      setError(null);

      const response = await fetch(
        `/api/communities/${communityId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shareChannel: channel,
            customMessage: customMessage || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create share link");
      }

      const { socialUrl, shareUrl } = await response.json();

      // Open share URL in new window for social platforms
      if (channel !== "direct_link") {
        window.open(socialUrl, "_blank", "width=600,height=400");
      } else {
        setSharedUrl(shareUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = () => {
    if (sharedUrl) {
      navigator.clipboard.writeText(sharedUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-surface border border-border">
      <h3 className="text-lg font-bold text-ink mb-4">Share This Community</h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Custom Message Input */}
      {showCustomMessage && (
        <div className="mb-4">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a personal message to share with your community..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
            rows={2}
            maxLength={200}
          />
          <p className="text-xs text-ink-muted mt-1">
            {customMessage.length}/200 characters
          </p>
        </div>
      )}

      {/* Share Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {SHARE_CHANNELS.map((ch) => (
          <button
            key={ch.channel}
            onClick={() => handleShare(ch.channel)}
            disabled={sharing}
            className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${ch.color}`}
          >
            <span className="mr-2">{ch.icon}</span>
            {ch.label}
          </button>
        ))}
      </div>

      {/* Direct Link Section */}
      {sharedUrl && (
        <div className="p-4 rounded-lg bg-brand/5 border border-brand/10">
          <p className="text-xs font-bold text-brand uppercase mb-2">Direct Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={sharedUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border border-brand/20 bg-white text-sm text-ink focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-lg bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-colors"
            >
              {copiedToClipboard ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Custom Message Toggle */}
      <label className="flex items-center gap-2 text-sm text-ink cursor-pointer mt-4">
        <input
          type="checkbox"
          checked={showCustomMessage}
          onChange={(e) => setShowCustomMessage(e.target.checked)}
          className="rounded"
        />
        Add a personal message
      </label>

      {/* Info */}
      <p className="text-xs text-ink-muted mt-4">
        💡 Share with friends and earn recognition as a community advocate!
      </p>
    </div>
  );
}
