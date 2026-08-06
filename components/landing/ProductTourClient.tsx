"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Sparkles, FolderGit2, Trophy,
  ArrowRight, Lock, X, type LucideIcon,
} from "lucide-react";

const BRAND = "#0056CE";

export type TourData = {
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
  totalProjects: number;
  modules: string[];
  lesson: { title: string; minutes: number; objectives: string[]; excerpt: string };
  project: { title: string; difficulty: string; hours: number; stack: string[]; brief: string; hasRepo: boolean };
  nova: { exerciseTitle: string; prompt: string; studentAnswer: string; score: number; maxMarks: number; feedback: string };
  levels: string[];
};

type StepKey = "dashboard" | "lesson" | "nova" | "projects" | "outcome";

const STEPS: { key: StepKey; label: string; icon: LucideIcon; blurb: string }[] = [
  { key: "dashboard", label: "Your dashboard", icon: LayoutDashboard, blurb: "One place that knows where you are." },
  { key: "lesson", label: "The lessons", icon: BookOpen, blurb: "Text and code. No videos to sit through." },
  { key: "nova", label: "Nova grades it", icon: Sparkles, blurb: "Every answer read and marked, with the gap named." },
  { key: "projects", label: "What you build", icon: FolderGit2, blurb: "Real briefs, real repos, deployed." },
  { key: "outcome", label: "What you leave with", icon: Trophy, blurb: "Proof an employer can open." },
];

/* ── Chrome shared by every panel: a small faux app window ─────────────────── */
function Frame({ title, flush = false, children }: { title: string; flush?: boolean; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white"
         style={{ boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.14)" }}>
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
        </span>
        {/* A URL bar reads as "a real screen" in a way three dots never do. */}
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1"
              style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}>
          <Lock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate text-[11px] font-medium text-slate-500">{title}</span>
        </span>
      </div>
      <div className={flush ? undefined : "p-5 sm:p-6"}>{children}</div>
    </div>
  );
}

/* ── A real captured screen inside the frame ───────────────────────────────────
   These are actual screenshots of the product (a demo student account on the
   live curriculum), not mockups — the honesty rule that governs the rest of the
   landing page. Captions say what the viewer is looking at. */
function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="m-0">
      <Image
        src={src}
        alt={alt}
        width={3200}
        height={2000}
        quality={85}
        sizes="(max-width: 1100px) 100vw, 1040px"
        className="block h-auto w-full"
      />
      <figcaption className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 sm:px-5">
        {caption}
      </figcaption>
    </figure>
  );
}

// How long each screen holds before the walkthrough moves on, and how long the
// cursor takes to travel. The cursor arrives BEFORE the panel switches, so it
// reads as "something clicked that, and then the screen changed".
const DWELL_MS = 5200;
const TRAVEL_MS = 650;

