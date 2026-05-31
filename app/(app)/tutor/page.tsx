"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = `Hi! I'm your Square 1 AI Tutor. I'm here to help you learn, debug code, understand concepts, and work through any problems you're stuck on.

What are you working on today?`;

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? "");
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I hit an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] lg:max-h-screen">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Square 1 AI Tutor</p>
            <p className="text-xs text-success">● Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={[
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0 mr-3 mt-0.5">
                  AI
                </div>
              )}
              <div
                className={[
                  "max-w-[80%] px-4 py-3 rounded-[var(--radius-lg)] text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-brand text-white rounded-br-sm"
                    : "bg-surface border border-border text-ink rounded-bl-sm shadow-card",
                ].join(" ")}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center text-xs font-bold text-ink-secondary shrink-0 ml-3 mt-0.5">
                  {(userEmail[0] ?? "U").toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0 mr-3 mt-0.5">
                AI
              </div>
              <div className="bg-surface border border-border px-4 py-3 rounded-[var(--radius-lg)] rounded-bl-sm shadow-card">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-surface border-t border-border px-4 py-4 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] border border-border bg-surface-soft text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            style={{ minHeight: "44px", maxHeight: "160px" }}
          />
          <Button type="submit" disabled={!input.trim() || loading} loading={loading}>
            Send
          </Button>
        </form>
        <p className="text-center text-xs text-ink-muted mt-2">
          AI can make mistakes. Always verify important information.
        </p>
      </div>
    </div>
  );
}
