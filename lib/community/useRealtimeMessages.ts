import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
  author: {
    id: string;
    avatar_url: string | null;
    bio: string | null;
  };
  mentionedProfileIds: string[];
  attachments: any[];
}

export function useRealtimeMessages(communityId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Initial fetch
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/communities/${communityId}/messages?limit=100&offset=0`
        );

        if (!response.ok) throw new Error("Failed to fetch messages");

        const { messages: initialMessages } = await response.json();
        setMessages(initialMessages || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [communityId]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`community-messages:${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch full message data including relations
            fetchMessageDetails(payload.new.id);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id
                  ? {
                      ...msg,
                      content: payload.new.content,
                      editedAt: payload.new.edited_at,
                      isDeleted: !!payload.new.deleted_at,
                    }
                  : msg
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const fetchMessageDetails = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(
          `/api/communities/${communityId}/messages?limit=1`
        );

        if (!response.ok) return;

        const { messages: fetchedMessages } = await response.json();
        const newMessage = fetchedMessages?.[0];

        if (newMessage) {
          setMessages((prev) => [newMessage, ...prev]);
        }
      } catch (err) {
        console.error("Failed to fetch message details:", err);
      }
    },
    [communityId]
  );

  return { messages, loading, error };
}
