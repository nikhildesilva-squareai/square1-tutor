import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is required by the Monaco editor in the lesson player and
      // cannot be dropped. 'unsafe-inline' stays until inline scripts carry a
      // nonce — deliberately deferred: Next's nonce plumbing runs in proxy.ts
      // and would force every currently-static page (the landing page included)
      // to render dynamically, for partial hardening of a hole already closed
      // at source (all three renderers escape user text).
      // googletagmanager is required by components/GoogleAnalytics.tsx. Without
      // it the CSP silently blocked gtag.js, so GA4 never ran in production
      // despite being wired up. It stays consent-gated: nothing is requested
      // until the visitor picks "Allow analytics".
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://assets.calendly.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://assets.calendly.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.google-analytics.com",
      "media-src 'self' blob: https://*.supabase.co", // community post video attachments
      // No AI provider here on purpose: every model call is server-side, so the
      // browser never talks to Anthropic or DeepInfra directly. The old
      // api.anthropic.com grant was dead weight and is removed.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com",
      "frame-src 'self' https://calendly.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
