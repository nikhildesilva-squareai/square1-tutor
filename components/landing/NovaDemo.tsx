"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// Public Nova demo — a real, working tutor chat on the landing page, no login.
// Talks to /api/nova-demo (Haiku, rate-limited). After ~6 turns or a rate-limit
// it converts to the free-assessment CTA.
// ═══════════════════════════════════════════════════════════════════════════════

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain how RAG works, simply.",
  "Why is my React useEffect running twice?",
  "What's the difference between SQL and NoSQL?",
  "Review this: for i in range(len(arr)): print(arr[i])",
];

// ─── Tiny markdown renderer (code fences, bold, inline code, bullets) ─────────
function renderContent(text: string) {
  const parts = text.split(/```(?:[a-zA-Z0-9]*)\n?([\s\S]*?)```/g);
  return parts.map((part, i) => {
    // Odd indices are code-block contents
    if (i % 2 === 1) {
      return (
        <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-black/40 border border-white/10 p-3 text-[12px] leading-relaxed">
          <code className="font-mono text-emerald-300">{part.replace(/\n$/, "")}</code>
        </pre>
      );
    }
    const lines = part.split("\n");
    return (
      <span key={i}>
        {lines.map((line, j) => {
          const isBullet = /^\s*[-*]\s+/.test(line);
          const clean = line.replace(/^\s*[-*]\s+/, "");
          const html = clean
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/`([^`]+?)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 font-mono text-[12px]">$1</code>');
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

export function NovaDemo() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [capped, setCapped] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading || capped) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/nova-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else if (data.error) {
        setMessages((m) => [...m, { role: "assistant", content: data.error }]);
      }
      if (data.capped || res.status === 429) setCapped(data.capped ?? "rate");
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Nova hit a snag — try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  const started = messages.length > 0;

  return (
    <section
      id="nova-demo"
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 scroll-mt-4"
      style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
    >
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(51,136,255,0.30) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Try it now · No signup
          </span>
          <h2 className="mt-4 font-black tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
            Meet Nova.{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Ask her anything.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            The same AI tutor that reviews your code inside the platform. Paste a bug, ask a concept — see for yourself.
          </p>
        </div>

        {/* Chat card */}
        <div className="rounded-3xl border border-white/10 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 24px 64px rgba(5,11,20,0.5)" }}>

          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, #0056CE, #7C3AED)" }}>N</div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Nova</p>
              <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-[340px] sm:h-[380px] overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {!started && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white mb-3"
                  style={{ background: "linear-gradient(135deg, #0056CE, #7C3AED)" }}>N</div>
                <p className="text-sm text-slate-400 max-w-xs">
                  Hi, I&apos;m Nova. Ask me to explain a concept, debug some code, or quiz you. Try one:
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-white/[0.06] text-slate-200 border border-white/8 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: "#0056CE" } : undefined}
                >
                  {m.role === "assistant" ? renderContent(m.content) : m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.06] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions (empty state) */}
          {!started && (
            <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs text-slate-300 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Capped → convert to assessment */}
          {capped ? (
            <div className="px-4 sm:px-5 py-4 border-t border-white/8 bg-white/[0.02] text-center">
              <p className="text-sm text-slate-300 mb-3">
                Want Nova to tutor you on <span className="text-white font-semibold">your</span> code and your weak spots?
              </p>
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)", boxShadow: "0 12px 32px rgba(0,86,206,0.35)" }}>
                Get your free skill report →
              </Link>
            </div>
          ) : (
            /* Input */
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="px-4 sm:px-5 py-3.5 border-t border-white/8 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Nova anything…"
                disabled={loading}
                className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #0056CE, #4F46E5)" }}
                aria-label="Send"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          Free demo · powered by Claude · no account needed
        </p>
      </div>
    </section>
  );
}
