import { marked } from "marked";
import { createClient } from "@/lib/supabase/server";
import type { NewsArticle, NewsTopic, NewsRegion } from "@/lib/newsroom-meta";

// ═══════════════════════════════════════════════════════════════════════════════
// Newsroom — daily technology news, drafted by the pipeline and published only
// after human review in /desk/newsroom. SERVER-ONLY module (Supabase server
// client). Topics, regions and types live in lib/newsroom-meta.ts, which is
// client-safe and re-exported here for server callers' convenience.
//
// Editorial rules enforced across the feature (not just intended):
//   - Every article credits its sources: `sources` is required to publish
//     (CHECK constraint news_articles_published_needs_sources).
//   - Summaries are original text. We never reproduce another outlet's
//     paragraphs; the Sources block links and names them instead.
//   - Reporting is neutral: what happened, why it matters to learners.
// ═══════════════════════════════════════════════════════════════════════════════

export * from "@/lib/newsroom-meta";

/** Render article markdown to HTML. Newsroom bodies are our own editorial
 * content (drafted by the pipeline, human-reviewed before publish) — the same
 * trust level as the research section, rendered the same way. */
export function renderNewsBody(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

// ─── Public read paths (RLS: published rows only) ────────────────────────────

export async function publishedArticles(opts?: {
  topic?: NewsTopic;
  region?: NewsRegion;
  limit?: number;
}): Promise<NewsArticle[]> {
  const supabase = await createClient();
  let query = supabase
    .from("news_articles")
    .select("id, slug, headline, dek, body_md, topic, region, sources, course_slugs, diagram, status, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(opts?.limit ?? 60);
  if (opts?.topic) query = query.eq("topic", opts.topic);
  if (opts?.region) query = query.eq("region", opts.region);
  const { data } = await query;
  return (data ?? []) as NewsArticle[];
}

export async function publishedArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_articles")
    .select("id, slug, headline, dek, body_md, topic, region, sources, course_slugs, diagram, status, published_at, created_at")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  return (data as NewsArticle | null) ?? null;
}
