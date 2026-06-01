import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/ui/cookie-consent";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Square 1 AI — Learn it. Build it. Ship it.",
  description:
    "Get assessed. Get a personalised learning plan. Build 10–12 real deployed projects. Land the job or start your company. AI-powered tech education.",
  keywords: [
    "AI tutor",
    "learn to code",
    "tech education",
    "AI assessment",
    "coding projects",
    "personalised learning",
    "Square 1 AI",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
