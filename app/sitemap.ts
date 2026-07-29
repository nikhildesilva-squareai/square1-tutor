import type { MetadataRoute } from "next";
import { RESEARCH_ARTICLES } from "@/lib/research";
import { createAdminClient } from "@/lib/supabase/admin";

// TODO: switch BASE to the custom domain (square1ai.com) once DNS points to Vercel.
const BASE = "https://square1-tutor.vercel.app";

// Genuinely-public, crawlable pages only. NOTE: /courses + /courses/[slug] are
// currently auth-gated (in the (app) group), so they're intentionally NOT listed
// — making them public marketing pages is the top SEO follow-up.
const STATIC_PATHS = [
  "", "/business", "/diagnostic", "/about", "/careers", "/contact",
  "/privacy", "/terms", "/research", "/newsroom", "/newsroom/standards",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: (p === "/newsroom" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : p === "/business" || p === "/diagnostic" ? 0.9 : 0.6,
  }));
  const researchEntries = RESEARCH_ARTICLES.map((a) => ({
    url: `${BASE}/research/${a.slug}`,
    lastModified: new Date(`${a.published}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Published news, newest first. The sitemap must never fail because the DB
  // hiccuped, so news entries are best-effort. Service role keeps this working
  // from the build/edge context where no user session exists.
  let newsEntries: MetadataRoute.Sitemap = [];
  try {
    const { data } = await createAdminClient()
      .from("news_articles")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);
    newsEntries = (data ?? []).map((a) => ({
      url: `${BASE}/newsroom/${a.slug}`,
      lastModified: a.published_at ? new Date(a.published_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch (e) {
    console.error("[sitemap] news entries skipped:", e);
  }

  return [...staticEntries, ...researchEntries, ...newsEntries];
}
