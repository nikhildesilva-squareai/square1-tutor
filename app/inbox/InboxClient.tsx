"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Thread = {
  studentId: string; name: string; email: string;
  lastBody: string; lastSender: string; lastAt: string; unread: number;
};
type Msg = { id: string; sender: "student" | "team"; body: string; created_at: string };

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

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function InboxClient() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.studentId === active) ?? null;

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads ?? []);
    } catch { /* transient */ }
  }, []);

  const openThread = useCallback(async (studentId: string) => {
    setActive(studentId);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/messages/${studentId}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      // Clear the unread pill locally once opened.
      setThreads((ts) => ts.map((t) => (t.studentId === studentId ? { ...t, unread: 0 } : t)));
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => { loadThreads(); const id = setInterval(loadThreads, 20000); return () => clearInterval(id); }, [loadThreads]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = reply.trim();
    if (!body || sending || !active) return;
    setSending(true);
    const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "team", body, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setReply("");
    try {
      const res = await fetch(`/api/admin/messages/${active}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? data.message : x)));
      loadThreads();
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setReply(body);
    } finally {
      setSending(false);
    }
  }

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <div className="flex h-screen bg-surface-soft">
      {/* Thread list */}
      <aside className="w-full sm:w-80 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="px-4 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#4482E5,#075BCC)" }}>
            <BrandMark size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-ink leading-none">Support inbox</p>
            <p className="text-[11px] text-ink-muted mt-1">
              {totalUnread > 0 ? `${totalUnread} unread · ${threads.length} conversations` : `${threads.length} conversations`}
            </p>
          </div>
          <Link href="/dashboard" className="text-[11px] font-semibold text-ink-muted hover:text-ink">Exit</Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-12 px-6">No messages yet. When a student writes in, their conversation appears here.</p>
          )}
          {threads.map((t) => (
            <button key={t.studentId} onClick={() => openThread(t.studentId)}
              className={cn("w-full text-left px-4 py-3 border-b border-border/60 transition-colors hover:bg-surface-soft",
                active === t.studentId && "bg-brand/[0.06]")}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink truncate">{t.name}</span>
                <span className="text-[10px] text-ink-muted shrink-0">{timeAgo(t.lastAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-xs text-ink-muted truncate">
                  {t.lastSender === "team" ? "You: " : ""}{t.lastBody}
                </span>
                {t.unread > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                    {t.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex-1 flex flex-col min-w-0">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">
            Select a conversation to reply.
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-border bg-surface shrink-0">
              <p className="text-sm font-bold text-ink">{activeThread.name}</p>
              {activeThread.email && (
                <a href={`mailto:${activeThread.email}`} className="text-[11px] text-brand hover:underline">{activeThread.email}</a>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {loadingThread ? (
                  <p className="text-center text-sm text-ink-muted py-8">Loading…</p>
                ) : messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender === "team" ? "justify-end" : "justify-start")}>
                    <div className="flex flex-col max-w-[80%]">
                      <div className={cn("text-sm leading-relaxed whitespace-pre-wrap px-4 py-2.5 rounded-2xl",
                        m.sender === "team" ? "bg-brand text-white rounded-br-md" : "bg-surface border border-border text-ink rounded-bl-md")}>
                        {m.body}
                      </div>
                      <span className={cn("text-[10px] text-ink-muted mt-1", m.sender === "team" ? "text-right pr-1" : "pl-1")}>
                        {m.sender === "team" ? "You · " : `${activeThread.name} · `}{clock(m.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface shrink-0">
              <form onSubmit={send} className="max-w-2xl mx-auto flex gap-2 items-end">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
                  placeholder={`Reply to ${activeThread.name}…`} rows={1}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-soft text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus:border-brand resize-none"
                  style={{ minHeight: "44px", maxHeight: "160px" }} />
                <button type="submit" disabled={!reply.trim() || sending}
                  className={cn("h-11 px-5 rounded-xl text-sm font-bold shrink-0 transition-colors",
                    reply.trim() && !sending ? "bg-brand text-white hover:bg-brand/90" : "bg-surface-alt text-ink-muted")}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
              <p className="text-center text-[10px] text-ink-muted mt-2 max-w-2xl mx-auto">
                Your reply appears instantly in {activeThread.name}&apos;s in-app Messages.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
