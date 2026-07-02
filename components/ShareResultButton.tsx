"use client";

import { useState } from "react";

// Tasteful share for the skill report. Shares a POSITIVE achievement
// (score + level) and points friends to the free skill check — never the
// private weak-areas breakdown. Multiple channels so it works on desktop too
// (navigator.share is mobile-only; desktop gets copy + intent links).
export function ShareResultButton({
  percentage,
  level,
  courseTitle,
  shareUrl,
}: {
  percentage: number;
  level: string;
  courseTitle: string;
  shareUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://square1-tutor.vercel.app";
  const url = shareUrl ?? `${origin}/diagnostic`;
  const text = shareUrl
    ? `I just took the Square 1 AI ${courseTitle} skill snapshot — ${level} level. Take yours free:`
    : `I scored ${percentage}/100 (${level}) on the Square 1 AI ${courseTitle} skill assessment. Find out where you stand — free, no signup:`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  }

  async function nativeOrCopy() {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "My Square 1 AI skill report", text, url });
        return;
      } catch {
        /* cancelled — fall through */
      }
    }
    copyLink();
  }

  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  const chip =
    "inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-bold border transition-all hover:-translate-y-0.5";

  return (
    <div className="flex flex-col items-center gap-2.5">
      <button
        onClick={nativeOrCopy}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold bg-brand text-white hover:bg-brand/90 hover:-translate-y-0.5 transition-all shadow-sm"
      >
        {copied ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            Link copied!
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Share my result
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button onClick={copyLink} className={`${chip} border-border bg-surface text-ink-secondary hover:border-brand/30 hover:text-brand`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          {copied ? "Copied" : "Copy link"}
        </button>
        <a href={x} target="_blank" rel="noopener noreferrer" className={`${chip} border-ink/15 bg-ink/[0.04] text-ink hover:bg-ink/[0.08]`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          Post on X
        </a>
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className={`${chip} border-[#0A66C2]/20 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" /></svg>
          LinkedIn
        </a>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${chip} border-[#25D366]/30 bg-[#25D366]/10 text-[#128C3E] hover:bg-[#25D366]/20`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.523 5.26l-.999 3.648 3.965-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
