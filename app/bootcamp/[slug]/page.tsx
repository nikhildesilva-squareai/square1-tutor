import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { getBootcamp, formatCohortDate } from "@/lib/bootcamp/catalog";
import { displaySeatsLeft } from "@/lib/bootcamp/availability";
import { getRegion } from "@/lib/pricing-server";
import { BOOTCAMP_PRICING, formatUsd, threePartTotal } from "@/lib/bootcamp/pricing";
import { firstClassInstant, localSessionTime } from "@/lib/bootcamp/localtime";

const BASE = "https://www.square1ai.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getBootcamp(slug);
  if (!entry) return { title: "Bootcamp not found" };
  return {
    title: `${entry.bootcamp.title} — Square 1 AI`,
    description: entry.bootcamp.tagline ?? undefined,
    alternates: { canonical: `${BASE}/bootcamp/${slug}` },
    openGraph: {
      title: `${entry.bootcamp.title} — Square 1 AI`,
      description: entry.bootcamp.tagline ?? undefined,
      url: `${BASE}/bootcamp/${slug}`,
      type: "website",
    },
  };
}

// Seat counts must never be cached — a stale count is a dishonest count (AD-08).
export const dynamic = "force-dynamic";

export default async function BootcampSalesPage({ params }: PageProps) {
  if (!BOOTCAMP_ENABLED) notFound();

  const { slug } = await params;
  const entry = await getBootcamp(slug);
  if (!entry) notFound();

  const { bootcamp, course, cohort, availability, joinable } = entry;
  const seatsLeft = displaySeatsLeft(availability);
  const region = await getRegion();
  const price = BOOTCAMP_PRICING[region];

  // The class hour, rendered in the COHORT's zone. The buyer's own zone is
  // resolved on the apply page, where the browser can tell us what it is —
  // guessing it here from an IP would be confidently wrong for anyone travelling.
  const slot = cohort
    ? localSessionTime(
        firstClassInstant(cohort.starts_on, cohort.timezone),
        cohort.timezone,
        cohort.timezone,
      )
    : null;

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <nav className="max-w-5xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
        <Link href="/bootcamp" className="text-sm font-medium text-ink-secondary hover:text-brand">
          All bootcamps
        </Link>
      </nav>

      <header className="max-w-5xl mx-auto px-6 sm:px-8 pt-6 pb-10">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
          {joinable ? "Applications open" : "Next intake"}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
          {bootcamp.title}
        </h1>
        <p className="mt-4 text-lg text-ink-secondary max-w-2xl leading-relaxed">
          {bootcamp.tagline}
        </p>

        {cohort && (
          <div className="mt-8 bg-surface border border-border rounded-[12px] p-6 shadow-sm max-w-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Starts</p>
                <p className="mt-1 font-semibold text-sm">{formatCohortDate(cohort.starts_on)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Ends</p>
                <p className="mt-1 font-semibold text-sm">{formatCohortDate(cohort.ends_on)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Seats left</p>
                <p className="mt-1 font-semibold text-sm">
                  {seatsLeft} <span className="text-ink-muted font-normal">of {cohort.seats}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Commitment</p>
                <p className="mt-1 font-semibold text-sm">{bootcamp.hours_per_week} h/week</p>
              </div>
            </div>

            {slot && (
              <p className="mt-5 pt-4 border-t border-border text-sm text-ink-secondary">
                Live classes are <strong className="text-ink">{slot.sentence}</strong> in{" "}
                {cohort.timezone}. You will see this in your own timezone — and have to
                confirm it — before you pay.
              </p>
            )}
          </div>
        )}
      </header>

      <section className="max-w-5xl mx-auto px-6 sm:px-8 pb-12">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">
          What you actually get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["A weekly 30-minute 1-1 with your instructor",
             "Every week, for 24 weeks. Not office hours you have to fight for — a slot that is yours."],
            ["Six gates you cannot skip",
             "Each one is a real project, reviewed by a human, at a higher bar than the self-paced track."],
            ["Graded against a withheld answer key",
             "Your output is checked against ground truth you never see, and contract tests that run in CI. Not a rubric opinion."],
            ["A recorded defence of your own code",
             "Twenty minutes explaining what you built and why. It is attached to your credential, so an employer can watch it."],
            [`${course.total_lessons ?? "—"} lessons and ${course.total_projects ?? "—"} projects`,
             `The full ${course.title} curriculum, paced across 24 weeks instead of left to your own discipline.`],
            ["An AI tutor that has read everything you submitted",
             "Nova remembers your graded work, so help at 2am is about your actual code — not a generic answer."],
          ].map(([title, body]) => (
            <div key={title} className="bg-surface border border-border rounded-[12px] p-5 shadow-sm">
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 sm:px-8 pb-20">
        <div className="bg-surface border border-brand rounded-[12px] p-6 sm:p-8 shadow-sm max-w-2xl">
          {joinable && cohort ? (
            <>
              <p className="text-[11px] font-semibold text-brand uppercase tracking-widest">
                Founding cohort
              </p>
              <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-bold">{formatUsd(price.plans.full)}</span>
                <span className="text-ink-muted line-through text-lg">{formatUsd(price.list)}</span>
                <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-success-bg text-success">
                  paid in full — save 10%
                </span>
              </div>
              <p className="mt-3 text-sm text-ink-secondary">
                Or {formatUsd(price.plans.threePart[0])} deposit, then two payments of{" "}
                {formatUsd(price.plans.threePart[1])} — {formatUsd(threePartTotal(region))} in total,
                fully paid by week 8.
              </p>
              <Link
                href={`/bootcamp/${slug}/apply`}
                className="mt-6 inline-flex items-center justify-center rounded-[8px] bg-brand text-white font-semibold text-sm px-6 py-3 hover:opacity-90 transition"
              >
                Apply — {seatsLeft} of {cohort.seats} seats left
              </Link>
              <p className="mt-3 text-xs text-ink-muted">
                Applying is free and takes about ten minutes. There is a short assessment —
                if you are not ready yet, we will tell you before you pay anything.
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                {availability.state === "full" ? "Sold out" : "Not open yet"}
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                {availability.state === "full"
                  ? "This cohort is full"
                  : availability.state === "not_open_yet"
                    ? `Applications open ${formatCohortDate(availability.opensOn)}`
                    : availability.state === "closed"
                      ? "Applications have closed for this cohort"
                      : "No cohort scheduled yet"}
              </h3>
              <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                {availability.state === "not_open_yet" ? (
                  <>
                    {cohort ? `${availability.seatsLeft} of ${cohort.seats} seats are still open.` : null}{" "}
                    Join the list and you will get the application link the day it opens — before
                    it goes public.
                  </>
                ) : availability.state === "full" ? (
                  <>
                    Every seat is taken. Cohorts are capped at {cohort?.seats} because each one needs
                    a full-time instructor, so we cannot add more. Join the list for the next intake.
                  </>
                ) : (
                  <>
                    Every cohort needs a full-time instructor, and we only open a track when we can
                    staff it properly. Join the list and you will hear the moment a date is set —
                    before it goes public.
                  </>
                )}
              </p>
              <Link
                href={`/bootcamp/${slug}/apply?waitlist=1`}
                className="mt-6 inline-flex items-center justify-center rounded-[8px] border border-border font-semibold text-sm px-6 py-3 hover:border-brand hover:text-brand transition"
              >
                {availability.state === "not_open_yet" ? "Notify me when it opens" : "Join the waitlist"}
              </Link>
            </>
          )}
        </div>

        <p className="mt-8 text-sm text-ink-secondary max-w-2xl leading-relaxed">
          Prefer to go at your own pace?{" "}
          <Link href={`/courses/${course.slug}`} className="text-brand font-medium hover:underline">
            The same curriculum is available self-paced
          </Link>{" "}
          — no cohort, no deadlines, no 1-1, and a lot cheaper.
        </p>
      </section>
    </main>
  );
}
