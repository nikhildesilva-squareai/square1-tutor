"use client";
import { useEffect } from "react";

// Logs a diagnostic funnel event to /api/diagnostic/event on mount. An anonymous
// per-visitor session id (localStorage) ties a "started" to its "finished" so we
// can measure the started -> finished drop-off. Fire-and-forget; keepalive so it
// still sends if the page is navigating away.
function diagSessionId(): string {
  try {
    let id = localStorage.getItem("sq1_diag_session");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("sq1_diag_session", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function DiagnosticEvent({
  event,
  subject,
}: {
  event: "started" | "quiz_started" | "finished";
  subject: string;
}) {
  useEffect(() => {
    try {
      fetch("/api/diagnostic/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, subject, session_id: diagSessionId() }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [event, subject]);
  return null;
}
