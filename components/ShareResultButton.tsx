"use client";

import { useState } from "react";

interface ShareResultButtonProps {
  percentage: number;
  level: string;
  courseTitle: string;
  shareUrl?: string;
  subject?: string;
  answersParam?: string;
  dark?: boolean;
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function ShareResultButton({
  percentage,
  level,
  courseTitle,
  shareUrl,
  subject,
  answersParam,
  dark,
}: ShareResultButtonProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://square1-tutor.vercel.app";
  const url = shareUrl ?? `${origin}/diagnostic`;
  const text = shareUrl
    ? `I just took the Square 1 AI ${courseTitle} skill scan — ${level} level. Take yours free:`
    : `I scored ${percentage}/100 (${level}) on the Square 1 AI ${courseTitle} skill assessment. Find out where you stand — free, no signup:`;

  const ogBase = subject && answersParam
    ? `${origin}/api/og/diagnostic?subject=${subject}&a=${answersParam}`
    : null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  }

  async function nativeOrCopy() {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "My Square 1 AI Skill Scan", text, url });
        return;
      } catch { /* cancelled */ }
    }
    copyLink();
  }

  async function handleDownload(format: string, w: number, h: number, filename: string) {
    if (!ogBase) return;
    setDownloading(format);
    try {
      await downloadImage(`${ogBase}&format=${format}&w=${w}&h=${h}`, filename);
    } finally {
      setDownloading(null);
    }
  }

  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  const platforms = [
    {
      href: x, label: "X", bg: "#0F1419",
      icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
    },
    {
      href: linkedin, label: "LinkedIn", bg: "#0A66C2",
      icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />,
    },
    {
      href: whatsapp, label: "WhatsApp", bg: "#128C3E",
      icon: <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.523 5.26l-.999 3.648 3.965-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />,
    },
  ];

  const dlChip = dark
    ? "inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold border transition-all hover:-translate-y-0.5 border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
    : "inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold border transition-all hover:-translate-y-0.5 border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:opacity-50";
  const secBtn = dark
    ? "inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-bold border transition-all border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
    : "inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-bold border transition-all border-border bg-surface text-ink-secondary hover:border-brand/40 hover:text-brand";

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* The 3 options — big, branded platform buttons */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-md">
        {platforms.map((p) => (
          <a
            key={p.label}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/30"
            style={{ background: p.bg }}
            aria-label={`Share on ${p.label}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 transition-transform group-hover:scale-110">{p.icon}</svg>
            <span className="truncate">{p.label}</span>
          </a>
        ))}
      </div>

      {/* Secondary — copy link + native share */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button onClick={copyLink} className={secBtn}>
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              Link copied!
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copy link
            </>
          )}
        </button>
        <button onClick={nativeOrCopy} className={secBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
          Share&hellip;
        </button>
      </div>

      {/* Save a shareable image */}
      {ogBase && (
        <div className="flex flex-col items-center gap-2 pt-0.5">
          <span className={`text-[10.5px] font-bold uppercase tracking-wider ${dark ? "text-slate-500" : "text-ink-muted"}`}>Save a shareable image</span>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button onClick={() => handleDownload("story", 1080, 1920, `square1-${courseTitle.toLowerCase().replace(/\s/g, "-")}-story.png`)} disabled={downloading === "story"} className={dlChip}>
              <DownloadIcon />{downloading === "story" ? "…" : "Story"}
            </button>
            <button onClick={() => handleDownload("post", 1080, 1080, `square1-${courseTitle.toLowerCase().replace(/\s/g, "-")}-post.png`)} disabled={downloading === "post"} className={dlChip}>
              <DownloadIcon />{downloading === "post" ? "…" : "Post"}
            </button>
            <button onClick={() => handleDownload("linkedin", 1200, 627, `square1-${courseTitle.toLowerCase().replace(/\s/g, "-")}-linkedin.png`)} disabled={downloading === "linkedin"} className={dlChip}>
              <DownloadIcon />{downloading === "linkedin" ? "…" : "LinkedIn"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
