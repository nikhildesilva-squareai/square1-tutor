import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const BASE = "https://square1-tutor.vercel.app";

export const metadata: Metadata = {
  title: "Editorial Standards — Square 1 AI Newsroom",
  description:
    "How the Square 1 AI Newsroom works: AI-assisted drafting, human review before anything is published, original summaries, and every source credited.",
  alternates: { canonical: `${BASE}/newsroom/standards` },
};

// The disclosure page Google News expects from AI-assisted publications — and
// the promise we make to readers. Every claim here is enforced in the product:
// drafts cannot publish themselves, and an article without sources cannot be
// published at all (database constraint).

const STANDARDS = [
  {
    title: "AI-assisted, human-reviewed",
    body: "Our drafting pipeline uses AI to summarise the day's technology news. Nothing is published automatically: every article is read, edited where needed, and approved by a member of the Square 1 team before it appears. If an article doesn't meet the bar, it isn't published.",
  },
  {
    title: "Original summaries, credited sources",
    body: "We write our own summaries — we do not republish other outlets' text. Every article carries a Sources section naming and linking the publications whose reporting it draws on. If we can't credit a source, we don't run the story.",
  },
  {
    title: "Neutral reporting",
    body: "The newsroom informs; it doesn't campaign. We report what happened and why it matters to people learning technology skills. We don't editorialise about governments, companies, or individuals.",
  },
  {
    title: "Corrections",
    body: "If we get something wrong, we correct the article and note the correction. You can reach us through the contact page.",
  },
  {
    title: "Why we run a newsroom",
    body: "Square 1 teaches AI, security, cloud and data skills. The news is context for that learning: many stories link to the course where we teach the skill behind the headline. That connection to our curriculum — not advertising — is why the newsroom exists.",
  },
];

export default function NewsroomStandardsPage() {
  return (
    <div className="min-h-dvh" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 40%,#F4F8FF 100%)" }}>
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 sm:px-8 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/newsroom" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          ← Newsroom
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 pb-24">
        <div className="pt-6 sm:pt-10 mb-8">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Newsroom
          </span>
          <h1 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.02]"
            style={{ fontSize: "clamp(26px, 3.4vw, 40px)" }}>
            Editorial standards
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            How this newsroom works, in plain terms.
          </p>
        </div>

        <div className="space-y-4">
          {STANDARDS.map((s) => (
            <section key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-black text-slate-900 mb-2">{s.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
