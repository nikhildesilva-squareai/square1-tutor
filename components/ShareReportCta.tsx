"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareReportPanel } from "@/components/ShareReportPanel";

// ═══════════════════════════════════════════════════════════════════════════════
// ShareReportCta — sits on the PRIVATE report. First click mints the public
// share link (opt-in moment), then swaps into the full share panel. Nothing
// about the report is public until this button is pressed.
// ═══════════════════════════════════════════════════════════════════════════════

export function ShareReportCta({
  reportId,
  courseTitle,
  percentage,
  level,
}: {
  reportId: string;
  courseTitle: string;
  percentage: number;
  level: string;
}) {
  const [share, setShare] = useState<{ url: string; token: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function mint() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/report/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not create share link");
      setShare({ url: data.url, token: data.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (share) {
    return <ShareReportPanel url={share.url} token={share.token} courseTitle={courseTitle} percentage={percentage} level={level} />;
  }

  return (
    <div>
      <button
        onClick={mint}
        disabled={busy}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-brand/30 bg-surface-tint text-sm font-bold text-brand hover:border-brand/60 transition-colors disabled:opacity-60"
      >
        <Share2 size={15} />
        {busy ? "Creating link…" : "Share this report"}
      </button>
      <p className="mt-2 text-[11px] text-ink-muted">
        Creates a public link — your score and skill map, without your answers or study plan.
      </p>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
