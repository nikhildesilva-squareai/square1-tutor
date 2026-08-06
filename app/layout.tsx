import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MetaPixel } from "@/components/MetaPixel";
import { FirstPartyAnalytics } from "@/components/FirstPartyAnalytics";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.square1ai.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Square 1 AI — Learn it. Build it. Ship it.",
    template: "%s | Square 1 AI",
  },
  description:
    "Two ways to learn AI: build a career in AI engineering with real deployed projects, or use AI better at your job — no code — with role tracks for marketers, finance, founders and more. Graded by Nova, our AI tutor.",
  keywords: [
    "AI tutor", "learn AI", "AI for work", "no-code AI", "AI for marketers",
    "AI for finance", "AI for founders", "prompt engineering", "tech education",
    "AI assessment", "personalised learning", "Square 1 AI", "AI-powered education",
  ],
  authors: [{ name: "Square 1 AI" }],
  creator: "Square 1 AI",
  publisher: "Square 1 AI",
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Square 1 AI",
    title: "Square 1 AI — Learn it. Build it. Ship it.",
    description: "Build a career in AI engineering, or use AI better at your job — no code. Personalised learning, real practice, graded by Nova.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Square 1 AI — Learn it. Build it. Ship it.",
    description: "Build a career in AI, or use AI better at your job — no code. Two paths, graded by Nova, our AI tutor.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: { icon: "/favicon.ico" },
};

// ─── Entity anchor ────────────────────────────────────────────────────────────
// Site-wide identity for search and answer engines. Without this there is
// nothing binding the name "Square 1 AI" to a single organisation, its social
// profiles, or this domain — so an engine summarising the site has no entity to
// attribute a claim to. Sitewide because the strongest entity signal is one
// consistent definition on every page. Facts only: no founding date, employee
// count or address until those are published somewhere on the site too.
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${siteUrl}/#organization`,
  name: "Square 1 AI",
  url: siteUrl,
  logo: `${siteUrl}/logo-square1.png`,
  description:
    "AI education platform with two lanes: career tracks that train people for AI engineering roles through code and deployed projects, and no-code role tracks that teach professionals to use AI well in the job they already have. Work is graded by Nova, the platform's AI tutor.",
  areaServed: "Worldwide",
  sameAs: [
    "https://www.linkedin.com/company/square-1-ai/",
    "https://x.com/square1ai",
    "https://youtube.com/@square1ai",
  ],
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "Square 1 AI",
  inLanguage: "en",
  publisher: { "@id": `${siteUrl}/#organization` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Prevent flash of wrong theme. Dark is an app-shell feature: the
            public funnel is light-only, so the early class only applies on app
            routes (mirrors DARK_SURFACES in components/ThemeProvider.tsx). */}
        <JsonLd data={ORGANIZATION_LD} />
        <JsonLd data={WEBSITE_LD} />
        <script dangerouslySetInnerHTML={{ __html: `try{const p=location.pathname;if(/^\\/(dashboard|learn|courses|projects|progress|settings|notes|tutor|messages|community|certificate|inbox|admin)(\\/|$)/.test(p)){const t=localStorage.getItem("sq1-theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand focus:text-white focus:font-semibold">
          Skip to content
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <CookieConsent />
        <GoogleAnalytics />
        {/* Meta pixel — consent-gated, same as GA. Renders nothing without
            NEXT_PUBLIC_META_PIXEL_ID or without an explicit "all". */}
        <MetaPixel />
        {/* First-party attribution → `events` table (own Supabase). Feeds the
            internal dashboard's source/funnel views. */}
        <FirstPartyAnalytics />
        {/* Vercel Web Analytics — route-level funnel: / → /diagnostic/[subject]
            → results → /signup → /dashboard. GA4 (above) activates separately
            once NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */}
        <Analytics />
      </body>
    </html>
  );
}
