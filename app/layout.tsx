import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("sq1-theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
