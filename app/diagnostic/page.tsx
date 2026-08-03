"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowRight, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { DIAG_SUBJECTS as SUBJECTS } from "@/lib/diagnostic";
import { GOAL_KEY } from "@/components/RoutingQuestion";
import { CourseIcon } from "@/components/ui/course-icon";
import { WORK_LANE_SLUGS } from "@/lib/work-lanes";

/* What the report actually contains. Every line here maps to a real tile on
   /diagnostic/[subject]/results — the neural map, the per-topic bars, the
   strengths donut, role readiness, and the course path. Nothing aspirational:
   the entry page was asking for five answers while showing none of the payoff,
   which is the reason it read as a catalogue rather than an offer. */
const PAYOFF = [
  "A topic-by-topic breakdown of what you know",
  "Your strengths, and the gaps worth closing first",
  "How ready you are for the role, not just a score",
  "What to learn next, taken from the real curriculum",
];

export default function DiagnosticPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Which lane leads the page: ?goal=work (or a stashed work goal) puts the
  // no-code role tracks first, so the "use AI at work" audience isn't scanning
  // past ten engineering cards to find theirs.
  const [workFirst, setWorkFirst] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // The landing fork's "use AI at my job" door arrives as ?goal=work — stash it
    // so the post-signup routing question can pre-answer "work" (see RoutingQuestion).
    if (params.get("goal") === "work") {
      setWorkFirst(true);
      try {
        localStorage.setItem(GOAL_KEY, "work");
      } catch {
        /* storage blocked — non-critical */
      }
    } else {
      try {
        if (localStorage.getItem(GOAL_KEY) === "work") setWorkFirst(true);
      } catch { /* ignore */ }
    }
    const slug = params.get("subject");
    if (!slug) return;
    const match = SUBJECTS.find((s) => s.slug === slug);
    if (match) router.replace(`/diagnostic/${match.slug}?start=1`);
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUBJECTS;
    return SUBJECTS.filter((s) => s.title.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
  }, [query]);

  // The two lanes, in the visitor's order (work-goal visitors see role tracks first).
  const lanes = useMemo(() => {
    const work = filtered.filter((s) => WORK_LANE_SLUGS.has(s.slug));
    const career = filtered.filter((s) => !WORK_LANE_SLUGS.has(s.slug));
    const workLane = {
      key: "work",
      title: "AI for your work",
      sub: "No code. Role tracks for the job you already have.",
      accent: "#3388FF",
      items: work,
    };
    const careerLane = {
      key: "career",
      title: "Career tracks",
      sub: "Engineering and data roles, graded on projects.",
      accent: "#0056CE",
      items: career,
    };
    return workFirst ? [workLane, careerLane] : [careerLane, workLane];
  }, [filtered, workFirst]);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex items-center justify-between px-5 py-5 sm:px-10">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <main className="flex-1 pb-20">
        {/* ── Hero ──────────────────────────────────────────────────────────
            Two columns: the offer on the left, a preview of the report on the
            right. The preview is the whole point — it turns "answer five
            questions" into "answer five questions and get this". */}
        <section className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-[#DCEBFB] bg-gradient-to-br from-[#F4F9FF] via-white to-[#EEF6FF] px-5 py-7 sm:px-10 sm:py-12">
            <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0056CE]/[0.07] blur-3xl" />
            <span aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#3388FF]/[0.06] blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              {/* Offer */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE4FF] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0056CE] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Free · 3 minutes · No signup
                </span>

                {/* Sized so each line holds at every breakpoint. At 34px on a
                    390px screen "stand" and "next." were stranded on lines of
                    their own, which reads as a layout bug. */}
                <h1 className="mt-4 text-[27px] font-extrabold leading-[1.08] tracking-[-0.025em] text-slate-900 sm:mt-5 sm:text-[40px] lg:text-[46px] lg:leading-[1.05]">
                  See where you stand
                  <span className="block text-[#0056CE]">and what to learn next.</span>
                </h1>

                <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
                  Five questions on the track you&apos;re aiming for. You get a real skill
                  breakdown the moment you finish — no account, no email, no waiting.
                </p>

                <ul className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2">
                  {PAYOFF.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-slate-700">
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0056CE]/10">
                        <Check className="h-2.5 w-2.5 text-[#0056CE]" strokeWidth={3.5} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>

                <a
                  href="#tracks"
                  className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#0056CE] px-6 text-[15px] font-bold text-white shadow-[0_10px_22px_-10px_rgba(0,86,206,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[#0049AE] hover:shadow-[0_14px_28px_-10px_rgba(0,86,206,0.85)]"
                >
                  Pick your track
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Report preview — schematic on purpose. The bars carry no
                  numbers because there is no result yet; this shows the shape
                  of the report, and the caption says so. */}
              <ReportPreview />
            </div>
          </div>
        </section>

        {/* ── Tracks ────────────────────────────────────────────────────── */}
        <section id="tracks" className="mx-auto mt-14 max-w-6xl scroll-mt-6 px-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-slate-900 sm:text-[26px]">
                Which track are you aiming for?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick one to start. Each check is five questions, about three minutes.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="track-search" className="sr-only">Search tracks</label>
              <input
                id="track-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tracks"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0056CE] focus:ring-4 focus:ring-[#0056CE]/12 sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-7 space-y-10">
              {/* Cards link with ?start=1: internal traffic skips the subject
                  landing page and goes straight into question 1. */}
              {lanes.map((lane) =>
                lane.items.length === 0 ? null : (
                  <div key={lane.key}>
                    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="flex items-center gap-2.5 text-[17px] font-extrabold tracking-tight text-slate-900">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: lane.accent }} aria-hidden />
                        {lane.title}
                      </h3>
                      <span className="text-[13px] font-medium text-slate-400">{lane.sub}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {lane.items.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/diagnostic/${s.slug}?start=1`}
                          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_18px_34px_-16px_rgba(21,47,84,0.28)] sm:p-4"
                        >
                          {/* Colour wash on hover, per subject — keeps the grid
                              calm at rest but makes the target obvious. */}
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            style={{ background: `linear-gradient(160deg, ${s.color}0f, transparent 62%)` }}
                          />
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                            style={{ background: s.color }}
                          />

                          <span
                            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                            style={{ background: `${s.color}14`, border: `1px solid ${s.color}2b` }}
                          >
                            <CourseIcon slug={s.slug} size={21} color={s.color} />
                          </span>

                          <h4 className="relative mt-3 text-[14px] font-bold leading-snug tracking-[-0.01em] text-slate-900 sm:text-[15px]">
                            {s.title}
                          </h4>
                          <p className="relative mt-0.5 text-[12px] font-semibold sm:text-[12.5px]" style={{ color: s.color }}>
                            {s.role}
                          </p>

                          <span className="relative mt-auto inline-flex items-center gap-1 pt-3.5 text-[13px] font-bold text-slate-400 transition-colors group-hover:text-slate-900">
                            Start
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <Search className="h-9 w-9 text-slate-300" />
              <p className="text-base font-bold text-slate-900">No tracks match “{query}”</p>
              <button onClick={() => setQuery("")} className="text-sm font-semibold text-[#0056CE] hover:underline">
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* ── Close ─────────────────────────────────────────────────────────
            The last objection is "what happens to my answers" — answer it
            rather than leaving the page to end on a wall of cards. */}
        <section className="mx-auto mt-14 max-w-6xl px-5 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-6 py-6 text-center sm:px-10">
            <p className="text-[15px] font-semibold text-slate-900">
              No account needed to see your result.
            </p>
            <p className="mx-auto mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
              Answer five questions and the snapshot appears straight away. You only
              make an account if you decide to start the course it points you to.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Report preview ──────────────────────────────────────────────────────────
   A deliberately schematic picture of the results page. It shows structure —
   a ring, per-topic rows, a readiness band — with no figures attached, because
   the visitor has no result yet and inventing one would be a lie. The caption
   states plainly that it is a layout preview. Entirely decorative to screen
   readers; the payoff list beside it carries the same information as text. */
function ReportPreview() {
  const rows = [
    { w: "86%", tone: "#16A34A" },
    { w: "72%", tone: "#16A34A" },
    { w: "54%", tone: "#F59E0B" },
    { w: "38%", tone: "#EF4444" },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="rotate-[1.2deg] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_28px_54px_-24px_rgba(21,47,84,0.34)] transition-transform duration-300 hover:rotate-0 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Your skill snapshot
          </div>
          <div className="h-1.5 w-12 rounded-full bg-slate-100" />
        </div>

        {/* Ring + readiness band */}
        <div className="mt-4 flex items-center gap-4">
          <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#EEF2F7" strokeWidth="9" />
            <circle
              cx="36" cy="36" r="30" fill="none" stroke="#0056CE" strokeWidth="9"
              strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset="66"
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-24 rounded-full bg-slate-200" />
            <div className="mt-2 h-2 w-32 rounded-full bg-slate-100" />
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#0056CE]/[0.08] px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0056CE]" />
              <span className="h-1.5 w-16 rounded-full bg-[#0056CE]/30" />
            </div>
          </div>
        </div>

        {/* Per-topic rows */}
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-20 shrink-0 rounded-full bg-slate-100" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: r.w, background: r.tone }} />
              </div>
            </div>
          ))}
        </div>

        {/* Next-step strip */}
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0056CE]/10">
            <ArrowRight className="h-3 w-3 text-[#0056CE]" />
          </span>
          <div className="h-2 w-28 rounded-full bg-slate-200" />
        </div>
      </div>

      <p className="mt-3 text-center text-[11.5px] font-medium text-slate-400">
        Layout preview — your snapshot is built from your own answers.
      </p>
    </div>
  );
}
