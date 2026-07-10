"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Msg = { id: string; mine: boolean; fromTeam: boolean; body: string; created_at: string };

type Conversation = {
  id: string;
  otherStudentId: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
};

// Active thread selection: the pinned Square 1 team thread, or a student DM.
type Selection = { kind: "team" } | { kind: "dm"; id: string; name: string; avatarUrl: string | null };

function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 75 75" aria-hidden>
      <g fill="#FFFFFF">
        <rect x="0" y="0" width="75" height="8" /><rect x="0" y="0" width="8" height="75" />
        <rect x="67" y="0" width="8" height="24" /><rect x="0" y="67" width="45" height="8" />
      </g>
    </svg>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full bg-brand/10 text-brand font-semibold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

function TeamAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#4482E5,#075BCC)" }}
    >
      <BrandMark size={size * 0.42} />
    </div>
  );
}

export function MessagesClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teamUnread, setTeamUnread] = useState(0);
  const [selection, setSelection] = useState<Selection>({ kind: "team" });
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<Selection>(selection);
  selRef.current = selection;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, threadLoading]);

  const loadConversations = useCallback(async () => {
    try {
      const [dmRes, teamRes] = await Promise.all([
        fetch("/api/dm").then((r) => (r.ok ? r.json() : { conversations: [] })),
        fetch("/api/messages?count=1").then((r) => (r.ok ? r.json() : { unread: 0 })),
      ]);
      setConversations(dmRes.conversations ?? []);
      setTeamUnread(teamRes.unread ?? 0);
    } catch {
      /* ignore — list just stays put */
    }
  }, []);

  const loadThread = useCallback(async (sel: Selection, initial = false) => {
    if (initial) setThreadLoading(true);
    try {
      if (sel.kind === "team") {
        const res = await fetch("/api/messages");
        const data = await res.json();
        const msgs: Msg[] = (data.messages ?? []).map((m: { id: string; sender: string; body: string; created_at: string }) => ({
          id: m.id,
          mine: m.sender === "student",
          fromTeam: m.sender === "team",
          body: m.body,
          created_at: m.created_at,
        }));
        if (selRef.current.kind === "team") setMessages(msgs);
      } else {
        const res = await fetch(`/api/dm/${sel.id}`);
        const data = await res.json();
        const msgs: Msg[] = (data.messages ?? []).map((m: { id: string; mine: boolean; body: string; created_at: string }) => ({
          id: m.id,
          mine: m.mine,
          fromTeam: false,
          body: m.body,
          created_at: m.created_at,
        }));
        if (selRef.current.kind === "dm" && selRef.current.id === sel.id) setMessages(msgs);
      }
      setError(null);
    } catch {
      if (initial) setError("Couldn't load this conversation. Try again.");
    } finally {
      if (initial) setThreadLoading(false);
      // Opening a thread clears its unread — refresh the list badges.
      loadConversations();
    }
  }, [loadConversations]);

  const openSelection = useCallback((sel: Selection) => {
    setSelection(sel);
    setMessages([]);
    setMobileThreadOpen(true);
    loadThread(sel, true);
  }, [loadThread]);

  // Initial load + handle a ?to= / ?toProfile= deep link from community surfaces.
  useEffect(() => {
    loadConversations();
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    const toProfile = params.get("toProfile");

    async function bootstrap() {
      if (to || toProfile) {
        try {
          const res = await fetch("/api/dm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(to ? { recipientStudentId: to } : { recipientProfileId: toProfile }),
          });
          if (res.ok) {
            const { conversationId } = await res.json();
            // Clear the query param so a refresh doesn't re-trigger.
            window.history.replaceState({}, "", "/messages");
            setSelection({ kind: "dm", id: conversationId, name: "", avatarUrl: null });
            setMobileThreadOpen(true);
            loadThread({ kind: "dm", id: conversationId, name: "", avatarUrl: null }, true);
            return;
          }
        } catch {
          /* fall through to the team thread */
        }
      }
      // Default: show the Square 1 team thread in the desktop pane.
      loadThread({ kind: "team" }, true);
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Light polling of the active thread + list for new messages.
  useEffect(() => {
    const id = setInterval(() => {
      loadThread(selRef.current, false);
    }, 20000);
    return () => clearInterval(id);
  }, [loadThread]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    const sel = selection;

    setSending(true);
    setError(null);
    const optimistic: Msg = { id: `tmp-${Math.random()}`, mine: true, fromTeam: false, body, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setInput("");

    try {
      const url = sel.kind === "team" ? "/api/messages" : `/api/dm/${sel.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const saved: Msg =
        sel.kind === "team"
          ? { id: data.message.id, mine: true, fromTeam: false, body: data.message.body, created_at: data.message.created_at }
          : { id: data.message.id, mine: true, fromTeam: false, body: data.message.body, created_at: data.message.created_at };
      setMessages((m) => m.map((msg) => (msg.id === optimistic.id ? saved : msg)));
      loadConversations();
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      setInput(body);
      setError("Message didn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  const activeName =
    selection.kind === "team"
      ? "Square 1 team"
      : selection.name || conversations.find((c) => c.id === selection.id)?.name || "Student";
  const activeAvatar =
    selection.kind === "dm"
      ? selection.avatarUrl ?? conversations.find((c) => c.id === selection.id)?.avatarUrl ?? null
      : null;

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <aside
        className={cn(
          "w-full md:w-80 md:shrink-0 border-r border-border bg-surface flex-col",
          mobileThreadOpen ? "hidden md:flex" : "flex"
        )}
      >
        <div className="px-4 py-4 border-b border-border shrink-0">
          <p className="text-lg font-bold text-ink">Messages</p>
          <p className="text-[11px] text-ink-muted mt-0.5">The Square 1 team and your fellow learners.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Square 1 team — pinned */}
          <button
            onClick={() => openSelection({ kind: "team" })}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-alt",
              selection.kind === "team" && "bg-surface-alt"
            )}
          >
            <TeamAvatar />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink truncate">Square 1 team</span>
                {teamUnread > 0 && <span className="h-2 w-2 rounded-full bg-brand shrink-0" />}
              </div>
              <p className="text-[12px] text-ink-muted truncate">Questions, bugs, or feedback</p>
            </div>
          </button>

          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Direct messages</p>
          </div>

          {conversations.length === 0 ? (
            <p className="px-4 py-3 text-[12px] text-ink-muted leading-relaxed">
              No conversations yet. Open a community and message a fellow learner from their profile.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openSelection({ kind: "dm", id: c.id, name: c.name, avatarUrl: c.avatarUrl })}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-alt",
                  selection.kind === "dm" && selection.id === c.id && "bg-surface-alt"
                )}
              >
                <Avatar name={c.name} url={c.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink truncate">{c.name}</span>
                    <span className="text-[10px] text-ink-muted shrink-0">{formatTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-ink-muted truncate">{c.lastMessage ?? "Say hi 👋"}</p>
                    {c.unread > 0 && <span className="h-2 w-2 rounded-full bg-brand shrink-0" />}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Active thread */}
      <section className={cn("flex-1 flex-col min-w-0", mobileThreadOpen ? "flex" : "hidden md:flex")}>
        {/* Header */}
        <div className="bg-surface border-b border-border px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileThreadOpen(false)}
              className="md:hidden -ml-1 p-1 text-ink-muted hover:text-ink"
              aria-label="Back to conversations"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {selection.kind === "team" ? <TeamAvatar size={36} /> : <Avatar name={activeName} url={activeAvatar} size={36} />}
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink leading-none truncate">{activeName}</p>
              <p className="text-[11px] text-ink-muted mt-1">
                {selection.kind === "team" ? "Talk directly to the Square 1 team." : "Direct message"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {threadLoading ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-[13px] text-ink-muted py-12">
                {selection.kind === "team" ? "Start the conversation with the team." : `Say hello to ${activeName}.`}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.mine ? "justify-end" : "justify-start")}>
                  {!msg.mine && (selection.kind === "team" ? <TeamAvatar size={28} /> : <Avatar name={activeName} url={activeAvatar} size={28} />)}
                  <div className="flex flex-col max-w-[85%]">
                    <div
                      className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap px-4 py-3 rounded-2xl",
                        msg.mine
                          ? "bg-brand text-white rounded-br-md"
                          : "bg-surface border border-border text-ink rounded-bl-md shadow-card"
                      )}
                    >
                      {msg.body}
                    </div>
                    <span className={cn("text-[10px] text-ink-muted mt-1", msg.mine ? "text-right pr-1" : "pl-1")}>
                      {msg.fromTeam ? "Square 1 team · " : ""}
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
            {error && <p className="text-[11px] text-error mb-2 text-center">{error}</p>}
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
                placeholder={selection.kind === "team" ? "Write a message to the team…" : `Message ${activeName}…`}
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
              {selection.kind === "team" ? "We usually reply within a day. " : ""}Shift+Enter for a new line.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
