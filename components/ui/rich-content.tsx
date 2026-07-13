"use client";

import { MermaidDiagram, parseMermaidBlocks } from "./mermaid-diagram";

interface RichContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown-like content with support for:
 * - ```mermaid ... ``` blocks → rendered as interactive diagrams
 * - Regular text → rendered as HTML with basic markdown support
 */
export function RichContent({ content, className = "" }: RichContentProps) {
  const blocks = parseMermaidBlocks(content);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "mermaid") {
          return <MermaidDiagram key={i} chart={block.content} className="my-4" />;
        }
        // For text blocks, do basic HTML rendering
        return (
          <div
            key={i}
            className="prose prose-sm max-w-none text-ink prose-headings:text-ink prose-strong:text-ink prose-code:text-brand prose-code:bg-surface-tint prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-pre:bg-[#0D1117] prose-pre:text-slate-300 prose-a:text-brand"
            dangerouslySetInnerHTML={{
              __html: simpleMarkdown(block.content),
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Simple markdown → HTML converter ─────────────────────────────────────────
// Handles: headers, bold, italic, code blocks, inline code, links, images, lists,
// blockquotes, horizontal rules, tables.
function simpleMarkdown(md: string): string {
  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

    // Code blocks (``` ... ```)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="rounded-xl overflow-x-auto p-4 text-[13px] leading-relaxed"><code class="language-${lang ?? "text"}">${code.trim()}</code></pre>`;
    })

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold mt-6 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')

    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Blockquotes
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-brand/30 pl-4 py-1 my-3 text-ink-secondary italic">$1</blockquote>')

    // Horizontal rule
    .replace(/^\s*---+\s*$/gm, '<hr class="my-6 border-0 h-px bg-border" />')

    // Images (must run before links so ![alt](url) isn't caught as a link)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="my-4 mx-auto block max-w-full rounded-xl border border-border" />')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline" target="_blank" rel="noopener">$1</a>');

  // Group consecutive list items into a single <ul>/<ol> — fixes ordered lists
  // restarting at 1 for every item.
  html = groupLists(html);

  html = html
    // Tables (basic)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return ""; // separator row
      const tag = cells.some(c => c.startsWith("**")) ? "th" : "td";
      return `<tr>${cells.map(c => `<${tag} class="border border-border px-3 py-2 text-sm">${c}</${tag}>`).join("")}</tr>`;
    })

    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-3">')

    // Single newlines → <br>
    .replace(/\n/g, "<br />");

  // Wrap in paragraph
  html = `<p class="mb-3">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-3"><\/p>/g, "");

  // Wrap tables
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table class="w-full border-collapse my-4">$1</table>');

  return html;
}

// Walk the text line-by-line and fold runs of "- " / "N. " items (tolerating a
// single blank line between loose items) into one real <ul>/<ol>.
function groupLists(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  const olRe = /^\s*\d+\.\s+(.*)$/;
  const ulRe = /^\s*[-*]\s+(.*)$/;
  let i = 0;
  while (i < lines.length) {
    const ol = olRe.exec(lines[i]);
    const ul = ol ? null : ulRe.exec(lines[i]);
    if (ol || ul) {
      const ordered = !!ol;
      const re = ordered ? olRe : ulRe;
      const items: string[] = [];
      while (i < lines.length) {
        const m = re.exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
        // consume one blank line separating loose items of the same type
        if (lines[i]?.trim() === "" && re.test(lines[i + 1] ?? "")) i++;
      }
      const tag = ordered ? "ol" : "ul";
      const listCls = ordered ? "list-decimal" : "list-disc";
      out.push(
        `<${tag} class="my-4 pl-6 ${listCls} space-y-1.5 marker:text-ink-muted marker:font-semibold">` +
        items.map((it) => `<li class="pl-1 leading-relaxed">${it}</li>`).join("") +
        `</${tag}>`
      );
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out.join("\n");
}
