"use client";

import { MermaidDiagram, parseMermaidBlocks } from "./mermaid-diagram";

interface RichContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown-like content with support for:
 * - ```mermaid ... ``` blocks → rendered as interactive diagrams
 * - Regular text → HTML via a small line-walking markdown parser
 *
 * The parser groups lines into paragraphs / headings / lists / tables /
 * blockquotes / rules, so a heading directly followed by prose (single
 * newline) no longer injects a stray <br/> gap. Type scale + spacing are set
 * explicitly (no `prose`) to stay consistent with the rest of the app.
 */
export function RichContent({ content, className = "" }: RichContentProps) {
  const blocks = parseMermaidBlocks(content);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "mermaid") {
          return <MermaidDiagram key={i} chart={block.content} className="my-4" />;
        }
        return (
          <div
            key={i}
            className="text-[15px] leading-relaxed text-ink-secondary"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
          />
        );
      })}
    </div>
  );
}

// ─── Markdown → HTML ──────────────────────────────────────────────────────────

const OL_RE = /^\s*\d+\.\s+(.*)$/;
const UL_RE = /^\s*[-*]\s+(.*)$/;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMarkdown(md: string): string {
  const codeBlocks: string[] = [];

  // Pull fenced code blocks out first so their contents survive escaping /
  // paragraph grouping untouched. Sentinels (@@…@@) can't collide with prose.
  let text = md.replace(/\r\n/g, "\n").replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = escapeHtml(String(code).replace(/\n$/, ""));
    codeBlocks.push(
      `<pre class="my-4 rounded-xl overflow-x-auto bg-[#0D1117] p-4 text-[13px] leading-relaxed text-slate-300"><code class="language-${lang ?? "text"}">${escaped}</code></pre>`
    );
    return `@@CODE${codeBlocks.length - 1}@@`;
  });

  text = escapeHtml(text);

  const lines = text.split("\n");
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p class="my-3 first:mt-0 last:mb-0">${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t === "") { flush(); i++; continue; }

    // Isolated fenced-code placeholder
    if (/^@@CODE\d+@@$/.test(t)) { flush(); out.push(t); i++; continue; }

    // Horizontal rule
    if (/^-{3,}$/.test(t)) { flush(); out.push('<hr class="my-6 border-0 h-px bg-border" />'); i++; continue; }

    // Heading (1–4 #). h1/h2 share a size — the hero carries the real page title.
    const h = t.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (h) {
      flush();
      const level = h[1].length;
      const inner = inline(h[2]);
      if (level <= 2) out.push(`<h3 class="text-lg font-bold text-ink mt-7 mb-2.5 first:mt-0">${inner}</h3>`);
      else if (level === 3) out.push(`<h4 class="text-[15px] font-bold text-ink mt-6 mb-2 first:mt-0">${inner}</h4>`);
      else out.push(`<h5 class="text-[13px] font-bold uppercase tracking-wide text-ink-muted mt-5 mb-1.5 first:mt-0">${inner}</h5>`);
      i++;
      continue;
    }

    // Lists — consume a run of same-type items (tolerating one blank line between loose items)
    if (OL_RE.test(line) || UL_RE.test(line)) {
      flush();
      const ordered = OL_RE.test(line);
      const re = ordered ? OL_RE : UL_RE;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(re.exec(lines[i])![1]);
        i++;
        if (lines[i]?.trim() === "" && re.test(lines[i + 1] ?? "")) i++;
      }
      const tag = ordered ? "ol" : "ul";
      const listCls = ordered ? "list-decimal" : "list-disc";
      out.push(
        `<${tag} class="my-4 pl-6 ${listCls} space-y-2 marker:text-ink-muted marker:font-semibold">` +
        items.map((it) => `<li class="pl-1 leading-relaxed">${inline(it)}</li>`).join("") +
        `</${tag}>`
      );
      continue;
    }

    // Table — a run of consecutive "|" lines with a separator row
    if (line.includes("|")) {
      const tbl: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim() !== "" && lines[j].includes("|")) { tbl.push(lines[j]); j++; }
      const hasSeparator = tbl.some((l) => /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(l));
      if (tbl.length >= 2 && hasSeparator) {
        flush();
        out.push(renderTable(tbl));
        i = j;
        continue;
      }
      // otherwise fall through and treat this single line as paragraph text
    }

    // Blockquote — consume a run of "> " lines
    if (/^&gt;\s?/.test(t)) {
      flush();
      const quote: string[] = [];
      while (i < lines.length && /^\s*&gt;\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*&gt;\s?/, ""));
        i++;
      }
      out.push(`<blockquote class="my-4 border-l-4 border-brand/30 pl-4 py-1 italic text-ink-secondary">${inline(quote.join(" "))}</blockquote>`);
      continue;
    }

    // Default: paragraph line (soft newlines join with a space)
    para.push(t);
    i++;
  }
  flush();

  let html = out.join("\n");
  html = html.replace(/@@CODE(\d+)@@/g, (_, n) => codeBlocks[Number(n)] ?? "");
  return html;
}

function renderTable(lines: string[]): string {
  const parse = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  let header: string[] | null = null;
  const body: string[][] = [];
  for (const l of lines) {
    const cells = parse(l);
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator row
    if (!header) header = cells;
    else body.push(cells);
  }
  const thead = header
    ? `<thead><tr>${header.map((c) => `<th class="border border-border bg-surface-tint/60 px-3 py-2 text-left text-[13px] font-semibold text-ink">${inline(c)}</th>`).join("")}</tr></thead>`
    : "";
  const tbody = `<tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td class="border border-border px-3 py-2 text-[13px] text-ink-secondary">${inline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<div class="my-4 overflow-x-auto"><table class="w-full border-collapse">${thead}${tbody}</table></div>`;
}

// Inline formatting: inline code (protected), images, links, bold, italic.
function inline(s: string): string {
  const codes: string[] = [];
  let r = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code class="rounded bg-surface-tint px-1.5 py-0.5 font-mono text-[0.9em] text-brand">${c}</code>`);
    return `@@IC${codes.length - 1}@@`;
  });

  r = r
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="my-4 mx-auto block max-w-full rounded-xl border border-border" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="font-medium text-brand hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-semibold text-ink"><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  r = r.replace(/@@IC(\d+)@@/g, (_, n) => codes[Number(n)] ?? "");
  return r;
}
