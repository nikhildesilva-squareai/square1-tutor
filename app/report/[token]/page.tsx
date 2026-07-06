import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { SkillReportView } from "@/components/SkillReportView";
import { ShareReportPanel } from "@/components/ShareReportPanel";
import { getSharedReport } from "@/lib/report-share";

const BASE = "https://square1-tutor.vercel.app";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> },
): Promise<Metadata> {
  const { token } = await params;
  const shared = await getSharedReport(token);
  if (!shared) return { title: "Skill report not found" };
  const title = `${shared.firstName}'s ${shared.courseTitle} Skill Report — ${shared.report.percentage}%`;
  const description = `AI-graded skill report on Square 1 AI: ${shared.report.percentage}% (${shared.report.level}). Verifiable domain-by-domain skill map. Take your own free 3-minute skill check.`;
  const ogImage = `${BASE}/api/og/report?token=${token}&format=wide`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/report/${token}` },
    openGraph: {
      title,
      description,
      url: `${BASE}/report/${token}`,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function SharedReportPage(
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const shared = await getSharedReport(token);
  if (!shared) notFound();

  const { report, slug, courseTitle, firstName, sharedAt } = shared;
  const levelLabel = report.level.charAt(0).toUpperCase() + report.level.slice(1);

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header — public chrome, hidden in print/PDF */}
      <header className="print:hidden flex items-center justify-between px-5 sm:px-10 py-5 bg-surface border-b border-border">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link
          href="/diagnostic"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Get your own free skill report →
        </Link>
      </header>

      {/* Provenance strip — who shared it, when, and that it's AI-graded */}
      <div className="print:hidden bg-surface-tint border-b border-brand/10 px-4 py-2.5 text-center">
        <p className="text-xs text-ink-secondary">
          <span className="font-bold text-ink">{firstName}&apos;s verified skill report</span>
          {" · "}{courseTitle}
          {sharedAt ? ` · shared ${new Date(sharedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          {" · "}AI-graded on Square 1 AI
        </p>
      </div>

      <SkillReportView
        report={report}
        slug={slug}
        publicView
        shareSlot={
          <ShareReportPanel
            url={`${BASE}/report/${token}`}
            token={token}
            courseTitle={courseTitle}
            percentage={report.percentage}
            level={levelLabel}
          />
        }
      />

      {/* Print/PDF footer — only visible on paper */}
      <p className="hidden print:block text-center text-xs text-ink-muted py-6">
        Verified skill report · Square 1 AI · square1-tutor.vercel.app/report/{token}
      </p>
    </div>
  );
}
