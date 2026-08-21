import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { listBootcamps, formatCohortDate } from "@/lib/bootcamp/catalog";
import { displaySeatsLeft } from "@/lib/bootcamp/availability";
import { getRegion } from "@/lib/pricing-server";
import { BOOTCAMP_PRICING, formatUsd } from "@/lib/bootcamp/pricing";

const BASE = "https://www.square1ai.com";
const BRAND_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// generateMetadata, not a static `metadata` export: a static one is resolved and
// FLUSHED before the component runs, so notFound() rendered a 404 body under an
// HTTP 200. proxy.ts now guards the whole segment; the async resolver stays as
// the second line of defence.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Bootcamps — Square 1 AI",
    description:
      "Six-month live bootcamps with a weekly 1-1 with your instructor, six projects you cannot skip, and a credential an employer can verify in twenty seconds — including a recording of you defending your own code.",
    alternates: { canonical: `${BASE}/bootcamp` },
    openGraph: {
      title: "Bootcamps — Square 1 AI",
      description:
        "Six months, live, with a weekly 1-1. Graded against withheld answer keys, not opinions.",
      url: `${BASE}/bootcamp`,
      type: "website",
    },
  };
}

// Seat counts must never be cached — a stale count is a dishonest count (AD-08).
export const dynamic = "force-dynamic";

const HOW_IT_WORKS: [string, string][] = [
  ["Apply, then take a short assessment",
   "Free, about ten minutes plus twenty for the assessment. If this track is not the right level for you yet we say so BEFORE you pay — which is the whole reason it comes first."],
  ["A human reads your application",
   "Not a score threshold. Someone looks at what you wrote and what you can already do, then either offers you a seat or tells you why not."],
  ["Twenty-four weeks, six gates",
   "A live class each week, a 30-minute 1-1 that is yours, and six projects you cannot skip. The next block does not open until the last gate is passed."],
  ["Defend your own code on camera",
   "Twenty recorded minutes on your capstone, attached to your credential — so an employer can watch it instead of taking our word for anything."],
];

const HONEST: [string, string][] = [
  ["It is not for everyone",
   "If you can already learn from documentation and finish what you start, the self-paced track is the same curriculum for a tenth of the price. Buy the deadline and the person, or do not buy this."],
  ["You can fail",
   "Fail a gate and you get a written reason, a remediation path and one retry inside seven days. Fail twice and you defer to the next cohort at no extra cost. A programme nobody fails has a worthless certificate."],
  ["Fifty seats, and we mean it",
   "One instructor per cohort, at about 39 hours a week. We cannot add a fifty-first seat without making it worse for the fifty, so we do not."],
  ["We do not promise you a job",
   "Anyone who does is guessing. We promise graded proof, introductions to hiring partners, and a credential that can be checked in twenty seconds."],
];

