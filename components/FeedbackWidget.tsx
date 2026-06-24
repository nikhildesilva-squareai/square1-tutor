"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const CATEGORIES = [
  { key: "idea", label: "Idea" },
  { key: "confusing", label: "Confusing" },
  { key: "bug", label: "Bug" },
  { key: "praise", label: "Praise" },
  { key: "other", label: "Other" },
] as const;

const FACES = ["😞", "🙁", "😐", "🙂", "😍"];

/**
 * Persistent "Feedback" launcher (bottom-left to avoid the bottom-right
 * QuickNote FAB / Nova pill). Opens a small panel: optional 1–5 rating,
 * a category, and a message → POST /api/feedback. Trial-feedback capture.
 */
export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const panelRef = useRef<HTMLDivElement>(null);

  // Don't show on the auth/marketing surfaces — only inside the app.
  const hidden =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname === "/";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Allow other components (e.g. the sidebar "Feedback" item) to open the panel.
  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener("open-feedback", onOpen);
    return () => window.removeEventListener("open-feedback", onOpen);
  }, []);

  async function submit() {
    if (!message.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          ...(score ? { score } : {}),
          ...(category ? { category } : {}),
          page: pathname ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
      setTimeout(() => {
        setOpen(false);
        setState("idle");
        setMessage("");
        setScore(null);
        setCategory(null);
      }, 1400);
    } catch {
      setState("error");
    }
  }

  if (hidden) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 z-40 print:hidden">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Share feedback"
          className="mb-3 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface shadow-xl p-4 card-fade-up"
        >
          {state === "done" ? (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">🙏</div>
              <p className="text-sm font-bold text-ink">Thank you!</p>
              <p className="text-xs text-ink-muted mt-1">Your feedback helps us make Square 1 better.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-ink">Share feedback</p>
                <button onClick={close} aria-label="Close" className="text-ink-muted hover:text-ink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between mb-3">
                {FACES.map((face, i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i + 1)}
                    aria-label={`Rate ${i + 1} of 5`}
                    className={`w-10 h-10 rounded-xl text-xl transition-all ${score === i + 1 ? "bg-brand/10 ring-2 ring-brand scale-110" : "hover:bg-surface-alt"}`}
                  >
                    {face}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(category === c.key ? null : c.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${category === c.key ? "bg-brand text-white border-brand" : "bg-surface border-border text-ink-secondary hover:border-brand/30"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's working? What's confusing? What would make this better?"
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus:border-brand resize-none"
              />

              {state === "error" && (
                <p className="text-xs text-red-600 mt-2">Couldn&apos;t send — please try again.</p>
              )}

              <button
                onClick={submit}
                disabled={!message.trim() || state === "sending"}
                className={`mt-3 w-full h-10 rounded-xl text-sm font-bold transition-all ${message.trim() && state !== "sending" ? "bg-brand text-white hover:bg-brand/90" : "bg-border text-ink-muted cursor-not-allowed"}`}
              >
                {state === "sending" ? "Sending…" : "Send feedback"}
              </button>
              <p className="text-[10px] text-ink-muted text-center mt-2">Helps shape Square 1 during early access.</p>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="lg:hidden flex items-center gap-2 h-10 px-4 rounded-full bg-brand text-white text-sm font-bold shadow-lg hover:bg-brand/90 hover:-translate-y-0.5 transition-all"
        aria-expanded={open}
        aria-label="Give feedback"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        Feedback
      </button>
    </div>
  );
}
