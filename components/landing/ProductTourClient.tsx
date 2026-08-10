"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Sparkles, FolderGit2, Trophy,
  ArrowRight, Lock, X, Play, Pause, type LucideIcon,
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

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS CROPS — the change that makes this section work (2026-08-10 redesign).
//
// The old tour dropped a whole 3200×2000 desktop capture into an 840px frame.
// At 26% scale the product's 13px UI text renders at ~3px: the screen was
// simultaneously TOO BIG (it dominated the section and pushed the story off
// screen) and TOO SMALL (nothing in it was readable). A screenshot nobody can
// read proves nothing.
//
// So each step now declares the ONE region that carries its claim, and we zoom
// to it — the way Linear, Stripe and Superhuman demo software. `x`/`y` are the
// object-position of that region (also the transform-origin, so the zoom pushes
// INTO the point rather than drifting off it) and `scale` is how far in.
//
// A second, unplanned benefit decided the crop choices: the captures predate
// the 2026-08-10 UX sprint, so the left sidebar and the dashboard greeting in
// them show a nav that no longer exists. Every crop below deliberately excludes
// that chrome and holds only surfaces the sprint did not touch — the lesson
// prose, Nova's marking, the project brief. The section can keep saying "the
// actual product" and have it be true. Re-capture is still queued; when the new
// PNGs land they drop straight in here with no layout change.
// ═══════════════════════════════════════════════════════════════════════════════
type Shot = {
  src: string;
  alt: string;
  /** object-position + transform-origin, in %. */
  x: number;
  y: number;
  scale: number;
  /** Where the annotation pin sits inside the window, in %, and which way its
   *  label opens. A label must never cover the element it points at. */
  pin: { x: number; y: number; label: string; place?: "right" | "left" | "top" | "bottom" };
};

type Step = {
  key: StepKey;
  label: string;
  icon: LucideIcon;
  blurb: string;
  url: string;
  caption: string;
  shot?: Shot;
};

const STEPS: Step[] = [
  {
    key: "dashboard",
    label: "Your dashboard",
    icon: LayoutDashboard,
    blurb: "One place that always knows your next move — and how far you've come.",
    url: "square1ai.com/dashboard",
    caption: "A real student dashboard, three modules into the Data Science track.",
    shot: {
      src: "/product/dashboard.png",
      alt:
        "The Square 1 student dashboard: a Continue Learning card for the Data Science track showing the current Pandas DataFrames lesson, with a circular progress ring at 49% complete beside it.",
      x: 65, y: 25, scale: 1.46,
      pin: { x: 33, y: 24, label: "Picks up exactly where you stopped", place: "right" },
    },
  },
  {
    key: "lesson",
    label: "The lessons",
    icon: BookOpen,
    blurb: "Written, not filmed. Every section opens with the one line that matters.",
    url: "square1ai.com/learn · Pandas DataFrames",
    caption: "The real lesson player — read it, then prove it, with Nova one tap away.",
    shot: {
      src: "/product/lesson.png",
      alt:
        "The Square 1 lesson player showing the Pandas DataFrames lesson: a numbered section header, an 'In short' takeaway strip summarising the section in one line, then the Why This Matters prose beneath it.",
      x: 58, y: 24, scale: 1.6,
      pin: { x: 29, y: 28, label: "The section in one line, before the detail", place: "top" },
    },
  },
  {
    key: "nova",
    label: "Nova grades it",
    icon: Sparkles,
    blurb: "Every answer read and marked — with the gap named, not just a score.",
    url: "square1ai.com/learn · graded by Nova",
    caption: "A real answer, really graded — this mark came from the live model, not copywriting.",
    shot: {
      src: "/product/nova.png",
      alt:
        "A graded exercise in the Square 1 lesson player: the prompt asks the student to explain the difference between df.loc and df.iloc in Pandas, the student's written answer sits below it, and Nova's marking shows Correct 3 out of 3 with written feedback explaining what the answer demonstrated.",
      x: 53, y: 43, scale: 1.9,
      pin: { x: 64, y: 52, label: "Marked by the live grader", place: "right" },
    },
  },
  {
    key: "projects",
    label: "What you build",
    icon: FolderGit2,
    blurb: "Real briefs, a real starter repo, a real dataset. Cloned, not watched.",
    url: "square1ai.com/projects/automated-eda-profiler",
    caption: "A real project brief from the track — starter repo and dataset included.",
    shot: {
      src: "/product/project.png",
      alt:
        "A Square 1 project brief: Automated EDA Profiler, a beginner Data Science project estimated at 8 hours, with a narrative client scenario and a Getting Started panel offering a GitHub starter template and a clone command.",
      x: 72, y: 46, scale: 1.5,
      pin: { x: 84, y: 70, label: "Your repo, one click", place: "top" },
    },
  },
  {
    key: "outcome",
    label: "What you leave with",
    icon: Trophy,
    blurb: "Proof an employer can open, run and verify. Not a certificate of attendance.",
    url: "square1ai.com/progress",
    caption: "Finish the track and the work itself is the proof.",
  },
];

