"use client";

import { useState } from "react";
import { Copy, Check, Download, Share2, FileText, Linkedin, Facebook, Twitter, MessageCircle } from "lucide-react";

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
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { key: "x",        label: "X",        icon: Twitter,  href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { key: "facebook", label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
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
