"use client";

import { useState } from "react";
import { Copy, Check, Download, Share2, FileText, MessageCircle } from "lucide-react";

// lucide-react removed its deprecated brand icons (Linkedin/Facebook/Twitter),
// so the brand glyphs live here as plain SVGs with the same `size` prop.
function LinkedinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
    </svg>
  );
}
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z" />
    </svg>
  );
}
function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ShareReportPanel — one row of real share paths for a PUBLIC report URL.
//
//  - LinkedIn / X / Facebook / WhatsApp: URL intents (the platforms unfurl the
//    link via the report's OG card).
//  - Instagram / TikTok: no web share APIs exist — the honest path is the
//    native share sheet with the image card attached (mobile), or downloading
//    the card and posting it. "More" uses navigator.share with the PNG file.
//  - PDF: opens the print dialog on a print-styled page → "Save as PDF".
// ═══════════════════════════════════════════════════════════════════════════════

export function ShareReportPanel({
  url,
  courseTitle,
  percentage,
  level,
  token,
}: {
  url: string;
  courseTitle: string;
  percentage: number;
  level: string;
  token: string;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const text = `My ${courseTitle} skill report on Square 1 AI — ${percentage}% (${level}). AI-graded, verifiable:`;
  const enc = encodeURIComponent;

  const intents = [
    { key: "linkedin", label: "LinkedIn", icon: LinkedinIcon, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { key: "x",        label: "X",        icon: XIcon,        href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { key: "facebook", label: "Facebook", icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function cardBlob(format: "portrait" | "square"): Promise<Blob> {
    const res = await fetch(`/api/og/report?token=${token}&format=${format}`);
    if (!res.ok) throw new Error("card failed");
    return res.blob();
  }

  // Native share sheet with the image attached — the path to Instagram/TikTok
  // (and everything else) on mobile. Falls back to link-only share, then copy.
  async function nativeShare() {
    setBusy("native");
    try {
      try {
        const blob = await cardBlob("portrait");
        const file = new File([blob], "skill-report.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "My Square 1 AI skill report", text: `${text} ${url}` });
          return;
        }
      } catch { /* fall through to link share */ }
      if (navigator.share) {
        await navigator.share({ title: "My Square 1 AI skill report", text, url });
      } else {
        await copyLink();
      }
    } catch { /* user cancelled the sheet */ } finally {
      setBusy(null);
    }
  }

  async function downloadCard(format: "portrait" | "square") {
    setBusy(format);
    try {
      const blob = await cardBlob(format);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `skill-report-${format}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch { /* card generation failed — non-fatal */ } finally {
      setBusy(null);
    }
  }

  const chip =
    "inline-flex items-center gap-1.5 h-11 px-3.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink-secondary hover:text-ink hover:border-brand/40 transition-colors disabled:opacity-50";

  return (
    <div className="print:hidden">
      <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-ink-muted mb-3">Share this report</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={copyLink} className={chip}>
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy link"}
        </button>
        {intents.map((s) => (
          <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className={chip}>
            <s.icon size={14} /> {s.label}
          </a>
        ))}
        <button onClick={nativeShare} disabled={busy === "native"} className={chip} title="Instagram, TikTok & more via your share sheet">
          <Share2 size={14} /> {busy === "native" ? "Opening…" : "Instagram / TikTok"}
        </button>
        <button onClick={() => downloadCard("portrait")} disabled={busy === "portrait"} className={chip} title="1080×1350 story/post card">
          <Download size={14} /> {busy === "portrait" ? "Preparing…" : "Post card"}
        </button>
        <button onClick={() => window.print()} className={chip} title="Print dialog → Save as PDF">
          <FileText size={14} /> Save as PDF
        </button>
      </div>
      <p className="mt-2.5 text-[11px] text-ink-muted text-center">
        Instagram &amp; TikTok don&apos;t accept web links — use the share sheet or download the post card.
      </p>
    </div>
  );
}
