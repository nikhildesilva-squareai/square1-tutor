"use client";

import { useEffect, useState } from "react";
import { CommunityMessage } from "./CommunityMessage";
import { CommunityMessageInput } from "./CommunityMessageInput";
import { useRealtimeMessages } from "@/lib/community/useRealtimeMessages";

interface CommunityProfile {
  id: string;
  avatar_url: string | null;
  bio: string | null;
  student_id?: string;
}

interface CommunityMessagesTabProps {
  communityId: string;
  currentUserProfile: CommunityProfile;
  communityMembers: CommunityProfile[];
}

export function CommunityMessagesTab({
  communityId,
  currentUserProfile,
  communityMembers,
}: CommunityMessagesTabProps) {
  const { messages, loading, error } = useRealtimeMessages(communityId);
  const [localMessages, setLocalMessages] = useState(messages);

  // Sync the hook's fetched/real-time messages into local state (the initial
  // fetch and any live updates arrive after mount). Keep any optimistic
  // messages that the server list doesn't have yet, deduped by id.
  useEffect(() => {
    setLocalMessages((prev) => {
      const serverIds = new Set(messages.map((m) => m.id));
      const optimisticOnly = prev.filter((m) => !serverIds.has(m.id));
      return [...optimisticOnly, ...messages];
    });
  }, [messages]);

  const handleMessageSent = (newMessage: any) => {
    setLocalMessages((prev) =>
      prev.some((m) => m.id === newMessage.id) ? prev : [newMessage, ...prev]
    );
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(
        `/api/communities/${communityId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (!response.ok) throw new Error("Failed to edit message");

      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: newContent,
                editedAt: new Date().toISOString(),
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Failed to edit message:", err);
      throw err;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/communities/${communityId}/messages/${messageId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete message");

      setLocalMessages((prev) =>
        prev.filter((msg) => msg.id !== messageId)
      );
    } catch (err) {
      console.error("Failed to delete message:", err);
      throw err;
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Message Input */}
      <CommunityMessageInput
        communityId={communityId}
        currentUserProfile={currentUserProfile}
        communityMembers={communityMembers}
        onMessageSent={handleMessageSent}
        isLoading={loading}
      />

      {/* Messages List */}
      <div className="space-y-3">
        {localMessages.length === 0 ? (
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-ink mb-1">
              No messages yet
            </h3>
            <p className="text-sm text-ink-muted">
              Start the conversation! Send a message below.
            </p>
          </div>
        ) : (
          localMessages.map((message) => (
            <CommunityMessage
              key={message.id}
              id={message.id}
              content={message.content}
              author={message.author}
              createdAt={message.createdAt}
              editedAt={message.editedAt}
              isDeleted={message.isDeleted}
              isOwn={message.authorId === currentUserProfile.id}
              attachments={message.attachments}
              mentionedProfileIds={message.mentionedProfileIds}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
            />
          ))
        )}
      </div>
    </div>
  );
}
