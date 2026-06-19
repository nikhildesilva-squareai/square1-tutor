import type { MetadataRoute } from "next";

// TODO: switch BASE to the custom domain (square1ai.com) once DNS points to Vercel.
const BASE = "https://square1-tutor.vercel.app";

// Genuinely-public, crawlable pages only. NOTE: /courses + /courses/[slug] are
// currently auth-gated (in the (app) group), so they're intentionally NOT listed
// — making them public marketing pages is the top SEO follow-up.
const STATIC_PATHS = ["", "/business", "/diagnostic", "/about", "/careers", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "/business" || p === "/diagnostic" ? 0.9 : 0.6,
  }));
}