export function ProductTourClient({ data }: { data: TourData }) {
  const [step, setStep] = useState<StepKey>("dashboard");
  const active = STEPS.find((s) => s.key === step)!;

  // ── Autoplay walkthrough ──────────────────────────────────────────────────
  // A simulated cursor drives the tabs so the section plays like a screen
  // recording, without shipping a video: no megabytes against LCP, stays sharp
  // at any width, and the panel content remains real DOM that crawlers read.
  //
  // It stops for good the moment someone clicks a tab — once a visitor is
  // driving, having the page yank the screen out from under them is worse than
  // no animation at all. It also idles while scrolled out of view, and never
  // starts for anyone who asked for reduced motion.
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clicking, setClicking] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const takenOver = useRef(false);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Only play while the section is actually on screen.
  useEffect(() => {
    if (reducedMotion) return;
    const el = tabsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (!takenOver.current) setPlaying(entry.isIntersecting); },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion]);

  const stopAutoplay = useCallback(() => {
    takenOver.current = true;
    setPlaying(false);
    setCursor(null);
  }, []);

  // ── Email gate on the section CTAs ──────────────────────────────────────────
  // Same opt-in contract as the pre-test gate (product decision, 2026-08-06):
  // the free lesson and the full curriculum are both behind an email. Shares
  // the s1-diag-optin flag, so anyone who has answered it once — here or
  // before the skill check — passes straight through, and answering it here
  // means the skill check never asks again either. Fails OPEN: a failed save
  // still navigates, because a lost address is cheaper than a lost visitor.
  const router = useRouter();
  const [gateHref, setGateHref] = useState<string | null>(null);
  const [gateEmail, setGateEmail] = useState("");
  const [gateSaving, setGateSaving] = useState(false);

  function gateClick(e: React.MouseEvent, href: string) {
    let done = false;
    try { done = localStorage.getItem("s1-diag-optin") === "done"; } catch { /* private mode — ask */ }
    if (done) return; // normal <Link> navigation
    e.preventDefault();
    stopAutoplay();
    setGateHref(href);
  }

  async function gateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gateHref || gateEmail.trim().length < 4 || gateSaving) return;
    setGateSaving(true);
    try {
      await fetch("/api/diagnostic/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: gateEmail.trim(), subject: data.courseSlug }),
      });
    } catch { /* fail open */ }
    try { localStorage.setItem("s1-diag-optin", "done"); } catch { /* ignore */ }
    router.push(gateHref);
  }

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const idx = STEPS.findIndex((s) => s.key === step);
    const next = STEPS[(idx + 1) % STEPS.length];

    // Park the cursor on the current tab, then send it to the next one.
    const settle = window.setTimeout(() => {
      const el = btnRefs.current[step];
      const box = tabsRef.current?.getBoundingClientRect();
      if (el && box) {
        const r = el.getBoundingClientRect();
        setCursor({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
      }
    }, 120);

    const travel = window.setTimeout(() => {
      const el = btnRefs.current[next.key];
      const box = tabsRef.current?.getBoundingClientRect();
      if (el && box) {
        const r = el.getBoundingClientRect();
        setCursor({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
      }
    }, DWELL_MS - TRAVEL_MS);

    const press = window.setTimeout(() => setClicking(true), DWELL_MS - 90);
    const advance = window.setTimeout(() => {
      setClicking(false);
      setStep(next.key);
    }, DWELL_MS);

    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(travel);
      window.clearTimeout(press);
      window.clearTimeout(advance);
    };
  }, [playing, step, reducedMotion]);

  return (
    <section className="px-4 py-16 sm:px-6" aria-labelledby="tour-heading">
      {/* The stage. A dark surface exists for one reason: the product screens
          are light, so putting them on dark makes them read as a lit screen
          rather than another white card in a white page. Everything inside is
          styled for dark; the app frame stays light and pops out of it. */}
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-4 py-12 sm:px-8 sm:py-14"
           style={{ background: "linear-gradient(160deg,#0B1B36 0%,#01224F 55%,#061530 100%)" }}>
        {/* Ambient glow. Pure decoration, no layout cost, no animation. */}
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle,#3388FF,transparent 70%)" }} />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle,#0EA5E9,transparent 70%)" }} />

        <div className="relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#8FC4FF" }}>
            <span aria-hidden className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#3388FF" }} />
            </span>
            See how it works
          </span>
          <h2 id="tour-heading" className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.1]">
            The whole thing, before you sign up
          </h2>
          <p className="mx-auto mt-3.5 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            Five screens of the actual product, captured from the {data.courseTitle} track —
            the same lessons, projects and marking you get on day one.
          </p>
        </div>

        {/* ── Step rail ──────────────────────────────────────────────────────
            Numbered and joined by a line, so it reads as one journey rather
            than five unrelated tabs. The number is the draw: it tells you how
            far through you are without having to count the boxes. */}
        <div ref={tabsRef} className="relative mt-10">
          <span aria-hidden className="absolute left-0 right-0 top-[26px] hidden h-px sm:block"
                style={{ background: "rgba(255,255,255,0.12)" }} />
          {/* Horizontal strip on mobile, grid on desktop. Stacked, five steps
              pushed the actual product screen a third of a viewport down the
              page — the screen is the point, so it should be reachable without
              scrolling past the menu for it. */}
          <div role="tablist" aria-label="Product tour"
               className="relative -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0">
            {STEPS.map((s, i) => {
              const on = s.key === step;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  ref={(el) => { btnRefs.current[s.key] = el; }}
                  role="tab"
                  aria-selected={on}
                  aria-controls={`tour-panel-${s.key}`}
                  onClick={() => { stopAutoplay(); setStep(s.key); }}
                  className="tour-step group relative flex w-[10.5rem] shrink-0 snap-start items-center gap-2.5 overflow-hidden rounded-2xl border px-3.5 py-3 text-left sm:w-auto sm:shrink sm:flex-col sm:items-start sm:gap-2"
                  style={{
                    borderColor: on ? "#3388FF" : "rgba(255,255,255,0.13)",
                    background: on ? "rgba(51,136,255,0.16)" : "rgba(255,255,255,0.05)",
                    boxShadow: on ? "0 8px 26px -12px rgba(51,136,255,0.9)" : "none",
                  }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors"
                        style={on
                          ? { background: "#3388FF", color: "#fff" }
                          : { background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)" }}>
                    {i + 1}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: on ? "#8FC4FF" : "rgba(255,255,255,0.45)" }} aria-hidden />
                    <span className="text-sm font-bold" style={{ color: on ? "#fff" : "rgba(255,255,255,0.72)" }}>
                      {s.label}
                    </span>
                  </span>
                  {/* Time remaining on this screen — the "it's playing" cue. */}
                  {on && playing && !reducedMotion && (
                    <span key={`${s.key}-bar`} aria-hidden
                          className="tour-progress absolute bottom-0 left-0 h-[3px]"
                          style={{ background: "linear-gradient(90deg,#3388FF,#8FC4FF)" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Simulated pointer. Decorative and inert — real focus and clicks are
              unaffected, and it never intercepts a pointer event. */}
          {cursor && playing && !reducedMotion && (
            <span
              aria-hidden
              className="pointer-events-none absolute z-10 hidden sm:block"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: `translate(-4px,-2px) scale(${clicking ? 0.82 : 1})`,
                transition: `left ${TRAVEL_MS}ms cubic-bezier(.4,.1,.2,1), top ${TRAVEL_MS}ms cubic-bezier(.4,.1,.2,1), transform 90ms ease`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.3))" }}>
                <path d="M5 2l14 8.5-6.2 1.3L9.7 19 5 2z" fill="#0F172A" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              {clicking && (
                <span
                  className="absolute -left-2.5 -top-2.5 h-8 w-8 rounded-full"
                  style={{ border: `2px solid ${BRAND}`, animation: "tourPing .35s ease-out" }}
                />
              )}
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>{active.blurb}</p>
          {/* Play/pause. Makes the section feel like something you can operate
              rather than something happening at you — and gives anyone who
              wants to read a panel properly a way to stop the clock. */}
          {!reducedMotion && (
            <button
              onClick={() => {
                if (playing) { stopAutoplay(); }
                else { takenOver.current = false; setPlaying(true); }
              }}
              className="inline-flex h-8 shrink-0 items-center gap-2 self-start rounded-full border px-3.5 text-xs font-bold transition-colors sm:self-auto"
              style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" }}
            >
              <span aria-hidden>{playing ? "❙❙" : "▶"}</span>
              {playing ? "Pause tour" : "Play tour"}
            </button>
          )}
        </div>

        {/* ── Panels ─────────────────────────────────────────────────────────
            Four of the five are now REAL captured screenshots of the product
            (2026-08: a demo student account on the live curriculum) — the DOM
            replicas they replaced read as mockups, which undercut the whole
            point of the section. The crawler-readable text lives on in the
            descriptive alt texts and captions. All five stay mounted with the
            inactive ones `hidden`, so switching tabs costs no re-render and the
            alt/caption text is in the server HTML. */}
        <div className="relative mt-4">
          {/* Glow behind the frame, so the screen looks lit rather than pasted on. */}
          <span aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-60 blur-2xl"
                style={{ background: "radial-gradient(60% 60% at 50% 0%,rgba(51,136,255,0.35),transparent 70%)" }} />
          {STEPS.map((s) => (
            <div key={s.key} id={`tour-panel-${s.key}`} role="tabpanel" hidden={s.key !== step} className="relative">
              {/* Keyed so the entrance animation replays on every switch — the
                  screen changing is what sells it as a walkthrough. */}
              <div key={s.key === step ? `in-${step}` : "idle"} className={s.key === step ? "tour-panel-in" : undefined}>
                {s.key === "dashboard" && <DashboardPanel />}
                {s.key === "lesson" && <LessonPanel />}
                {s.key === "nova" && <NovaPanel />}
                {s.key === "projects" && <ProjectsPanel />}
                {s.key === "outcome" && <OutcomePanel data={data} />}
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/try/${data.courseSlug}`}
            onClick={(e) => gateClick(e, `/try/${data.courseSlug}`)}
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{ color: "#01224F", boxShadow: "0 10px 30px -10px rgba(255,255,255,0.45)" }}
          >
            Read the first lesson free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={`/courses/${data.courseSlug}`}
            onClick={(e) => gateClick(e, `/courses/${data.courseSlug}`)}
            className="inline-flex h-12 items-center rounded-xl border px-7 text-sm font-semibold transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.9)" }}
          >
            See the full curriculum
          </Link>
        </div>
      </div>

      {/* Email gate — one small honest ask, then straight through. Closing it
          just stays on the page; there is no skip (same contract as the
          pre-test gate). */}
      {gateHref && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#00183A]/70 px-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-label="Leave your email to continue"
          onClick={() => setGateHref(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl motion-safe:animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black tracking-tight text-slate-900">One thing before you dive in</h3>
              <button type="button" onClick={() => setGateHref(null)} aria-label="Close"
                className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Leave an email so we can keep your place in {data.courseTitle} and follow up with
              your next step. No account, no password — just an address.
            </p>
            <form onSubmit={gateSubmit} className="mt-4 space-y-3">
              <input
                type="email" value={gateEmail} onChange={(e) => setGateEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" autoFocus aria-label="Email"
                className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-base outline-none transition-colors focus:border-[#0056CE] sm:text-sm"
              />
              <button
                type="submit" disabled={gateEmail.trim().length < 4 || gateSaving}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold text-white transition-transform enabled:hover:-translate-y-px disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}
              >
                {gateSaving ? "One sec…" : "Continue"}
                {!gateSaving && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              We email your next step and occasional course updates. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── 1. Dashboard ─────────────────────────────────────────────────────────── */
function DashboardPanel() {
  return (
    <Frame title="square1ai.com/dashboard" flush>
      <Shot
        src="/product/dashboard.png"
        alt="The Square 1 student dashboard: a Continue Learning hero for the Data Science track showing the Pandas DataFrames lesson and 49% course completion, stat cards for 33 lessons done and a 20-day streak, a 7-of-7 active days week strip, a 13-week activity heatmap, and quick actions for the next lesson, next project and Nova."
        caption="The real dashboard — a demo student account, three modules into the Data Science track."
      />
    </Frame>
  );
}

/* ── 2. Lesson ────────────────────────────────────────────────────────────── */
function LessonPanel() {
  return (
    <Frame title="square1ai.com/learn · Pandas DataFrames" flush>
      <Shot
        src="/product/lesson.png"
        alt="The Square 1 lesson player showing the Pandas DataFrames lesson: a section header, an 'In short' takeaway strip summarising the section, then Why This Matters and Core Concepts prose with inline code, with lesson progress and Nova in the header."
        caption="The real lesson player — no videos to sit through; read, then prove it, with Nova one tap away."
      />
    </Frame>
  );
}

/* ── 3. Nova ──────────────────────────────────────────────────────────────── */
function NovaPanel() {
  return (
    <Frame title="square1ai.com/learn · graded by Nova" flush>
      <Shot
        src="/product/nova.png"
        alt="A graded exercise in the Square 1 lesson player: the prompt asks the student to explain the difference between df.loc and df.iloc in Pandas, the student's written answer sits in a text box, and below it Nova's marking shows Correct 3/3 with feedback explaining what the answer demonstrated."
        caption="A real answer, really graded — this score and feedback came from the live marking model, not copywriting."
      />
    </Frame>
  );
}

/* ── 4. Projects ──────────────────────────────────────────────────────────── */
function ProjectsPanel() {
  return (
    <Frame title="square1ai.com/projects/automated-eda-profiler" flush>
      <Shot
        src="/product/project.png"
        alt="A Square 1 project brief: Automated EDA Profiler, a beginner Data Science project estimated at 8 hours with difficulty, deliverables and Nova-review scoring cards, a narrative client scenario at Meridian Market, and a Getting Started panel with a GitHub starter template button and clone command."
        caption="A real project brief from the track — starter repo and dataset included, marked by Nova against a rubric."
      />
    </Frame>
  );
}

/* ── 5. Outcome ───────────────────────────────────────────────────────────── */
function OutcomePanel({ data }: { data: TourData }) {
  return (
    <Frame title="square1ai.com/progress">
      <p className="text-sm leading-relaxed text-slate-700">
        Finish the track and the work itself is the proof. Every project is marked against a
        published rubric, and the result is a report an employer can check rather than a
        certificate that only says you attended.
      </p>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Levels you move through</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.levels.map((l, i) => (
            <span
              key={l}
              className="rounded-lg px-2.5 py-1 text-xs font-bold"
              style={
                i <= 1
                  ? { background: BRAND, color: "#fff" }
                  : { background: "#F1F5F9", color: "#64748B" }
              }
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {[
          { t: `${data.totalProjects} projects`, d: "Deployed, with live URLs and a public repo." },
          { t: "A skill report", d: "Strengths and gaps per topic, from marked work." },
          { t: "A portfolio page", d: "One link an employer can open and run." },
        ].map((x) => (
          <li key={x.t} className="rounded-lg border border-slate-200 p-3.5">
            <p className="text-sm font-bold text-slate-900">{x.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{x.d}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
