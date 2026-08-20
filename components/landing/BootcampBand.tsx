import Link from "next/link";
import { CalendarRange, Users, ShieldCheck } from "lucide-react";
import { BOOTCAMP_ENABLED } from "@/lib/flags";
import { BOOTCAMP_PRICING, formatUsd, type PriceRegion } from "@/lib/bootcamp/pricing";

// ═══════════════════════════════════════════════════════════════════════════════
// The two-product fork on the landing page.
//
// FRAMING DECISION: a band BELOW the hero, not a replacement for it.
//
// The hero currently converts the self-paced product and is the highest-traffic
// surface we own. The Bootcamp needs 100 buyers across two cohorts — not mass
// traffic — so betting the main funnel on an unproven product to reach a capped
// audience is the wrong trade. A band captures the people who already want
// structure, without putting the working funnel at risk. It is also reversible:
// if it converts, promote it into the hero later with evidence.
//
// Renders NOTHING while BOOTCAMP_ENABLED is false, so the live landing page is
// byte-identical until the flag flips.
// ═══════════════════════════════════════════════════════════════════════════════

export function BootcampBand({ region }: { region: PriceRegion }) {
  if (!BOOTCAMP_ENABLED) return null;

  const price = BOOTCAMP_PRICING[region];

  return (
    <section className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400">
              Or learn with a cohort
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Some people need a deadline and a person.
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed max-w-xl">
              Everything above is self-paced — you go at your speed, and most people
              genuinely prefer that. But if you have started a course before and not
              finished it, the missing piece was probably not more content.
            </p>
            <p className="mt-3 text-slate-300 leading-relaxed max-w-xl">
              The Bootcamp is six months, live, with a{" "}
              <strong className="text-white">weekly 30-minute 1-1 with your instructor</strong>,
              six projects you cannot skip, and a recorded defence of your own code that an
              employer can watch.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/bootcamp"
                className="inline-flex items-center rounded-[8px] bg-white text-slate-900 font-semibold text-sm px-6 py-3 hover:bg-slate-100 transition"
              >
                See the bootcamps
              </Link>
              <span className="text-sm text-slate-400">
                From {formatUsd(price.plans.full)} · 50 seats a cohort
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {[
              [CalendarRange, "A weekly 1-1", "Thirty minutes that are yours, every week for 24 weeks."],
              [Users, "50 seats, capped", "Each cohort needs a full-time instructor, so we cannot add more."],
              [ShieldCheck, "Graded against a withheld key", "Ground truth you never see, plus contract tests in CI. Not an opinion."],
            ].map(([Icon, term, detail]) => {
              const I = Icon as typeof CalendarRange;
              return (
                <div key={term as string} className="rounded-[12px] bg-white/5 border border-white/10 p-4">
                  <I className="h-4 w-4 text-sky-400" aria-hidden />
                  <dt className="mt-2 font-semibold text-sm">{term as string}</dt>
                  <dd className="mt-1 text-xs text-slate-400 leading-relaxed">{detail as string}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
