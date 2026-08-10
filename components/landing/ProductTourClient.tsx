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
  /** object-position + transform-origin, in %. The camera pushes INTO this point. */
  x: number;
  y: number;
  /** Zoom once the camera has pushed in. */
  scale: number;
  /** Opening framing: near 1 shows the WHOLE screen, so a visitor sees the app's
   *  navigation and layout — the "space" — before we push into the detail. */
  wide: number;
  /** The control the cursor flies to and clicks. Doubles as the annotation pin:
   *  one marker, named once, then actually used. `place` keeps the label off
   *  the element it names. */
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
      x: 62, y: 27, scale: 1.34, wide: 1.02,
      pin: { x: 17, y: 26, label: "Resume where you stopped", place: "bottom" },
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
      x: 56, y: 25, scale: 1.45, wide: 1.02,
      pin: { x: 13, y: 31, label: "The one line that matters", place: "top" },
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
      x: 53, y: 44, scale: 1.72, wide: 1.02,
      pin: { x: 18, y: 60, label: "Nova's mark, written live", place: "bottom" },
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
      x: 70, y: 46, scale: 1.42, wide: 1.02,
      pin: { x: 84, y: 66, label: "Clone your starter repo", place: "top" },
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

// ── Shot choreography ───────────────────────────────────────────────────────
// Each step plays like a screen recording rather than a slide: the camera opens
// WIDE (you see the whole app — sidebar, layout, where things live), pushes in
// to the detail, names the control, then a cursor flies to that control and
// clicks it — and the click is what hands over to the next screen. Cause, then
// effect. Timings are the beats of that sentence.
const WIDE_HOLD_MS = 1000;   // hold the establishing shot
const ZOOM_MS = 1600;        // camera push (also the CSS transition)
const PIN_AT_MS = 2500;      // label the control once we're close enough to read it
const CURSOR_AT_MS = 3700;   // pointer enters
const CURSOR_TRAVEL_MS = 800;
const CLICK_AT_MS = 4700;
const DWELL_MS = 5500;       // ...and the screen changes

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

  // Camera + pointer state for the active panel. When the tour is paused, a
  // visitor took over, or motion is reduced, everything resolves to the final
  // frame (detail + label, no pointer) so a still tour is still complete.
  const [phase, setPhase] = useState<"wide" | "focus">("focus");
  const [showPin, setShowPin] = useState(true);
  const [cursor, setCursor] = useState<"off" | "enter" | "arrived">("off");
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!playing || reducedMotion) {
      setPhase("focus"); setShowPin(true); setCursor("off"); setClicked(false);
      return;
    }
    setPhase("wide"); setShowPin(false); setCursor("off"); setClicked(false);
    const timers = [
      window.setTimeout(() => setPhase("focus"), WIDE_HOLD_MS),
      window.setTimeout(() => setShowPin(true), PIN_AT_MS),
      window.setTimeout(() => setCursor("enter"), CURSOR_AT_MS),
      // A frame later so the pointer has a start position to travel FROM.
      window.setTimeout(() => setCursor("arrived"), CURSOR_AT_MS + 40),
      window.setTimeout(() => setClicked(true), CLICK_AT_MS),
      window.setTimeout(() => setStep(STEPS[(activeIdx + 1) % STEPS.length].key), DWELL_MS),
    ];
    return () => timers.forEach(window.clearTimeout);
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
                    {s.shot
                      ? <FocusShot shot={s.shot} phase={phase} showPin={showPin} cursor={cursor} clicked={clicked} />
                      : <OutcomePanel data={data} />}
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

