"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import katex from "katex";
import { cn } from "@/lib/utils";

// ─── Shared rich renderer for Study Hub notes ────────────────────────────────
// Notes are technical artifacts: code snippets, commands, error dumps, formulas.
// This renders them accordingly — fenced code (or whole-note code for
// code_snippet type) gets a highlighted block with a copy button and language
// badge; prose gets light markdown + KaTeX ($...$ and $$...$$).

type Segment = { kind: "code"; code: string; lang: string | null } | { kind: "text"; text: string };

function splitFences(content: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /```(\w+)?\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(content)) !== null) {
    if (m.index > last) segments.push({ kind: "text", text: content.slice(last, m.index) });
    segments.push({ kind: "code", code: m[2].replace(/\n$/, ""), lang: m[1] ?? null });
    last = m.index + m[0].length;
  }
  if (last < content.length) segments.push({ kind: "text", text: content.slice(last) });
  return segments;
}

/** Looks like code even without fences? Used to auto-upgrade code_snippet notes. */
function highlight(code: string, lang: string | null): { html: string; lang: string } {
  try {
    if (lang && hljs.getLanguage(lang)) {
      return { html: hljs.highlight(code, { language: lang }).value, lang };
    }
    const auto = hljs.highlightAuto(code);
    return { html: auto.value, lang: auto.language ?? "code" };
  } catch {
    // Fall back to escaped plain text.
    const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return { html: esc, lang: lang ?? "code" };
  }
}

export function CodeBlock({ code, lang, compact }: { code: string; lang: string | null; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const { html, lang: shownLang } = useMemo(() => highlight(code, lang), [code, lang]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className={cn("rounded-xl overflow-hidden border border-white/10", compact ? "my-1" : "my-3")}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#161B22" }}>
        <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500">{shownLang}</span>
        <button
          onClick={e => { e.stopPropagation(); copy(); }}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition-all",
            copied ? "text-emerald-400" : "text-slate-400 hover:text-white"
          )}
          aria-label="Copy code"
        >
          {copied ? (
            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>Copied</>
          ) : (
            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Copy</>
          )}
        </button>
      </div>
      <pre
        className={cn("overflow-x-auto font-mono", compact ? "p-3 text-[11px] leading-[1.6] max-h-40" : "p-4 text-[13px] leading-[1.7]")}
        style={{ background: "#0D1117", color: "#E6EDF3" }}
      >
        <code className="hljs-note" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

/** Light prose renderer: escape → KaTeX → inline code/bold/italic → line breaks. */
function proseHtml(text: string): string {
  // Extract math first so KaTeX output isn't escaped.
  const math: string[] = [];
  const renderMath = (tex: string, display: boolean) => {
    try { return katex.renderToString(tex.trim(), { displayMode: display, throwOnError: false, output: "html" }); }
    catch { return tex; }
  };
  let s = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
      math.push(`<div class="my-2 overflow-x-auto">${renderMath(tex, true)}</div>`);
      return `\x00M${math.length - 1}\x00`;
    })
    .replace(/\$([^$\n]+?)\$/g, (_m, tex: string) => {
      math.push(renderMath(tex, false));
      return `\x00M${math.length - 1}\x00`;
    });

  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  s = s
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded text-[0.9em] font-mono bg-brand/8 text-brand">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");

  for (let i = 0; i < math.length; i++) s = s.replace(`\x00M${i}\x00`, math[i]);
  return s;
}

interface NoteContentProps {
  content: string;
  /** The study_notes type — code_snippet notes render entirely as code when unfenced. */
  noteType?: string;
  compact?: boolean;
  className?: string;
}

export function NoteContent({ content, noteType, compact, className }: NoteContentProps) {
  const segments = useMemo(() => {
    const hasFence = content.includes("```");
    if (noteType === "code_snippet" && !hasFence) {
      return [{ kind: "code", code: content, lang: null } as Segment];
    }
    return splitFences(content);
  }, [content, noteType]);

  return (
    <div className={className}>
      {segments.map((seg, i) =>
        seg.kind === "code" ? (
          <CodeBlock key={i} code={seg.code} lang={seg.lang} compact={compact} />
        ) : seg.text.trim() ? (
          <p
            key={i}
            className={cn("whitespace-pre-wrap leading-relaxed", compact ? "text-xs" : "text-sm")}
            dangerouslySetInnerHTML={{ __html: proseHtml(seg.text.replace(/^\n+|\n+$/g, "")) }}
          />
        ) : null
      )}
    </div>
  );
}
