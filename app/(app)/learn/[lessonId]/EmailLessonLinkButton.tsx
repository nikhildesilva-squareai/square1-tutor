"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
//  Phone → computer bridge
// ═══════════════════════════════════════════════════════════════════════════
// Code exercises are painful on a phone keyboard. On small screens each code
// exercise carries a one-tap "Email me this lesson" so the student can finish
// on a computer without losing their place (deep link via /api/learn/email-link).
export function EmailLessonLinkButton({ lessonId }: { lessonId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function send() {
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/learn/email-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }
  return (
    <button
      type="button"
      onClick={send}
      disabled={status === "sending" || status === "sent"}
      className="shrink-0 text-[11px] font-bold text-amber-900 underline underline-offset-2 disabled:no-underline disabled:opacity-80"
    >
      {status === "sent" ? "✓ Sent to your inbox" : status === "sending" ? "Sending…" : status === "error" ? "Failed — tap to retry" : "Email me this lesson"}
    </button>
  );
}
