"use client";

import { useState } from "react";

export function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 text-xs font-mono truncate"
      />
      <button
        onClick={copy}
        className="h-10 px-4 rounded-lg text-white text-sm font-bold shrink-0 transition-all hover:-translate-y-0.5"
        style={{ background: copied ? "#10B981" : "linear-gradient(135deg,#0056CE,#4F46E5)" }}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
