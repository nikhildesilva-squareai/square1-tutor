"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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

// ─── Render markdown in AI responses ──────────────────────────────────────
function renderMessage(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
      const language = lang ?? "text";
      return `<div class="relative rounded-xl overflow-hidden my-3 border border-white/10 shadow-md group/code">
        <div class="flex items-center gap-2 px-3 py-1.5" style="background:#161B22">
          <div class="flex gap-1"><div class="w-2 h-2 rounded-full bg-[#FF5F57]"></div><div class="w-2 h-2 rounded-full bg-[#FEBC2E]"></div><div class="w-2 h-2 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[9px] font-bold tracking-widest uppercase text-slate-500 ml-1.5">${language}</span>
          <button onclick="navigator.clipboard.writeText(this.closest('.group\\/code').querySelector('code').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)" class="ml-auto text-[9px] font-bold text-slate-500 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors">Copy</button>
        </div>
        <pre class="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono" style="background:#0D1117;color:#E6EDF3"><code>${code.trim()}</code></pre>
      </div>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded text-[12px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<p class="font-bold text-ink mt-3 mb-1">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="font-bold text-ink text-base mt-3 mb-1">$1</p>')
    // Lists
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="w-1 h-1 rounded-full bg-ink-muted mt-2 shrink-0"></span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-brand font-bold text-xs mt-0.5 shrink-0">·</span><span>$1</span></div>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return html;
}

// ─── Mode config ──────────────────────────────────────────────────────────
const MODES = [
  { id: "learn", label: "Learn", icon: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z", desc: "Explain concepts" },
  { id: "debug", label: "Debug", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z", desc: "Fix your code" },
  { id: "quiz", label: "Quiz Me", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11", desc: "Test yourself" },
  { id: "review", label: "Review", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8", desc: "Code review" },
] as const;

type Mode = typeof MODES[number]["id"];

// ═══════════════════════════════════════════════════════════════════════════
export function TutorClient({ studentName, userEmail, enrollments, weakTopics }: TutorClientProps) {
  const primaryEnrollment = enrollments[0] ?? null;
  const [mode, setMode] = useState<Mode>("learn");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentContext | null>(primaryEnrollment);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  async function handleSend(e: React.FormEvent, overrideMessage?: string) {
    e.preventDefault();
    const userMessage = (overrideMessage ?? input).trim();
    if (!userMessage || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const modePrefix = mode === "debug" ? "I need help debugging. " :
        mode === "quiz" ? "Quiz me on this topic. Give me a question to answer: " :
        mode === "review" ? "Review this code for quality, bugs, and improvements: " : "";

      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: modePrefix + userMessage }],
          context: selectedEnrollment ? {
            courseTitle: selectedEnrollment.courseTitle,
            currentLessonTitle: selectedEnrollment.currentLessonTitle,
            weakTopics,
          } : undefined,
        }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I hit an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  // Smart suggestions based on mode + context
  function getSuggestions(): { label: string; text: string }[] {
    const lesson = selectedEnrollment?.currentLessonTitle ?? "the current topic";
    const course = selectedEnrollment?.courseTitle ?? "programming";
    const weak = weakTopics[0] ?? course;

    if (mode === "debug") return [
      { label: "Paste error message", text: "I'm getting this error: " },
      { label: "Code not working", text: "My code isn't producing the expected output. Here's what I have: " },
      { label: "Logic issue", text: "I think there's a logic error in my approach to " },
    ];
    if (mode === "quiz") return [
      { label: `Quiz: ${lesson}`, text: `Give me a quiz question about ${lesson}` },
      { label: `Practice: ${weak}`, text: `Give me a practice problem for ${weak}` },
      { label: "Random challenge", text: `Give me a random coding challenge for ${course}` },
    ];
    if (mode === "review") return [
      { label: "Review my code", text: "Please review this code:\n\n```python\n\n```" },
      { label: "Best practices", text: `What are the best practices for ${lesson}?` },
      { label: "Improve performance", text: "How can I optimize this code for better performance?" },
    ];
    // Learn mode
    return [
      { label: `Explain ${lesson}`, text: `Explain ${lesson} in simple terms with an example` },
      { label: `How does this work?`, text: `How does ${weak} work under the hood?` },
      { label: "Real-world example", text: `Give me a real-world example of ${lesson} used in production` },
      { label: "Common mistakes", text: `What are the most common mistakes beginners make with ${lesson}?` },
    ];
  }

  const suggestions = getSuggestions();
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] lg:max-h-screen">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Nova</p>
                <p className="text-[10px] text-ink-muted">
                  {selectedEnrollment ? `${selectedEnrollment.courseTitle}${selectedEnrollment.currentLessonTitle ? ` · ${selectedEnrollment.currentLessonTitle}` : ""}` : "Your personal learning assistant"}
                </p>
              </div>
            </div>

            {enrollments.length > 1 && (
              <select value={selectedEnrollment?.enrollmentId ?? ""}
                onChange={e => setSelectedEnrollment(enrollments.find(en => en.enrollmentId === e.target.value) ?? null)}
                className="h-8 px-2 rounded-lg border border-border bg-surface text-ink text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand">
                {enrollments.map(en => <option key={en.enrollmentId} value={en.enrollmentId}>{en.courseTitle}</option>)}
              </select>
            )}
          </div>

          {/* Mode tabs */}
          <div className="flex items-center gap-1 bg-surface-soft rounded-xl p-1">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center",
                  mode === m.id ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink hover:bg-surface-alt"
                )}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={m.icon} /></svg>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto w-full space-y-4">

          {/* Empty state — conversation starters */}
          {!hasMessages && (
            <div className="py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/10 to-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-ink mb-1">
                  {mode === "learn" ? "What do you want to learn?" :
                   mode === "debug" ? "Paste your code or error" :
                   mode === "quiz" ? "Ready to test yourself?" :
                   "Share code for review"}
                </h2>
                <p className="text-sm text-ink-muted max-w-sm mx-auto">
                  {mode === "learn" ? "I'll explain any concept from your course with examples and code." :
                   mode === "debug" ? "Share your code and the error — I'll find the bug and explain the fix." :
                   mode === "quiz" ? "I'll generate practice questions tailored to your course and weak areas." :
                   "Paste your code and I'll review it for bugs, best practices, and improvements."}
                </p>
              </div>

              {/* Starter cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={(e) => { setInput(s.text); handleSend(e as unknown as React.FormEvent, s.text); }}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-surface hover:border-brand/30 hover:bg-surface-soft transition-all group">
                    <p className="text-sm font-medium text-ink group-hover:text-brand transition-colors">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
              )}
              <div className={cn(
                "max-w-[85%] text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-brand text-white px-4 py-3 rounded-2xl rounded-br-md"
                  : "bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md shadow-card"
              )}>
                {msg.role === "assistant" ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }} />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center text-[10px] font-bold text-ink-secondary shrink-0 mt-0.5">
                  {(userEmail[0] ?? "U").toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md shadow-card">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Suggestions — always visible, adapt to conversation ── */}
      {hasMessages && (
        <div className="bg-surface-soft border-t border-border px-4 py-2 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
            {suggestions.slice(0, 3).map((s, i) => (
              <button key={i} onClick={(e) => { setInput(s.text); handleSend(e as unknown as React.FormEvent, s.text); }}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-border bg-surface text-[11px] font-medium text-ink-muted hover:border-brand/30 hover:text-brand transition-all">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────────── */}
      <div className="bg-surface border-t border-border px-4 py-3 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder={
                  mode === "learn" ? "Ask about any concept..." :
                  mode === "debug" ? "Paste your code or error message..." :
                  mode === "quiz" ? "Name a topic to be quizzed on..." :
                  "Paste code for review..."
                }
                rows={1}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-border bg-surface-soft text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                style={{ minHeight: "44px", maxHeight: "160px" }}
              />
            </div>
            <button type="submit" disabled={!input.trim() || loading}
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                input.trim() && !loading ? "bg-brand text-white hover:bg-brand/90" : "bg-surface-alt text-ink-muted"
              )}>
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-ink-muted mt-2">
            Shift+Enter for new line · AI can make mistakes
          </p>
        </form>
      </div>
    </div>
  );
}
