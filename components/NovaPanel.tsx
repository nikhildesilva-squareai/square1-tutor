"use client";

import { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// In-lesson Nova — a slide-over tutor panel that chats in-place with full lesson
// context. Talks to /api/tutor/chat (authed, budget-checked, Sonnet/Haiku).
// Opened from the lesson header, theory sections, and missed quiz questions.
// ═══════════════════════════════════════════════════════════════════════════════

export interface NovaContext {
  courseTitle: string;
  currentLessonTitle: string | null;
  lessonObjectives?: string[];
  lessonContentSummary?: string;
}

type Msg = { role: "user" | "assistant"; content: string };

function render(text: string) {
  const parts = text.split(/```(?:[a-zA-Z0-9]*)\n?([\s\S]*?)```/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-[#0D1117] border border-border p-3 text-[12px] leading-relaxed">
          <code className="font-mono text-emerald-600">{part.replace(/\n$/, "")}</code>
        </pre>
      );
    }
    return (
      <span key={i}>
        {part.split("\n").map((line, j) => {
          const isBullet = /^\s*[-*]\s+/.test(line);
          const clean = line.replace(/^\s*[-*]\s+/, "");
          const html = clean
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/`([^`]+?)`/g, '<code class="px-1 py-0.5 rounded bg-brand/10 text-brand font-mono text-[12px]">$1</code>');
          return (
            <span key={j} className={isBullet ? "flex gap-2" : "block"}>
              {isBullet && <span className="text-brand mt-0.5">•</span>}
              <span dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />
            </span>
          );
        })}
      </span>
    );
  });
}

export function NovaPanel({
  open,
  onClose,
  context,
  seed,
}: {
  open: boolean;
  onClose: () => void;
  context: NovaContext;
  seed?: { text: string; nonce: number } | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeedNonce = useRef<number>(-1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: {
            courseTitle: context.courseTitle,
            currentLessonTitle: context.currentLessonTitle,
            weakTopics: [],
            lessonObjectives: context.lessonObjectives,
            lessonContentSummary: context.lessonContentSummary,
          },
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.error ?? "Nova hit a snag — try again.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Nova hit a snag — try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-send a seeded question (from "Ask Nova" buttons) once per nonce
  useEffect(() => {
    if (open && seed && seed.nonce !== lastSeedNonce.current) {
      lastSeedNonce.current = seed.nonce;
      send(seed.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  const SUGGESTIONS = [
    `Explain "${context.currentLessonTitle ?? "this lesson"}" more simply`,
    "Give me a real-world example",
    "What are common mistakes here?",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Slide-over */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg,#0056CE,#7C3AED)" }}>N</div>
            <div>
              <p className="text-sm font-bold text-ink leading-none">Nova</p>
              <p className="text-[10px] text-ink-muted mt-0.5">knows this lesson</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center text-ink-muted" aria-label="Close Nova">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white mb-3"
                style={{ background: "linear-gradient(135deg,#0056CE,#7C3AED)" }}>N</div>
              <p className="text-sm text-ink-muted mb-4">Stuck on something? I&apos;ve got the full lesson loaded. Ask away.</p>
              <div className="space-y-2 w-full">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left text-xs text-ink-secondary px-3 py-2 rounded-lg border border-border bg-surface-soft hover:border-brand/30 hover:bg-surface-tint transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-brand text-white rounded-br-sm" : "bg-surface-soft text-ink border border-border rounded-bl-sm"
              }`}>
                {m.role === "assistant" ? render(m.content) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-soft border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="px-3 py-3 border-t border-border flex items-center gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Nova about this lesson…"
            disabled={loading}
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand/50 disabled:opacity-50"
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)" }} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </form>
      </aside>
    </>
  );
}
