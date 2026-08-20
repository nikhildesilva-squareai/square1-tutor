import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { listBootcamps, formatCohortDate } from "@/lib/bootcamp/catalog";
import { displaySeatsLeft } from "@/lib/bootcamp/availability";
import { BOOTCAMP_PRICING, formatUsd } from "@/lib/bootcamp/pricing";

const BASE = "https://www.square1ai.com";

// The one Square 1 headline gradient, same as the landing page and /newsroom.
const BRAND_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

// generateMetadata, not a static `metadata` export: a static one is resolved and
// FLUSHED before the component runs, so notFound() rendered a 404 body under an
// HTTP 200. An async resolver defers the flush so the status can still be set.
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

export default async function BootcampIndexPage() {
  if (!BOOTCAMP_ENABLED) notFound();

  const entries = await listBootcamps();
  const open = entries.filter((e) => e.joinable);
  const waitlist = entries.filter((e) => !e.joinable);

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <nav className="max-w-6xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
        <Link href="/" className="text-sm font-medium text-ink-secondary hover:text-brand">
          Learn at your own pace →
        </Link>
      </nav>

      <header className="max-w-6xl mx-auto px-6 sm:px-8 pt-8 sm:pt-12 pb-10">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
          Live cohorts
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl bg-clip-text text-transparent"
          style={{ backgroundImage: BRAND_GRADIENT }}
        >
          Six months. A weekly 1-1. A credential someone can actually check.
        </h1>
        <p className="mt-5 text-lg text-ink-secondary max-w-2xl leading-relaxed">
          Not a video course with a certificate at the end. Live classes, six projects you
          cannot skip, graded against withheld answer keys rather than opinions — and a
          recorded defence of your own code that an employer can watch.
        </p>

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
          {[
            ["24 weeks", "one intake at a time"],
            ["Weekly 30-min 1-1", "with your instructor"],
            ["6 gates", "you cannot skip one"],
            ["50 seats", "per cohort, capped"],
          ].map(([term, detail]) => (
            <div key={term} className="bg-surface border border-border rounded-[12px] p-4 shadow-sm">
              <dt className="font-semibold text-sm">{term}</dt>
              <dd className="text-xs text-ink-muted mt-1">{detail}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-16">
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
                    <span className="font-semibold text-brand">
                      from {formatUsd(BOOTCAMP_PRICING.south_asia.plans.full)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {waitlist.length > 0 && (
          <>
            <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
              Next intakes
            </h2>
            <p className="text-sm text-ink-secondary mb-4 max-w-2xl">
              Each cohort needs a full-time instructor, so we open tracks as we hire — and we
              only open one when we can staff it properly. Join a waitlist and you will hear
              before anyone else.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {waitlist.map((e) => (
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
                    Join the waitlist →
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
    </main>
  );
}
