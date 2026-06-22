"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string }
interface Conversation { id: string; title: string; mode: string; message_count: number; last_message_at: string; created_at: string }
interface EnrollmentContext { enrollmentId: string; courseTitle: string; courseSlug: string; currentLessonTitle: string | null }
interface TutorClientProps { studentName: string; userEmail: string; enrollments: EnrollmentContext[]; weakTopics: string[]; lessonObjectives?: string[]; lessonContentSummary?: string; usagePercent?: number }

// ─── Render markdown in AI responses ──────────────────────────────────────
function renderMessage(text: string): string {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
      const language = lang ?? "text";
      return `<div class="relative rounded-xl overflow-hidden my-3 border border-white/10 shadow-md group/code">
        <div class="flex items-center gap-2 px-3 py-1.5" style="background:#161B22">
          <div class="flex gap-1"><div class="w-2 h-2 rounded-full bg-[#FF5F57]"></div><div class="w-2 h-2 rounded-full bg-[#FEBC2E]"></div><div class="w-2 h-2 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[9px] font-bold tracking-widest uppercase text-slate-500 ml-1.5">${language}</span>
          <button onclick="navigator.clipboard.writeText(this.closest('.group\\/code').querySelector('code').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)" class="ml-auto text-[9px] font-bold text-slate-500 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">Copy</button>
        </div>
        <pre class="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono" style="background:#0D1117;color:#E6EDF3"><code>${code.trim()}</code></pre>
      </div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded text-[12px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    .replace(/^### (.+)$/gm, '<p class="font-bold text-ink mt-3 mb-1">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="font-bold text-ink text-base mt-3 mb-1">$1</p>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="w-1 h-1 rounded-full bg-ink-muted mt-2 shrink-0"></span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-brand font-bold text-xs mt-0.5 shrink-0">·</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
  return html;
}

// ─── Modes ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "learn", label: "Learn", icon: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" },
  { id: "debug", label: "Debug", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
  { id: "quiz", label: "Quiz", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { id: "review", label: "Review", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" },
  { id: "interview", label: "Interview", icon: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" },
] as const;

type Mode = typeof MODES[number]["id"];

// ═══════════════════════════════════════════════════════════════════════════
export function TutorClient({ studentName, userEmail, enrollments, weakTopics, lessonObjectives, lessonContentSummary, usagePercent = 0 }: TutorClientProps) {
  const primaryEnrollment = enrollments[0] ?? null;
  const [mode, setMode] = useState<Mode>("learn");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentContext | null>(primaryEnrollment);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (inputRef.current) { inputRef.current.style.height = "auto"; inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px"; } }, [input]);

  // Load conversation history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/tutor/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations ?? []);
        }
      } catch { /* ignore */ }
      finally { setLoadingHistory(false); }
    }
    loadHistory();
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/tutor/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, courseId: selectedEnrollment ? undefined : undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConvId(data.conversation.id);
        return data.conversation.id;
      }
    } catch { /* ignore */ }
    return null;
  }, [mode]);

  // Load messages for a conversation
  async function loadConversation(convId: string) {
    setActiveConvId(convId);
    setMessages([]);
    setSidebarOpen(false);
    try {
      // Fetch messages from Supabase via a simple API
      const res = await fetch(`/api/tutor/conversations?id=${convId}&messages=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })));
        }
      }
    } catch { /* ignore */ }
  }

  // Start new chat
  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  // Send message
  async function handleSend(e: React.FormEvent, overrideMessage?: string) {
    e.preventDefault();
    const userMessage = (overrideMessage ?? input).trim();
    if (!userMessage || loading) return;
    setInput("");

    // Create conversation if needed
    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation();
    }

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const interviewDomain = selectedEnrollment?.courseTitle ?? "software engineering";
      const modePrefix = mode === "debug" ? "I need help debugging. " :
        mode === "quiz" ? "Quiz me on this topic. Give me a question to answer: " :
        mode === "review" ? "Review this code for quality, bugs, and improvements: " :
        mode === "interview" && messages.length === 0
          ? `You are a senior technical interviewer for a ${interviewDomain} role. Run a realistic mock interview: ask ONE question at a time, wait for my answer, then give brief constructive feedback and ask the next. Mix conceptual and practical questions and adapt to my level. Begin now with your first question.\n\n`
          : "";

      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: modePrefix + userMessage }],
          context: selectedEnrollment ? {
            courseTitle: selectedEnrollment.courseTitle,
            currentLessonTitle: selectedEnrollment.currentLessonTitle,
            weakTopics,
            lessonObjectives: lessonObjectives ?? [],
            lessonContentSummary: lessonContentSummary ?? "",
          } : undefined,
          conversationId: convId,
        }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

      // Update conversation title in local state
      if (convId && messages.length === 0) {
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, title: userMessage.slice(0, 60) + (userMessage.length > 60 ? "..." : ""), message_count: 2 } : c
        ));
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I hit an error. Please try again." }]);
    } finally { setLoading(false); }
  }

  // Suggestions
  function getSuggestions(): { label: string; text: string }[] {
    const lesson = selectedEnrollment?.currentLessonTitle ?? "the current topic";
    const course = selectedEnrollment?.courseTitle ?? "programming";
    const weak = weakTopics[0] ?? course;
    if (mode === "debug") return [
      { label: "Paste error", text: "I'm getting this error: " },
      { label: "Code not working", text: "My code isn't producing the expected output: " },
    ];
    if (mode === "quiz") return [
      { label: `Quiz: ${lesson}`, text: `Quiz me on ${lesson}` },
      { label: "Random challenge", text: `Give me a coding challenge for ${course}` },
    ];
    if (mode === "review") return [
      { label: "Review my code", text: "Please review this code:\n\n```python\n\n```" },
      { label: "Best practices", text: `Best practices for ${lesson}?` },
    ];
    if (mode === "interview") return [
      { label: `Mock interview: ${course}`, text: `Start a mock interview for a ${course} role` },
      { label: "Behavioural question", text: "Ask me a behavioural interview question and assess my answer" },
    ];
    return [
      { label: `Explain ${lesson}`, text: `Explain ${lesson} simply with examples` },
      { label: `How does ${weak} work?`, text: `How does ${weak} work?` },
      { label: "Real-world example", text: `Real-world example of ${lesson}` },
      { label: "Common mistakes", text: `Common mistakes with ${lesson}?` },
    ];
  }

  const suggestions = getSuggestions();
  const hasMessages = messages.length > 0;

  // Format relative time
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex h-full max-h-[calc(100vh-3.5rem)] lg:max-h-screen">
      {/* ── Sidebar — Chat history ──────────────────────────────── */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-surface border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <p className="text-sm font-bold text-ink">Chat History</p>
          <div className="flex items-center gap-1">
            <button onClick={startNewChat}
              className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center text-ink-muted hover:text-brand transition-colors" title="New chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center text-ink-muted lg:hidden">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingHistory ? (
            <div className="px-4 py-8 text-center">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-ink-muted">No conversations yet</p>
              <p className="text-[10px] text-ink-muted mt-1">Start chatting with Nova</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all",
                    activeConvId === conv.id ? "bg-surface-tint border border-brand/20" : "hover:bg-surface-alt"
                  )}>
                  <p className="text-xs font-medium text-ink truncate">{conv.title}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">{conv.message_count} messages · {timeAgo(conv.last_message_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main chat area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-surface border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {/* History toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle chat history" aria-expanded={sidebarOpen}
              className="w-9 h-9 rounded-lg border border-border hover:bg-surface-alt flex items-center justify-center text-ink-muted hover:text-ink transition-colors shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Nova</p>
              <p className="text-[10px] text-ink-muted truncate">
                {selectedEnrollment ? `${selectedEnrollment.courseTitle}` : "Your AI learning companion"}
              </p>
            </div>

            {/* New chat button */}
            <button onClick={startNewChat}
              className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:text-brand hover:border-brand/30 transition-all flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center gap-1 bg-surface-soft rounded-xl p-1">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id as Mode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center",
                  mode === m.id ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink hover:bg-surface-alt"
                )}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={m.icon} /></svg>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Subtle AI usage meter — only surfaces once they're past 70% */}
          {usagePercent >= 70 && (
            <div className="max-w-3xl mx-auto mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-surface-alt overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, usagePercent)}%`, background: usagePercent >= 100 ? "#D97706" : "#0056CE" }} />
              </div>
              <span className="text-[10px] text-ink-muted font-medium shrink-0">
                {usagePercent >= 100 ? "Lite mode — still here for you" : `${Math.round(usagePercent)}% of monthly AI used`}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {/* Empty state */}
            {!hasMessages && (
              <div className="py-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/10 to-violet-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-ink mb-1">
                    {mode === "learn" ? "What do you want to learn?" : mode === "debug" ? "Paste your code or error" : mode === "quiz" ? "Ready to test yourself?" : mode === "interview" ? "Practice a real interview" : "Share code for review"}
                  </h2>
                  <p className="text-sm text-ink-muted max-w-sm mx-auto">
                    {mode === "learn" ? "I'll explain any concept with examples and code." : mode === "debug" ? "Share your code and the error — I'll find the fix." : mode === "quiz" ? "I'll generate practice questions for your weak areas." : mode === "interview" ? "I'll run a realistic mock interview for your target role — one question at a time, with feedback." : "Paste code and I'll review for bugs and improvements."}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={e => handleSend(e as unknown as React.FormEvent, s.text)}
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                  </div>
                )}
                <div className={cn("max-w-[85%] text-sm leading-relaxed",
                  msg.role === "user" ? "bg-brand text-white px-4 py-3 rounded-2xl rounded-br-md" : "bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md shadow-card"
                )}>
                  {msg.role === "assistant" ? <div dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }} /> : <span className="whitespace-pre-wrap">{msg.content}</span>}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center text-[10px] font-bold text-ink-secondary shrink-0 mt-0.5">
                    {(userEmail[0] ?? "U").toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                </div>
                <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md shadow-card">
                  <div className="flex gap-1 items-center h-5">
                    {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions — always visible */}
        {hasMessages && (
          <div className="bg-surface-soft border-t border-border px-4 py-2 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
              {suggestions.slice(0, 3).map((s, i) => (
                <button key={i} onClick={e => handleSend(e as unknown as React.FormEvent, s.text)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-border bg-surface text-[11px] font-medium text-ink-muted hover:border-brand/30 hover:text-brand transition-all">
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-surface border-t border-border px-4 py-3 shrink-0">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder={mode === "learn" ? "Ask Nova anything..." : mode === "debug" ? "Paste your code or error..." : mode === "quiz" ? "Name a topic to be quizzed on..." : mode === "interview" ? "Answer the question, or say 'start'..." : "Paste code for review..."}
                rows={1} className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-soft text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus:border-brand resize-none"
                style={{ minHeight: "44px", maxHeight: "160px" }} />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Send message"
                className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                  input.trim() && !loading ? "bg-brand text-white hover:bg-brand/90" : "bg-surface-alt text-ink-muted"
                )}>
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-ink-muted mt-2">Shift+Enter for new line</p>
          </form>
        </div>
      </div>
    </div>
  );
}
