import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://square1-tutor.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Square 1 AI — Learn it. Build it. Ship it.",
    template: "%s | Square 1 AI",
  },
  description:
    "Get assessed. Get a personalised learning plan. Build 10–12 real deployed projects. Land the job or start your company. AI-powered tech education.",
  keywords: [
    "AI tutor", "learn to code", "tech education", "AI assessment",
    "coding projects", "personalised learning", "Square 1 AI",
    "online courses", "AI-powered education", "project-based learning",
  ],
  authors: [{ name: "Square 1 AI" }],
  creator: "Square 1 AI",
  publisher: "Square 1 AI",
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Square 1 AI",
    title: "Square 1 AI — Learn it. Build it. Ship it.",
    description: "AI-powered tech education. Get assessed, get a personalised learning plan, build real projects, and earn industry-recognised credentials.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Square 1 AI — Learn it. Build it. Ship it.",
    description: "AI-powered tech education. Get assessed, get a personalised learning plan, build real projects.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("sq1-theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}` }} />
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
      </body>
    </html>
  );
}
