// ═══════════════════════════════════════════════════════════════════════════
// Lesson markdown renderer — pure functions, no React. Fenced code blocks
// (with Copy / Save-to-Hub buttons), KaTeX math, tables, callouts, lists.
// Split out of LearnClient.tsx (UX review L4). Behaviour-identical.
// ═══════════════════════════════════════════════════════════════════════════

import katex from "katex";

// ─── Rich markdown renderer ───────────────────────────────────────────────

function renderMarkdownTable(tableBlock: string): string {
  const rows = tableBlock.trim().split("\n").filter(r => r.trim());
  if (rows.length < 2) return tableBlock;

  // Parse cells from a pipe-delimited row
  const parseCells = (row: string) =>
    row.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);

  // Detect separator row (|---|---|)
  const isSeparator = (row: string) => /^\|[\s:-]+\|/.test(row.trim()) && row.includes("-");

  const headerCells = parseCells(rows[0]);
  const hasSeparator = rows.length > 1 && isSeparator(rows[1]);
  const dataRows = hasSeparator ? rows.slice(2) : rows.slice(1);

  let tableHtml = `<div class="my-6 overflow-x-auto rounded-xl border border-border shadow-card">`;
  tableHtml += `<table class="w-full text-sm border-collapse">`;

  // Header
  if (hasSeparator && headerCells.length > 0) {
    tableHtml += `<thead><tr class="bg-brand/5 border-b-2 border-brand/15">`;
    for (const cell of headerCells) {
      tableHtml += `<th class="px-4 py-3 text-left text-xs font-bold text-ink uppercase tracking-wider">${cell}</th>`;
    }
    tableHtml += `</tr></thead>`;
  }

  // Body
  tableHtml += `<tbody>`;
  for (let i = 0; i < dataRows.length; i++) {
    const cells = parseCells(dataRows[i]);
    const stripe = i % 2 === 0 ? "bg-surface" : "bg-surface-soft/50";
    tableHtml += `<tr class="${stripe} border-b border-border/50 last:border-0">`;
    for (let j = 0; j < cells.length; j++) {
      const isFirstCol = j === 0;
      tableHtml += `<td class="px-4 py-3 ${isFirstCol ? "font-semibold text-ink" : "text-ink-secondary"}">${cells[j]}</td>`;
    }
    tableHtml += `</tr>`;
  }
  tableHtml += `</tbody></table></div>`;
  return tableHtml;
}

export function renderSection(md: string): string {
  if (!md) return "";

  // ── Step 1: Extract fenced code blocks to protect them ──
  const codeBlocks: string[] = [];
  let processed = md.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
    const language = lang ?? "text";
    const encoded = encodeURIComponent(code.trim());
    const btn = "flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer";
    const block = `<div class="relative rounded-xl overflow-hidden my-6 border border-white/10 shadow-lg">
        <div class="flex items-center gap-2 px-4 py-2.5" style="background:#161B22">
          <div class="flex gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div><div class="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div></div>
          <span class="text-[10px] font-bold tracking-widest uppercase text-slate-500 ml-2">${language}</span>
          <div class="ml-auto flex items-center gap-1">
            <button type="button" data-code-action="copy" data-code="${encoded}" class="${btn}">Copy</button>
            <button type="button" data-code-action="save" data-code="${encoded}" data-lang="${language}" class="${btn}" title="Save to your Study Hub cheatsheet">Save ➜ Hub</button>
          </div>
        </div>
        <pre class="p-5 overflow-x-auto text-[13px] leading-[1.75] font-mono" style="background:#0D1117;color:#E6EDF3"><code>${code.trim()}</code></pre>
      </div>`;
    codeBlocks.push(block);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // ── Step 1.5: Extract math ($$ block + $ inline) and render with KaTeX ──
  const mathBlocks: string[] = [];
  const renderMath = (tex: string, displayMode: boolean) => {
    try { return katex.renderToString(tex.trim(), { displayMode, throwOnError: false, output: "html" }); }
    catch { return tex; }
  };
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
    mathBlocks.push(`<div class="my-5 overflow-x-auto text-center">${renderMath(tex, true)}</div>`);
    return `\x00MATH${mathBlocks.length - 1}\x00`;
  });
  processed = processed.replace(/\$([^$\n]+?)\$/g, (_m, tex: string) => {
    mathBlocks.push(renderMath(tex, false));
    return `\x00MATH${mathBlocks.length - 1}\x00`;
  });

  // ── Step 2: Extract markdown tables ──
  const tableBlocks: string[] = [];
  processed = processed.replace(/((?:^\|.+\|\s*\n){2,})/gm, (tableMatch) => {
    tableBlocks.push(renderMarkdownTable(tableMatch));
    return `\x00TABLE${tableBlocks.length - 1}\x00`;
  });

  // ── Step 3: Escape HTML ──
  processed = processed
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ── Step 4: Inline + block formatting ──
  let html = processed
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-ink mt-6 mb-2 flex items-center gap-2"><span class="w-1 h-5 rounded-full bg-brand/30"></span>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-extrabold text-ink mt-8 mb-3 flex items-center gap-2"><span class="w-1.5 h-6 rounded-full bg-brand"></span>$1</h3>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^&gt; (.+)$/gm, `<div class="flex gap-3 my-5 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
      <svg class="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 7a4 4 0 014 4c0 1.5-.8 2.8-2 3.4V16H10v-1.6C8.8 13.8 8 12.5 8 11a4 4 0 014-4z"/></svg>
      <p class="text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-medium">$1</p>
    </div>`)
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-3 leading-relaxed py-1"><span class="w-1.5 h-1.5 rounded-full bg-brand mt-[9px] shrink-0"></span><span>$1</span></li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-3 leading-relaxed py-1"><span class="w-6 h-6 rounded-lg bg-surface-tint text-brand text-[11px] font-bold flex items-center justify-center mt-0.5 shrink-0">·</span><span>$1</span></li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline font-medium" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, '</p><p class="lc-para">')
    .replace(/\n/g, "<br />");
  html = `<p class="lc-para">${html}</p>`;
  html = html.replace(/<p class="lc-para"><\/p>/g, "");

  // ── Step 5: Restore code blocks and tables ──
  for (let i = 0; i < codeBlocks.length; i++) {
    html = html.replace(`\x00CODE${i}\x00`, codeBlocks[i]);
  }
  for (let i = 0; i < tableBlocks.length; i++) {
    html = html.replace(`\x00TABLE${i}\x00`, tableBlocks[i]);
  }
  for (let i = 0; i < mathBlocks.length; i++) {
    html = html.replace(`\x00MATH${i}\x00`, mathBlocks[i]);
  }

  return html;
}

// Inline-only markdown for short strings (exercise prompts): escapes HTML, then
// renders `code`, ***bold italic***, **bold**, *italic*. No block elements, so
// it can live safely inside the prompt's <p> without breaking its typography.
export function renderInlineMd(md: string): string {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-brand/8 text-brand border border-brand/15">$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}
