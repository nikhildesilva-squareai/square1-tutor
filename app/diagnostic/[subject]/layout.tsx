import type { Metadata } from "next";
import { getSubject, SUBJECT_SEO } from "@/lib/diagnostic";

interface Props {
  params: Promise<{ subject: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await params;
  const sub = getSubject(subject);
  const seo = SUBJECT_SEO[subject];
  if (!sub || !seo) return { title: "Skill Check — Square 1 AI" };

  return {
    title: `${sub.title} Skill Check — Free, 3 Minutes`,
    description: seo.description,
    openGraph: {
      title: `${seo.h1} — Square 1 AI`,
      description: seo.description,
    },
  };
}

export default function SubjectDiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
