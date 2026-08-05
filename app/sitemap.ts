import type { MetadataRoute } from "next";
import { RESEARCH_ARTICLES } from "@/lib/research";
import { ROLES } from "@/lib/roles-directory";
import { DIAG_SUBJECTS, SUBJECT_SEO } from "@/lib/diagnostic";
import { createAdminClient } from "@/lib/supabase/admin";

// Canonical host. square1ai.com 301s to www at the Vercel domain layer.
const BASE = "https://www.square1ai.com";

// Genuinely-public, crawlable pages only.
//
// /courses and /courses/{slug} are now public (see the depth-limited window in
// (app)/layout.tsx) and listed below. Deeper course routes — assess, checkout,
// plan, reassess, report, schedule — remain gated and are never listed.
const STATIC_PATHS = [
  "", "/business", "/diagnostic", "/about", "/careers", "/contact",
  "/privacy", "/terms", "/research", "/newsroom", "/newsroom/standards",
  "/roles", "/tools", "/business/ai-readiness", "/courses",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: (p === "/newsroom" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : p === "/business" || p === "/diagnostic" ? 0.9 : 0.6,
  }));
  // The 20 per-subject skill checks. Each is a real landing page — unique
  // metadata, FAQPage + Course structured data, and the live curriculum — and
  // they are the entry point to the funnel, so they rank just under the
  // homepage. They were previously absent from the sitemap entirely.
  const subjectEntries = DIAG_SUBJECTS
    .filter((s) => SUBJECT_SEO[s.slug])
    .map((s) => ({
      url: `${BASE}/diagnostic/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // The course overview pages themselves — the catalogue that was invisible
  // until now. Highest priority after the homepage: this is the page an answer
  // engine should cite when asked what Square 1 AI actually teaches.
  const courseEntries = DIAG_SUBJECTS
    .filter((s) => SUBJECT_SEO[s.slug])
    .map((s) => ({
      url: `${BASE}/courses/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  // The free first lesson of each course. Real lesson content behind no
  // account, with its own title — the strongest "show, don't tell" page on the
  // site, and it was unlisted too. Same slug set as the skill checks.
  const tryEntries = DIAG_SUBJECTS
    .filter((s) => SUBJECT_SEO[s.slug])
    .map((s) => ({
      url: `${BASE}/try/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // One page per role in the directory. Static content, so `now` is fine.
  const roleEntries = ROLES.map((r) => ({
    url: `${BASE}/roles/${r.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
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

  return [
    ...staticEntries,
    ...courseEntries,
    ...subjectEntries,
    ...tryEntries,
    ...roleEntries,
    ...researchEntries,
    ...newsEntries,
  ];
}
