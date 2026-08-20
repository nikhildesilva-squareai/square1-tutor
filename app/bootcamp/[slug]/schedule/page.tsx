import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { getBootcamp, getGates, formatCohortDate } from "@/lib/bootcamp/catalog";
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
    title: `${entry.bootcamp.title} — the 24-week schedule`,
    description:
      "Every week, every gate, and exactly what you have to pass. Published before you apply, not after.",
    alternates: { canonical: `${BASE}/bootcamp/${slug}/schedule` },
  };
}

export const dynamic = "force-dynamic";

/** The six blocks of the 24-week spine. `endWeek` matches the gate week, so the
 *  block a student is in is always the one leading to their next gate. */
const BLOCKS = [
  { start: 1,  end: 5,  name: "Foundations",      what: "Module 0 on-ramp, then the core of the curriculum. You build alone." },
  { start: 6,  end: 10, name: "Core craft",       what: "Harder builds, and you start reviewing other people's pull requests." },
  { start: 11, end: 14, name: "Squad build",      what: "Four people, one repo, rotating roles. PR-only — no pushing to main." },
  { start: 15, end: 18, name: "Employer brief",   what: "A real problem from a hiring partner. They see the results." },
  { start: 19, end: 22, name: "Capstone",         what: "Your own project, then a recorded viva defending the code you wrote." },
  { start: 23, end: 24, name: "Hiring sprint",    what: "Not curriculum. CV, portfolio, applications, mock interviews, demo day." },
];

export default async function SchedulePage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getBootcamp(slug);
  if (!entry) notFound();

  const { bootcamp, course, cohort } = entry;
  const gates = await getGates(bootcamp.id);
  const gateByWeek = new Map(gates.map((g) => [g.week, g]));

  const slot = cohort
    ? localSessionTime(
        firstClassInstant(cohort.starts_on, cohort.timezone),
        cohort.timezone,
        cohort.timezone,
      )
    : null;

  return (
    <main className="min-h-screen bg-surface-soft text-ink">
      <nav className="max-w-4xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0"><Logo variant="dark" size="sm" /></Link>
        <Link href={`/bootcamp/${slug}`} className="text-sm font-medium text-ink-secondary hover:text-brand">
          ← {bootcamp.title}
        </Link>
      </nav>

      <header className="max-w-4xl mx-auto px-6 sm:px-8 pt-6 pb-8">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">
          The whole thing, before you apply
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {bootcamp.weeks} weeks, {gates.length} gates
        </h1>
        <p className="mt-4 text-ink-secondary max-w-2xl leading-relaxed">
          Published up front because you should be able to judge whether you can commit
          before you pay, not after. {course.total_lessons ?? "—"} lessons and{" "}
          {course.total_projects ?? "—"} projects, paced across {bootcamp.weeks} weeks at about{" "}
          {bootcamp.hours_per_week} hours a week.
          {cohort && slot && (
            <> Live classes are <strong className="text-ink">{slot.sentence}</strong> in {cohort.timezone}.</>
          )}
        </p>
        {cohort && (
          <p className="mt-3 text-sm text-ink-muted">
            Cohort 1: {formatCohortDate(cohort.starts_on)} → {formatCohortDate(cohort.ends_on)}
          </p>
        )}
      </header>

      <section className="max-w-4xl mx-auto px-6 sm:px-8 pb-20">
        <ol className="relative border-l-2 border-border ml-3">
          {BLOCKS.map((block) => {
            const gate = gateByWeek.get(block.end);
            return (
              <li key={block.name} className="ml-6 pb-8 last:pb-0">
                <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full bg-brand ring-4 ring-surface-soft" />
                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                  Weeks {block.start}–{block.end}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{block.name}</h2>
                <p className="mt-1 text-sm text-ink-secondary leading-relaxed max-w-2xl">
                  {block.what}
                </p>

                {gate && (
                  <div className="mt-3 rounded-[12px] border border-brand bg-surface p-4 max-w-2xl shadow-sm">
                    <p className="text-[11px] font-semibold text-brand uppercase tracking-widest">
                      Gate {gate.order_index} · week {gate.week}
                    </p>
                    <p className="mt-1 font-semibold text-sm">{gate.title}</p>
                    <p className="mt-1 text-sm text-ink-secondary leading-relaxed">
                      {gate.summary_md}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 rounded-[12px] border border-border bg-surface p-6 shadow-sm max-w-2xl">
          <h2 className="font-semibold">What &ldquo;you cannot skip&rdquo; actually means</h2>
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
            The next block does not open until the gate before it is passed. Failing one is not
            the end — you get a written reason, a remediation path and a second attempt inside a
            seven-day window. Fail twice and you defer to the next cohort at no extra cost, which
            is a far better outcome than being carried to a certificate that means nothing.
          </p>
          <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
            The pass bar and the exact thresholds are not published — a bar you can read is a bar
            you can do the minimum against. What is published is everything above: the shape, the
            weeks, and what each gate asks of you.
          </p>
        </div>

        <Link
          href={`/bootcamp/${slug}`}
          className="mt-8 inline-flex rounded-[8px] bg-brand text-white font-semibold text-sm px-6 py-3 hover:opacity-90 transition"
        >
          Back to {bootcamp.title}
        </Link>
      </section>
    </main>
  );
}
