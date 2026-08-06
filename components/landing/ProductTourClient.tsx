"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, Sparkles, FolderGit2, Trophy,
  Check, ArrowRight, GitBranch, Lock, type LucideIcon,
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
function Frame({ title, children }: { title: string; children: React.ReactNode }) {
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
      <div className="p-5 sm:p-6">{children}</div>
    </div>
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
            Five screens, using real content from the {data.courseTitle} track — the same
            lessons, projects and marking you get on day one.
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
            All five render and the inactive ones are `hidden`, rather than only
            mounting the active panel. Two reasons: switching tabs costs no
            re-render, and — the real one — the lesson text, Nova's marking and
            the project brief are then in the server HTML, where an answer engine
            can actually read them. Conditional mounting would leave the four
            unselected panels invisible to every crawler. */}
        <div className="relative mt-4">
          {/* Glow behind the frame, so the screen looks lit rather than pasted on. */}
          <span aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-60 blur-2xl"
                style={{ background: "radial-gradient(60% 60% at 50% 0%,rgba(51,136,255,0.35),transparent 70%)" }} />
          {STEPS.map((s) => (
            <div key={s.key} id={`tour-panel-${s.key}`} role="tabpanel" hidden={s.key !== step} className="relative">
              {/* Keyed so the entrance animation replays on every switch — the
                  screen changing is what sells it as a walkthrough. */}
              <div key={s.key === step ? `in-${step}` : "idle"} className={s.key === step ? "tour-panel-in" : undefined}>
                {s.key === "dashboard" && <DashboardPanel data={data} />}
                {s.key === "lesson" && <LessonPanel data={data} />}
                {s.key === "nova" && <NovaPanel data={data} />}
                {s.key === "projects" && <ProjectsPanel data={data} />}
                {s.key === "outcome" && <OutcomePanel data={data} />}
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/try/${data.courseSlug}`}
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{ color: "#01224F", boxShadow: "0 10px 30px -10px rgba(255,255,255,0.45)" }}
          >
            Read the first lesson free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={`/courses/${data.courseSlug}`}
            className="inline-flex h-12 items-center rounded-xl border px-7 text-sm font-semibold transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.9)" }}
          >
            See the full curriculum
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 1. Dashboard ─────────────────────────────────────────────────────────── */
function DashboardPanel({ data }: { data: TourData }) {
  // Illustrative progress: there is no real student to show, and inventing one
  // silently would be a fake screenshot. The caption says so plainly.
  const done = 3;
  const shown = data.modules.slice(0, 5);
  return (
    <Frame title="square1ai.com/dashboard">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <h3 className="text-base font-bold text-slate-900">{data.courseTitle}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {data.modules.length} modules · {data.totalLessons} lessons · {data.totalProjects} projects
          </p>
          <ul className="mt-4 space-y-2">
            {shown.map((m, i) => (
              <li key={m} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={
                    i < done
                      ? { background: BRAND, color: "#fff" }
                      : { background: "#F1F5F9", color: "#94A3B8" }
                  }
                >
                  {i < done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`text-sm ${i < done ? "text-slate-500 line-through" : "font-semibold text-slate-800"}`}>
                  {m}
                </span>
                {i === done && (
                  <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: BRAND }}>
                    NEXT
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <Stat label="Modules done" value={`${done} / ${data.modules.length}`} />
          <Stat label="Projects shipped" value={`1 / ${data.totalProjects}`} />
          <Stat label="Current level" value={data.levels[1]} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Module names and totals are live from the curriculum. Progress figures are illustrative.
      </p>
    </Frame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: BRAND }}>{value}</p>
    </div>
  );
}

/* ── 2. Lesson ────────────────────────────────────────────────────────────── */
function LessonPanel({ data }: { data: TourData }) {
  return (
    <Frame title={`square1ai.com/learn/${data.courseSlug}-lesson-1`}>
      <h3 className="text-lg font-bold text-slate-900">{data.lesson.title}</h3>
      <p className="mt-0.5 text-sm text-slate-500">About {data.lesson.minutes} minutes</p>

      {data.lesson.objectives.length > 0 && (
        <div className="mt-4 rounded-lg border border-[#CCE1FF] bg-[#F2F8FF] p-4">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>
            By the end you can
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.lesson.objectives.map((o) => (
              <li key={o} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} aria-hidden />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{data.lesson.excerpt}</p>
      <p className="mt-3 text-xs text-slate-400">Real lesson text, straight from the curriculum.</p>
    </Frame>
  );
}

/* ── 3. Nova ──────────────────────────────────────────────────────────────── */
function NovaPanel({ data }: { data: TourData }) {
  const { nova } = data;
  return (
    <Frame title={`square1ai.com/learn/${data.courseSlug}-lesson-1  ·  Nova`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Exercise</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{nova.exerciseTitle}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{nova.prompt}</p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Your answer</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{nova.studentAnswer}</p>
      </div>

      <div className="mt-3 rounded-lg border-2 p-4" style={{ borderColor: "#CCE1FF", background: "#F2F8FF" }}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Nova
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: BRAND }}>
            {nova.score} / {nova.maxMarks}
          </span>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-800">{nova.feedback}</p>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Nova&apos;s words are verbatim from the real marking model — not written for this page.
        Partial credit, and the specific thing that was missing.
      </p>
    </Frame>
  );
}

/* ── 4. Projects ──────────────────────────────────────────────────────────── */
function ProjectsPanel({ data }: { data: TourData }) {
  const { project } = data;
  return (
    <Frame title={`square1ai.com/projects/${data.courseSlug}-01`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
        {project.difficulty && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
            {project.difficulty}
          </span>
        )}
        {project.hours > 0 && (
          <span className="text-xs text-slate-500">~{project.hours} hours</span>
        )}
      </div>

      {project.stack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.stack.map((t) => (
            <li key={t} className="rounded-md border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {t}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{project.brief}</p>

      {project.hasRepo && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <GitBranch className="h-4 w-4" aria-hidden /> Starter repo, cloned on day one
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">
        A real brief from the track — a scenario with a client and a deadline, not a toy exercise.
      </p>
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
