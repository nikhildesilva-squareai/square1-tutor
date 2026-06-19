import type { MetadataRoute } from "next";

// TODO: switch BASE to the custom domain (square1ai.com) once DNS points to Vercel.
const BASE = "https://square1-tutor.vercel.app";

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
