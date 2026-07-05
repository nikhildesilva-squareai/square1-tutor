import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

// ═══════════════════════════════════════════════════════════════════════════════
// Research article bodies — full text lives as markdown in /content/research,
// one file per registry slug (lib/research.ts). Rendered server-side to HTML.
//
// Server-only (uses fs): import from server components / route handlers only.
// ═══════════════════════════════════════════════════════════════════════════════

const CONTENT_DIR = path.join(process.cwd(), "content", "research");

export function getArticleMarkdown(slug: string): string | null {
  // Slug comes from the registry (or is validated against it) — never raw user
  // input — but normalise anyway so a crafted slug can't traverse out.
  const file = path.join(CONTENT_DIR, `${path.basename(slug)}.md`);
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
}

export function getArticleHtml(slug: string): { html: string; wordCount: number; readingMinutes: number } | null {
  const md = getArticleMarkdown(slug);
  if (!md) return null;
  const html = marked.parse(md, { async: false });
  const wordCount = md.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 220));
  return { html, wordCount, readingMinutes };
}

export function getReadingMinutes(slug: string): number | null {
  const md = getArticleMarkdown(slug);
  if (!md) return null;
  return Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 220));
}
