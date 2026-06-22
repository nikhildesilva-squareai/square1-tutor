"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Msg = { id: string; sender: "student" | "team"; body: string; created_at: string };

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " · " +
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MessagesClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-grow the textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function load(initial = false) {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      if (initial) setError("Couldn't load your messages. Refresh to try again.");
    } finally {
      if (initial) setLoading(false);
    }
  }

  // Initial load + light polling for team replies.
  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), 25000);
    return () => clearInterval(id);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    // Optimistic append
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      sender: "student",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Swap the optimistic message for the saved one.
      setMessages((m) => m.map((msg) => (msg.id === optimistic.id ? data.message : msg)));
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      setInput(body);
      setError("Message didn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#0056CE,#3388FF)" }}
          >
            S1
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink leading-none">Messages</p>
            <p className="text-[11px] text-ink-muted mt-1">
              Talk directly to the Square 1 team — questions, bugs, or feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.sender === "student" ? "justify-end" : "justify-start")}
              >
                {msg.sender === "team" && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg,#0056CE,#3388FF)" }}
                  >
                    S1
                  </div>
                )}
                <div className="flex flex-col max-w-[85%]">
                  <div
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap px-4 py-3 rounded-2xl",
                      msg.sender === "student"
                        ? "bg-brand text-white rounded-br-md"
                        : "bg-surface border border-border text-ink rounded-bl-md shadow-card"
                    )}
                  >
                    {msg.body}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-ink-muted mt-1",
                      msg.sender === "student" ? "text-right pr-1" : "pl-1"
                    )}
                  >
                    {msg.sender === "team" ? "Square 1 team · " : ""}
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="bg-surface border-t border-border px-4 sm:px-6 py-3 shrink-0">
        <form onSubmit={send} className="max-w-3xl mx-auto">
          {error && (
            <p className="text-[11px] text-error mb-2 text-center">{error}</p>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
              placeholder="Write a message to the team…"
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-soft text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus:border-brand resize-none"
              style={{ minHeight: "44px", maxHeight: "160px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                input.trim() && !sending ? "bg-brand text-white hover:bg-brand/90" : "bg-surface-alt text-ink-muted"
              )}
              aria-label="Send message"
            >
              {sending ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-ink-muted mt-2">
            We usually reply within a day. Shift+Enter for a new line.
          </p>
        </form>
      </div>
    </div>
  );
}
