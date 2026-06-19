"use client";

import { useEffect } from "react";

// Root-level error boundary — catches errors in the root layout itself, so it
// must render its own <html>/<body>. Kept dependency-free + inline-styled.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO: forward to error tracking (Sentry) once a DSN is configured.
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#050B14", color: "#fff", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#64748B", fontWeight: 700, marginBottom: 12 }}>Square 1 Ai</p>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(28px,6vw,52px)", lineHeight: 1, margin: "0 0 16px", letterSpacing: "-0.03em" }}>Something went wrong.</h1>
          <p style={{ fontSize: 15, color: "#94A3B8", maxWidth: 420, margin: "0 0 32px" }}>An unexpected error stopped the app from loading. Reloading usually fixes it.</p>
          <button onClick={reset} style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 12, padding: "14px 28px", cursor: "pointer" }}>
            Reload
          </button>
          {error?.digest && <p style={{ marginTop: 24, fontSize: 10, color: "#475569", fontFamily: "ui-monospace, monospace" }}>ref: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
