"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EnrollmentContext {
  enrollmentId: string;
  courseTitle: string;
  courseSlug: string;
  currentLessonTitle: string | null;
}

interface TutorClientProps {
  studentName: string;
  userEmail: string;
  enrollments: EnrollmentContext[];
  weakTopics: string[];
}

export function TutorClient({ studentName, userEmail, enrollments, weakTopics }: TutorClientProps) {
  const primaryEnrollment = enrollments[0] ?? null;

  const welcomeMessage = primaryEnrollment
    ? `Hi ${studentName}! I'm your Square 1 AI Tutor. I can see you're studying ${primaryEnrollment.courseTitle}${primaryEnrollment.currentLessonTitle ? `, currently on "${primaryEnrollment.currentLessonTitle}"` : ""}.\n\nAsk me anything about your coursework, and I'll give you specific, relevant help. What are you working on?`
    : `Hi ${studentName}! I'm your Square 1 AI Tutor. I'm here to help you learn, debug code, understand concepts, and work through any problems you're stuck on.\n\nWhat are you working on today?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentContext | null>(primaryEnrollment);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          context: selectedEnrollment
            ? {
                courseTitle: selectedEnrollment.courseTitle,
                currentLessonTitle: selectedEnrollment.currentLessonTitle,
                weakTopics,
              }
            : undefined,
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

  const suggestions = primaryEnrollment ? [
    `Explain ${primaryEnrollment.currentLessonTitle ?? "the current topic"} in simple terms`,
    `Give me a practice problem for ${primaryEnrollment.courseTitle}`,
    `What are common mistakes in ${weakTopics[0] ?? primaryEnrollment.courseTitle}?`,
    `Help me debug my code`,
  ] : [
    "Help me understand a concept",
    "Give me a coding challenge",
    "Explain like I'm a beginner",
    "Review my code for issues",
  ];

  function useSuggestion(text: string) {
    setInput(text);
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] lg:max-h-screen">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white text-sm font-bold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">AI Tutor</p>
              <p className="text-xs text-ink-muted">
                {primaryEnrollment ? `Helping with ${primaryEnrollment.courseTitle}` : "Your personal learning assistant"}
              </p>
            </div>
          </div>

          {/* Course selector */}
          {enrollments.length > 1 && (
            <select
              value={selectedEnrollment?.enrollmentId ?? ""}
              onChange={(e) => {
                const found = enrollments.find((en) => en.enrollmentId === e.target.value);
                setSelectedEnrollment(found ?? null);
              }}
              className="h-9 px-3 rounded-xl border border-border bg-surface text-ink text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {enrollments.map((en) => (
                <option key={en.enrollmentId} value={en.enrollmentId}>
                  {en.courseTitle}
                </option>
              ))}
            </select>
          )}
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

      {/* Suggestions — show when only welcome message */}
      {messages.length <= 1 && (
        <div className="bg-surface border-t border-border px-4 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => useSuggestion(s)}
                className="shrink-0 px-3 py-1.5 rounded-xl border border-border bg-surface-soft text-xs font-medium text-ink-secondary hover:border-brand/30 hover:text-brand transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

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
