import type { MetadataRoute } from "next";

// TODO: switch BASE to the custom domain (square1ai.com) once DNS points to Vercel.
const BASE = "https://square1-tutor.vercel.app";

// Public, crawlable marketing/info pages.
const STATIC_PATHS = ["", "/business", "/diagnostic", "/courses", "/about", "/careers", "/contact", "/login", "/signup", "/privacy", "/terms"];

// The 12 course tracks (stable slugs).
const COURSE_SLUGS = [
  "generative-ai", "machine-learning", "artificial-intelligence", "ai-product-management",
  "llm-agent-architect", "computer-vision", "drone-technology", "fullstack-development",
  "game-development", "cybersecurity", "data-science", "devops-engineering",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...STATIC_PATHS.map((p) => ({
      url: `${BASE}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : p === "/business" || p === "/diagnostic" ? 0.9 : 0.7,
    })),
    ...COURSE_SLUGS.map((slug) => ({
      url: `${BASE}/courses/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
