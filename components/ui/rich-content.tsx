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
// Handles: headers, bold, italic, code blocks, inline code, links, lists, blockquotes, tables
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

    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline" target="_blank" rel="noopener">$1</a>')

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

  // Wrap list items in <ul> or <ol>
  html = html.replace(/(<li class="ml-4 list-disc">[\s\S]*?<\/li>)/g, '<ul class="my-3">$1</ul>');
  html = html.replace(/(<li class="ml-4 list-decimal">[\s\S]*?<\/li>)/g, '<ol class="my-3">$1</ol>');

  // Wrap tables
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table class="w-full border-collapse my-4">$1</table>');

  return html;
}