function FocusShot({ shot, phase, showPin, cursor, clicked }: {
  shot: Shot;
  phase: "wide" | "focus";
  showPin: boolean;
  cursor: "off" | "enter" | "arrived";
  clicked: boolean;
}) {
  // The pointer starts down-and-right of the target and glides onto it, the way
  // a hand actually moves to a button.
  const cursorX = cursor === "arrived" ? shot.pin.x : shot.pin.x + 13;
  const cursorY = cursor === "arrived" ? shot.pin.y : shot.pin.y + 22;

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
          // Wide establishing framing, then the push in. Same origin as the
          // object-position, so the camera drives INTO the point.
          transform: `scale(calc(var(--tour-zoom, 1) * ${phase === "wide" ? shot.wide : shot.scale}))`,
          transformOrigin: `${shot.x}% ${shot.y}%`,
          transition: `transform ${ZOOM_MS}ms cubic-bezier(.22,.61,.36,1)`,
        }}
        priority={false}
      />

      {/* The control this step turns on: named, then clicked. Desktop only —
          on a phone the label is wider than the thing it points at. */}
      <span
        aria-hidden
        className="pointer-events-none absolute z-10 hidden transition-opacity duration-300 sm:block"
        style={{
          left: `${shot.pin.x}%`, top: `${shot.pin.y}%`,
          transform: "translate(-50%,-50%)",
          opacity: showPin ? 1 : 0,
        }}
      >
        <span className="relative flex h-3 w-3">
          <span className="tour-pin-ping absolute inline-flex h-full w-full rounded-full" style={{ background: BRAND, opacity: 0.45 }} />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white" style={{ background: BRAND }} />
        </span>
        <span className="absolute whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-bold text-white shadow-lg"
              style={{ background: "rgba(1,34,79,0.92)", ...pinLabelOffset(shot.pin.place ?? "right") }}>
          {shot.pin.label}
        </span>
      </span>

      {/* Simulated pointer. Decorative and inert: it never intercepts events,
          and real focus/clicks are untouched. */}
      {cursor !== "off" && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-20 hidden sm:block"
          style={{
            left: `${cursorX}%`, top: `${cursorY}%`,
            transition: `left ${CURSOR_TRAVEL_MS}ms cubic-bezier(.4,.1,.2,1), top ${CURSOR_TRAVEL_MS}ms cubic-bezier(.4,.1,.2,1)`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.35))", transform: clicked ? "scale(.85)" : "scale(1)", transition: "transform 120ms ease" }}>
            <path d="M5 2l14 8.5-6.2 1.3L9.7 19 5 2z" fill="#0F172A" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {clicked && (
            <span className="tour-click absolute -left-3 -top-3 h-9 w-9 rounded-full"
                  style={{ border: `2.5px solid ${BRAND}` }} />
          )}
        </span>
      )}
    </div>
  );
}

/* ── Step 5: the record the track leaves behind ────────────────────────────
   The only panel with no capture behind it, because "what you leave with" is a
   claim about the end of the track rather than a screen that exists on day one.
   It used to be three sentences floating in a 16:9 box — mostly dead space, and
   the weakest beat in the tour. Now it's laid out like the progress screen it
   describes: counts, the level ladder, then the three artefacts.

   Every number is REAL (the track's own lesson/project/module counts from the
   database). Nothing here invents a student's progress — no fake percentages,
   no invented mastery bars — because a fabricated progress screen on a page
   selling verifiable proof would be the one lie that matters. */
function OutcomePanel({ data }: { data: TourData }) {
  const stats = [
    { n: data.totalProjects, label: "projects deployed", sub: "public repo + live URL" },
    { n: data.totalLessons, label: "lessons completed", sub: "each one graded" },
    { n: data.modules.length, label: "modules mastered", sub: "beginner to advanced" },
  ];

  return (
    <div className="flex aspect-[16/9] w-full flex-col justify-center gap-3.5 px-5 py-4 sm:gap-4 sm:px-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Your record after the track
          </p>
          <p className="text-[15px] font-bold leading-tight text-slate-900 sm:text-base">{data.courseTitle}</p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: "rgba(0,86,206,0.10)", color: BRAND }}>
          Employer-verifiable
        </span>
      </div>

      {/* Counts — the track's real shape */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <p className="text-lg font-black leading-none tabular-nums text-slate-900 sm:text-xl">{s.n}</p>
            <p className="mt-1 text-[10.5px] font-bold leading-tight text-slate-700">{s.label}</p>
            <p className="mt-0.5 text-[9.5px] leading-tight text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* The ladder you climb — real band names from the competency model */}
      <div>
        <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Levels you move through
        </p>
        <div className="flex items-center gap-1">
          {data.levels.map((l, i) => (
            <span key={l} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className="w-full truncate rounded-md px-1.5 py-1 text-center text-[10px] font-bold"
                style={i === data.levels.length - 1
                  ? { background: BRAND, color: "#fff" }
                  : { background: "#F1F5F9", color: "#64748B" }}
              >
                {l}
              </span>
              {i < data.levels.length - 1 && (
                <span aria-hidden className="text-[9px] text-slate-300">›</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* The three artefacts that leave with you */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { t: "A portfolio page", d: "One link an employer opens and runs." },
          { t: "A skill report", d: "Strengths and gaps per topic, from marked work." },
          { t: "A verified certificate", d: "Checkable by credential ID at /verify." },
        ].map((x) => (
          <div key={x.t} className="rounded-lg border border-slate-200 px-3 py-2.5">
            <p className="text-[11.5px] font-bold leading-tight text-slate-900">{x.t}</p>
            <p className="mt-0.5 text-[9.5px] leading-snug text-slate-500">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
