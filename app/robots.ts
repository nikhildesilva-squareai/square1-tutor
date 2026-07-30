import type { MetadataRoute } from "next";

// Canonical host. square1ai.com 301s to www at the Vercel domain layer.
const BASE = "https://www.square1ai.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/learn/",
          "/tutor",
          "/notes",
          "/progress",
          "/projects",
          "/settings",
          "/business/dashboard",
          "/business/report",
          "/business/start",
          "/business/join",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
