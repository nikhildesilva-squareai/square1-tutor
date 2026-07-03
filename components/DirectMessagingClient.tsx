"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface DirectMessagingClientProps {
  currentUserId: string;
  conversations: Conversation[];
  selectedConversationId?: string;
  messages?: Message[];
}

export function DirectMessagingClient({
  currentUserId,
  conversations: initialConversations,
  selectedConversationId,
  messages: initialMessages = [],
}: DirectMessagingClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(selectedConversationId);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedId) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageInput }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageInput("");

        // Update conversation preview
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedId
              ? {
                  ...conv,
                  lastMessage: messageInput,
                  lastMessageTime: new Date().toLocaleTimeString(),
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="h-screen bg-neutral-50 flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedId === conv.id
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        conv.participantAvatar ||
                        "https://via.placeholder.com/40"
                      }
                      alt={conv.participantName}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {conv.participantName}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {conv.lastMessageTime}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 p-6 flex items-center gap-3">
              <img
                src={
                  selectedConversation.participantAvatar ||
                  "https://via.placeholder.com/40"
                }
                alt={selectedConversation.participantName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h2 className="font-bold text-neutral-900">
                  {selectedConversation.participantName}
                </h2>
                <p className="text-xs text-neutral-500">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-neutral-500">
                    Start a conversation with{" "}
                    {selectedConversation.participantName}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm px-4 py-2 rounded-lg ${
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-neutral-100 text-neutral-900 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-blue-100" : "text-neutral-500"
                          }`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-neutral-200 p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500">Select a conversation to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