export default async function BootcampLandingPage() {
  if (!BOOTCAMP_ENABLED) notFound();

  const entries = await listBootcamps();
  const open = entries.filter((e) => e.joinable);
  const upcoming = entries.filter((e) => !e.joinable);
  const region = await getRegion();
  const price = BOOTCAMP_PRICING[region];

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <nav className="max-w-6xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
        <Link href="/courses" className="text-sm font-medium text-ink-secondary hover:text-brand">
          Learn at your own pace →
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-6 sm:px-8 pt-10 sm:pt-16 pb-12">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">
          Live cohorts · six months
        </p>
        <h1
          className="text-4xl sm:text-6xl font-bold tracking-tight max-w-4xl bg-clip-text text-transparent leading-[1.05]"
          style={{ backgroundImage: BRAND_GRADIENT }}
        >
          A weekly hour with someone who has read your code.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-ink-secondary max-w-2xl leading-relaxed">
          Most people who quit a course did not need more content. They needed a deadline, and
          someone who noticed they had stopped. That is what this is.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={open.length > 0 ? `/bootcamp/${open[0].bootcamp.slug}` : "#tracks"}
            className="inline-flex items-center rounded-[8px] bg-brand text-white font-semibold text-sm px-7 py-3.5 hover:opacity-90 transition"
          >
            {open.length > 0 ? "See what's open" : "See the tracks"}
          </Link>
          <span className="text-sm text-ink-secondary">
            From <strong className="text-ink">{formatUsd(price.plans.full)}</strong> ·{" "}
            {formatUsd(price.list)} after the founding cohorts
          </span>
        </div>

        <dl className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            ["Weekly 30-min 1-1", "with your instructor, every week"],
            ["6 gates", "you cannot skip one"],
            ["50 seats", "one instructor per cohort"],
            ["Recorded viva", "attached to your credential"],
          ] as [string, string][]).map(([term, detail]) => (
            <div key={term} className="bg-surface border border-border rounded-[12px] p-5 shadow-sm">
              <dt className="font-semibold text-sm">{term}</dt>
              <dd className="text-xs text-ink-muted mt-1 leading-relaxed">{detail}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ── Why the certificate is worth checking ────────────────────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400">
            Why our certificate is worth checking
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Everyone says &ldquo;project-based&rdquo;. Almost nobody grades objectively.
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {([
              ["Withheld answer keys",
               "Your output is checked against ground truth you never see, and contract tests that run in CI. Not a rubric opinion, and not a tutor being kind on a Friday."],
              ["A viva you cannot outsource",
               "Twenty recorded minutes explaining code you wrote — why this design, what breaks at 100× traffic, walk me through line 40. It is the answer to “did an AI write this?”"],
              ["An AI tutor that read everything",
               "Nova has every submission and failed exercise of yours. Help at 2am is about your actual code, and your instructor walks into each 1-1 already knowing where you are stuck."],
            ] as [string, string][]).map(([title, body]) => (
              <div key={title} className="rounded-[12px] bg-white/5 border border-white/10 p-6">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-6">
          How it works
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HOW_IT_WORKS.map(([title, body], i) => (
            <li key={title} className="bg-surface border border-border rounded-[12px] p-6 shadow-sm">
              <span className="text-[11px] font-bold text-brand">STEP {i + 1}</span>
              <h3 className="mt-1.5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Tracks ───────────────────────────────────────────────────────────── */}
      <section id="tracks" className="max-w-6xl mx-auto px-6 sm:px-8 pb-16 scroll-mt-8">
        {open.length > 0 && (
          <>
            <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">
              Applications open
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
              {open.map((e) => (
                <Link
                  key={e.bootcamp.id}
                  href={`/bootcamp/${e.bootcamp.slug}`}
                  className="group bg-surface border border-border rounded-[12px] p-6 shadow-sm hover:shadow-md hover:border-brand transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold group-hover:text-brand">
                      {e.bootcamp.title}
                    </h3>
                    <span className="shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 bg-success-bg text-success">
                      {displaySeatsLeft(e.availability)} of {e.cohort!.seats} seats left
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                    {e.bootcamp.tagline}
                  </p>
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      Starts {formatCohortDate(e.cohort!.starts_on)}
                    </span>
                    <span className="font-semibold text-brand">Apply →</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              {open.length > 0 ? "Next intakes" : "The tracks"}
            </h2>
            <p className="text-sm text-ink-secondary mb-5 max-w-2xl leading-relaxed">
              Each cohort needs a full-time instructor, so we open tracks as we hire — and only
              when we can staff one properly. Join a list and you will hear before anyone else.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcoming.map((e) => (
                <Link
                  key={e.bootcamp.id}
                  href={`/bootcamp/${e.bootcamp.slug}`}
                  className="group bg-surface border border-border rounded-[12px] p-5 shadow-sm hover:border-border-mid transition"
                >
                  <h3 className="font-semibold text-sm group-hover:text-brand">
                    {e.bootcamp.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                    {e.bootcamp.tagline}
                  </p>
                  <span className="mt-4 inline-block text-[11px] font-semibold text-ink-secondary">
                    {e.availability.state === "full" ? "Next intake →" : "Notify me →"}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {entries.length === 0 && (
          <p className="text-ink-secondary">No bootcamps are published yet.</p>
        )}
      </section>

      {/* ── Price ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-16">
        <div className="bg-surface border border-brand rounded-[12px] p-8 shadow-sm max-w-2xl">
          <p className="text-[11px] font-semibold text-brand uppercase tracking-widest">
            Founding cohort price
          </p>
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <span className="text-5xl font-bold">{formatUsd(price.plans.full)}</span>
            <span className="text-ink-muted line-through text-lg">{formatUsd(price.list)}</span>
          </div>
          <p className="mt-4 text-sm text-ink-secondary leading-relaxed">
            One payment, and nothing after it — no instalments, no subscription, no card kept
            on file. {formatUsd(price.list)} once the founding cohorts are gone.
          </p>
          <p className="mt-4 text-sm text-ink-secondary leading-relaxed">
            A US bootcamp is $15,000 and does not give you a weekly 1-1. Applying costs nothing,
            and you are charged only if you are offered a seat and take it.
          </p>
        </div>
      </section>

      {/* ── The honest part ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-20">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          Before you apply
        </h2>
        <p className="text-sm text-ink-secondary mb-6 max-w-2xl leading-relaxed">
          Four things we would rather you knew now than found out in week five.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HONEST.map(([title, body]) => (
            <div key={title} className="bg-surface border border-border rounded-[12px] p-6 shadow-sm">
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-ink-secondary max-w-2xl leading-relaxed">
          Not sure of the level?{" "}
          <Link href="/skill-check" className="text-brand font-medium hover:underline">
            Take the free skill check
          </Link>{" "}
          — five minutes, costs nothing, and it tells you honestly where you stand.
        </p>
      </section>
    </main>
  );
}