const DWELL_MS = 6000;

export function ProductTourClient({ data }: { data: TourData }) {
  const [step, setStep] = useState<StepKey>("dashboard");
  const activeIdx = STEPS.findIndex((s) => s.key === step);
  const active = STEPS[activeIdx];

  // ── Autoplay ───────────────────────────────────────────────────────────────
  // The section plays itself so a passive scroller still sees all five surfaces,
  // but it yields permanently the moment someone drives: having the screen yank
  // itself away mid-read is worse than no motion at all. Idles off-screen, never
  // starts under prefers-reduced-motion.
  //
  // The old build animated a fake cursor across the tab row to fake a screen
  // recording. It was doing geometry maths on every tick to chase button
  // positions, and it read as a gimmick. A rail row that fills while its step
  // holds says the same thing — this is playing, here's how long you have —
  // with none of the machinery.
  const [playing, setPlaying] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const takenOver = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (!takenOver.current) setPlaying(entry.isIntersecting); },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion]);

  const stopAutoplay = useCallback(() => {
    takenOver.current = true;
    setPlaying(false);
  }, []);

  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>('[aria-selected="true"]');
    // Only the horizontal (mobile) rail can hide the active step; on desktop the
    // column is fully visible and there is nothing to scroll.
    if (!rail || !el || rail.scrollWidth <= rail.clientWidth) return;
    const railBox = rail.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    const delta = (elBox.left - railBox.left) - (railBox.width - elBox.width) / 2;
    rail.scrollBy({ left: delta, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const t = window.setTimeout(() => {
      setStep(STEPS[(activeIdx + 1) % STEPS.length].key);
    }, DWELL_MS);
    return () => window.clearTimeout(t);
  }, [playing, activeIdx, reducedMotion]);

  // Arrow keys move through the rail, as a real tablist should.
  function onRailKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    stopAutoplay();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    setStep(STEPS[(activeIdx + dir + STEPS.length) % STEPS.length].key);
  }

  // ── Email gate on the section CTAs (unchanged contract) ────────────────────
  const router = useRouter();
  const [gateHref, setGateHref] = useState<string | null>(null);
  const [gateEmail, setGateEmail] = useState("");
  const [gateSaving, setGateSaving] = useState(false);

  function gateClick(e: React.MouseEvent, href: string) {
    let done = false;
    try { done = localStorage.getItem("s1-diag-optin") === "done"; } catch { /* private mode — ask */ }
    if (done) return;
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

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="tour-heading">
      {/* ONE container governs every child (header, rail, frame, CTAs). The old
          build mixed a full-width tab row with an 840px panel, so the tabs
          overhung the screen they controlled and the caption floated off past
          its left edge. Everything now shares max-w-6xl and the same gutter. */}
      <div
        ref={stageRef}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-5 py-12 sm:px-10 sm:py-14"
        style={{ background: "linear-gradient(160deg,#0B1B36 0%,#01224F 55%,#061530 100%)" }}
      >
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle,#3388FF,transparent 70%)" }} />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle,#0EA5E9,transparent 70%)" }} />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="relative mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#8FC4FF" }}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: "#3388FF" }} />
            See how it works
          </span>
          <h2 id="tour-heading" className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-[2.5rem]">
            The whole thing, before you sign up
          </h2>
          <p className="mx-auto mt-4 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Five screens from the {data.courseTitle} track — the lessons, the marking and
            the projects exactly as they arrive on day one.
          </p>
        </header>

        {/* ── Body: rail + stage ─────────────────────────────────────────────
            Two columns on desktop so the story sits BESIDE the screen instead
            of stacked above it — the old layout pushed the product a third of a
            viewport down. On mobile the rail collapses to a scrollable chip row
            (compact: the five oversized boxes were the "wall of cards" effect). */}
        <div className="relative mt-12 grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10">

          {/* Rail */}
          <div
            ref={railRef}
            role="tablist"
            aria-label="Product tour"
            aria-orientation="vertical"
            onKeyDown={onRailKey}
            className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {STEPS.map((s, i) => {
              const on = s.key === step;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={on}
                  aria-controls={`tour-panel-${s.key}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => { stopAutoplay(); setStep(s.key); }}
                  className="group relative shrink-0 snap-start overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-colors lg:w-full lg:shrink"
                  style={{
                    borderColor: on ? "rgba(51,136,255,0.55)" : "rgba(255,255,255,0.10)",
                    background: on ? "rgba(51,136,255,0.14)" : "transparent",
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors"
                      style={on
                        ? { background: "#3388FF", color: "#fff" }
                        : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      {i + 1}
                    </span>
                    <Icon className="hidden h-4 w-4 shrink-0 lg:block" aria-hidden
                          style={{ color: on ? "#8FC4FF" : "rgba(255,255,255,0.4)" }} />
                    <span className="whitespace-nowrap text-[13px] font-bold lg:whitespace-normal"
                          style={{ color: on ? "#fff" : "rgba(255,255,255,0.7)" }}>
                      {s.label}
                    </span>
                  </span>

                  {/* The blurb lives INSIDE its own step — it used to sit in a
                      lone row far from both the rail and the frame, which is
                      what made the section read as unaligned. Desktop only:
                      on mobile it would blow the chip row's height apart. */}
                  {on && (
                    <span className="mt-1.5 hidden pl-[2.1rem] text-[12px] leading-relaxed lg:block"
                          style={{ color: "rgba(255,255,255,0.62)" }}>
                      {s.blurb}
                    </span>
                  )}

                  {on && playing && !reducedMotion && (
                    <span key={`${s.key}-bar`} aria-hidden
                          className="tour-progress absolute bottom-0 left-0 h-[2px]"
                          style={{ background: "linear-gradient(90deg,#3388FF,#8FC4FF)" }} />
                  )}
                </button>
              );
            })}

            {/* Play/pause sits at the foot of the rail — an operable control in
                the same column as the thing it operates. */}
            {!reducedMotion && (
              <button
                onClick={() => { if (playing) stopAutoplay(); else { takenOver.current = false; setPlaying(true); } }}
                className="mt-1 hidden h-9 items-center gap-2 self-start rounded-full border px-3.5 text-[11px] font-bold transition-colors lg:inline-flex"
                style={{ borderColor: "rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}
              >
                {playing ? <Pause className="h-3 w-3" aria-hidden /> : <Play className="h-3 w-3" aria-hidden />}
                {playing ? "Pause tour" : "Play tour"}
              </button>
            )}
          </div>

          {/* Stage */}
          <div className="relative min-w-0">
            {/* Mobile blurb: the desktop rail carries it inline, so this only
                renders where the chips can't. */}
            <p className="mb-3 text-sm leading-relaxed lg:hidden" style={{ color: "rgba(255,255,255,0.7)" }}>
              {active.blurb}
            </p>

            <span aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-5 rounded-[2rem] opacity-60 blur-2xl"
                  style={{ background: "radial-gradient(60% 60% at 50% 0%,rgba(51,136,255,0.32),transparent 70%)" }} />

            {STEPS.map((s) => (
              <div key={s.key} id={`tour-panel-${s.key}`} role="tabpanel" aria-label={s.label}
                   hidden={s.key !== step} className="relative">
                <div key={s.key === step ? `in-${step}` : "idle"} className={s.key === step ? "tour-panel-in" : undefined}>
                  <Frame url={s.url} caption={s.caption} real={Boolean(s.shot)}>
                    {s.shot ? <FocusShot shot={s.shot} /> : <OutcomePanel data={data} />}
                  </Frame>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ───────────────────────────────────────────────────────── */}
        <div className="relative mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/try/${data.courseSlug}`}
            onClick={(e) => gateClick(e, `/try/${data.courseSlug}`)}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:w-auto"
            style={{ color: "#01224F", boxShadow: "0 10px 30px -10px rgba(255,255,255,0.45)" }}
          >
            Read the first lesson free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={`/courses/${data.courseSlug}`}
            onClick={(e) => gateClick(e, `/courses/${data.courseSlug}`)}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border px-7 text-sm font-semibold transition-colors sm:w-auto"
            style={{ borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.9)" }}
          >
            See the full curriculum
          </Link>
        </div>
      </div>

      {/* Email gate — unchanged contract. */}
      {gateHref && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#00183A]/70 px-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-label="Leave your email to continue"
          onClick={() => setGateHref(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl motion-safe:animate-fade-in-up"
               onClick={(e) => e.stopPropagation()}>
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

/* ── The app window ────────────────────────────────────────────────────────
   Chrome stays deliberately quiet: a URL bar reads as "a real screen" in a way
   three traffic-light dots never do, and everything else gets out of the
   screenshot's way. The "Real screen" chip is the honesty claim made visible —
   this section's whole job is being checkable. */
function Frame({ url, caption, real, children }: {
  url: string; caption: string; real: boolean; children: React.ReactNode;
}) {
  return (
    <figure className="relative m-0 overflow-hidden rounded-2xl bg-white"
            style={{ boxShadow: "0 40px 80px -30px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.14)" }}>
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1"
              style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}>
          <Lock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate text-[11px] font-medium text-slate-500">{url}</span>
        </span>
        {real && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Real screen
          </span>
        )}
      </div>

      {children}

      <figcaption className="border-t border-slate-100 px-4 py-2.5 text-[11px] leading-relaxed text-slate-400 sm:px-5">
        {caption}
      </figcaption>
    </figure>
  );
}

/* ── A zoomed region of a real capture ─────────────────────────────────────
   Fixed 16:9 window, image scaled into the declared focus point. Because
   object-position and transform-origin share the same coordinates, the zoom
   drives INTO that point instead of sliding away from it. */
function pinLabelOffset(place: "right" | "left" | "top" | "bottom"): React.CSSProperties {
  switch (place) {
    case "left":   return { right: "1.25rem", top: "50%", transform: "translateY(-50%)" };
    case "top":    return { bottom: "1.25rem", left: "50%", transform: "translateX(-50%)" };
    case "bottom": return { top: "1.25rem", left: "50%", transform: "translateX(-50%)" };
    default:       return { left: "1.25rem", top: "50%", transform: "translateY(-50%)" };
  }
}

function FocusShot({ shot }: { shot: Shot }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-white">
      <Image
        src={shot.src}
        alt={shot.alt}
        fill
        quality={90}
        sizes="(max-width: 1024px) 100vw, 760px"
        className="tour-shot select-none"
        style={{
          objectFit: "cover",
          objectPosition: `${shot.x}% ${shot.y}%`,
          transform: `scale(calc(var(--tour-zoom, 1) * ${shot.scale}))`,
          transformOrigin: `${shot.x}% ${shot.y}%`,
        }}
        priority={false}
      />

      {/* Annotation pin — the "show, don't tell" beat. It names the one thing
          in this crop that proves the step's claim, so the visitor doesn't have
          to hunt for it. Decorative and inert. */}
      <span aria-hidden className="pointer-events-none absolute z-10 hidden sm:block"
            style={{ left: `${shot.pin.x}%`, top: `${shot.pin.y}%`, transform: "translate(-50%,-50%)" }}>
        <span className="relative flex h-3 w-3">
          <span className="tour-pin-ping absolute inline-flex h-full w-full rounded-full" style={{ background: BRAND, opacity: 0.45 }} />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white" style={{ background: BRAND }} />
        </span>
        <span className="absolute whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-bold text-white shadow-lg"
              style={{ background: "rgba(1,34,79,0.92)", ...pinLabelOffset(shot.pin.place ?? "right") }}>
          {shot.pin.label}
        </span>
      </span>
    </div>
  );
}

/* ── Step 5: the outcome, as real DOM ──────────────────────────────────────
   The only panel with no capture behind it, because "what you leave with" is a
   claim about the future rather than a screen that exists today. Sized to sit
   in the same 16:9 window as the shots so the frame never jumps height. */
function OutcomePanel({ data }: { data: TourData }) {
  return (
    <div className="flex aspect-[16/9] w-full flex-col justify-center px-5 py-4 sm:px-7">
      <p className="text-[13px] leading-relaxed text-slate-700 sm:text-sm">
        Finish the track and the work itself is the proof. Every project is marked against a
        published rubric, and the result is a report an employer can check — not a certificate
        that only says you attended.
      </p>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Levels you move through</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.levels.map((l, i) => (
            <span key={l} className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                  style={i <= 1 ? { background: BRAND, color: "#fff" } : { background: "#F1F5F9", color: "#64748B" }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          { t: `${data.totalProjects} projects`, d: "Deployed, with live URLs and a public repo." },
          { t: "A skill report", d: "Strengths and gaps per topic, from marked work." },
          { t: "A portfolio page", d: "One link an employer can open and run." },
        ].map((x) => (
          <li key={x.t} className="rounded-lg border border-slate-200 p-3">
            <p className="text-[12.5px] font-bold text-slate-900">{x.t}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{x.d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
