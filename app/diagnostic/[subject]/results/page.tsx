import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter_Tight, Figtree } from "next/font/google";
import { getSubject, getDiagnostic, scoreDiagnostic, decodeAnswers } from "@/lib/diagnostic";
import ResultsClient from "./ResultsClient";

// Fonts for the redesigned (light) results page — self-hosted by next/font, so
// no external request / CSP issue. Inter Tight = body+display, Figtree = eyebrows.
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter-tight" });
const figtree = Figtree({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-figtree" });

interface Props {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ a?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { subject } = await params;
  const sp = await searchParams;
  const a = sp?.a;
  const sub = getSubject(subject);
  if (!sub) return { title: "Skill Snapshot — Square 1 AI" };

  const answers = decodeAnswers(a ?? null);
  const questions = getDiagnostic(subject);
  const result = answers ? scoreDiagnostic(questions, answers) : null;

  const title = result
    ? `${result.level} in ${sub.title} — Square 1 AI Skill Snapshot`
    : `${sub.title} Skill Snapshot — Square 1 AI`;

  const description = result
    ? `I scored ${result.score}/${result.total} on the ${sub.title} skill check. Take yours free — 3 minutes, no signup.`
    : `Take the free ${sub.title} skill check — 3 minutes, no signup.`;

  const ogParams = a
    ? `?subject=${subject}&a=${a}`
    : `?subject=${subject}&score=0&total=5&level=Beginner`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/diagnostic${ogParams}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/diagnostic${ogParams}`],
    },
  };
}

export default function DiagnosticResultsPage() {
  return (
    <div className={`${interTight.variable} ${figtree.variable}`}>
      <Suspense>
        <ResultsClient />
      </Suspense>
    </div>
  );
}
