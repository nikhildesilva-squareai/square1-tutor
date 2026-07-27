"use client";

import { useEffect, useRef, useState } from "react";
import { Hammer, FolderGit2, ClipboardCheck } from "lucide-react";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// The premise — practice-first learning. Follows RealityBand's closing line
// ("project by graded project") and answers it with the REAL syllabus: the
// project rail is now a track explorer — tabs switch between career tracks,
// every stop is a real project from the DB (title + tech stack), and hovering
// or tapping a stop pops its card. Clicking pins a stop; tab switch resets.
// All facts remain product facts — titles and stacks come from the projects
// table via page.tsx (FALLBACK_TRACKS is a static snapshot of the same rows
// for when the DB read fails).
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

export type RailProject = { n: number; title: string; stack: string };
export type RailTrack = { slug: string; label: string; projects: RailProject[] };

// Static snapshot of the machine-learning track (real DB rows, 2026-07-25) so
// the rail still shows a genuine syllabus if the courses query ever fails.
const FALLBACK_TRACKS: RailTrack[] = [
  {
    slug: "machine-learning",
    label: "Machine Learning",
    projects: [
      { n: 1,  title: "House Price Predictor",            stack: "Python · scikit-learn · Pandas" },
      { n: 2,  title: "Email Spam Classifier",            stack: "Python · scikit-learn · NLP" },
      { n: 3,  title: "Customer Segmentation Dashboard",  stack: "Python · K-means · Streamlit" },
      { n: 4,  title: "Movie Recommendation Engine",      stack: "Python · Collaborative Filtering · Flask" },
      { n: 5,  title: "Fraud Detection System",           stack: "Python · XGBoost · FastAPI" },
      { n: 6,  title: "Stock Price Forecaster",           stack: "Python · LSTM · PyTorch" },
      { n: 7,  title: "Image Classifier (CNN)",           stack: "Python · PyTorch · CNN" },
      { n: 8,  title: "Sentiment Analysis API",           stack: "Python · Hugging Face · FastAPI" },
      { n: 9,  title: "AutoML Pipeline Builder",          stack: "Python · Optuna · MLflow" },
      { n: 10, title: "End-to-End ML Platform",           stack: "Python · MLflow · Docker" },
    ],
  },
];

const BENEFITS = [
  {
    icon: Hammer,
    title: "Build to remember",
    desc: "Reading fades; building sticks. Every lesson ends in exercises, and every module feeds a project — you practise the skill, not the summary.",
  },
  {
    icon: FolderGit2,
    title: "Proof employers can run",
    desc: "Each project starts from a real starter repo with a real dataset and ships to your GitHub. Not screenshots of coursework — code anyone can clone and run.",
  },
  {
    icon: ClipboardCheck,
    title: "Graded, not guessed",
    desc: "Nova reviews every project against a rubric — what's solid, what's missing, what a senior would flag — so you know it's actually good before an employer sees it.",
  },
];

export function BuildPremiseSection({ tracks }: { tracks?: RailTrack[] }) {
  const rail = tracks && tracks.length > 0 ? tracks : FALLBACK_TRACKS;

  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeSlug, setActiveSlug] = useState(rail[0].slug);
  // A hovered stop previews; a clicked stop pins. Hover wins while it lasts.
  const [pinned, setPinned] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const track = rail.find((t) => t.slug === activeSlug) ?? rail[0];
  const N = track.projects.length;
  const shown = hovered ?? pinned;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const switchTrack = (slug: string) => {
    setActiveSlug(slug);
    setPinned(null);
    setHovered(null);
  };

  return (
    <section ref={ref} className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #F6F9FE 0%, #FFFFFF 55%, #F4F8FF 100%)" }}>
      <div className="pointer-events-none absolute top-1/4 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">The premise</span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[1.0] max-w-3xl mx-auto"
            style={{ fontSize: "clamp(26px, 4vw, 46px)", letterSpacing: "-0.03em" }}>
            You don&apos;t learn AI by watching.{" "}
            <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              You learn by building.
            </span>
          </h2>
          <p className="mt-5 text-center text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Every career track is built around <span className="text-slate-900 font-semibold">10+ real projects</span> —
            each with a starter repo, a real dataset, and a rubric. You build, Nova grades, it ships to
            your GitHub. By the capstone, your portfolio <em>is</em> your CV.
          </p>
        </div>

        {/* ── Track tabs — swap in a real track's real syllabus ─────────────── */}
        {rail.length > 1 && (
          /* Mobile: one swipeable row (10 wrapped pills ate ~250px of screen);
             sm+: centred wrap as before. */
          <div className="mt-10 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {rail.map((t) => {
              const active = t.slug === activeSlug;
              return (
                <button
                  key={t.slug}
                  onClick={() => switchTrack(t.slug)}
                  aria-pressed={active}
                  className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-[0.97]"
                  style={active
                    ? { background: BLUE_GRADIENT, color: "#fff", boxShadow: "0 8px 20px -8px rgba(0,86,206,0.5)" }
                    : { background: "#fff", color: "#475569", border: "1px solid #D8E7FC", boxShadow: "0 1px 2px rgba(15,28,49,0.04)" }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Desktop: sequential timeline — every card anchored to its own stop,
               alternating above/below the rail (metro-map zigzag) so the eye
               walks 01→10 along one line. Cards, stubs, and dots share the same
               N-column grid geometry, so everything lines up on the stops.
               Hover cross-highlights card ↔ dot. ── */}
        <div className="hidden md:block mt-12">
          {(() => {
            const cols = { gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` };
            // Card spans its own column plus half of each empty neighbor
            // (same-row cards are 2 columns apart), so no width fits all:
            // 200% of the column minus a gutter, capped for very wide screens.
            const Card = ({ p, i }: { p: RailProject; i: number }) => {
              const isShown = shown === i;
              return (
                <div
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="rounded-xl border bg-white p-3 cursor-default motion-reduce:transition-none"
                  style={{
                    width: "min(calc(200% - 14px), 190px)",
                    borderColor: isShown ? "#3388FF" : "#E2E8F0",
                    boxShadow: isShown ? "0 12px 26px -12px rgba(0,86,206,0.4)" : "0 1px 2px rgba(15,28,49,0.04)",
                    transform: isShown ? "translateY(-3px)" : "translateY(0)",
                    opacity: visible ? 1 : 0,
                    transition: `opacity 400ms ease ${250 + i * 70}ms, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease`,
                  }}
                >
                  <p className="text-[9.5px] font-mono font-bold tabular-nums transition-colors"
                    style={{ color: isShown ? "#0056CE" : "#94A3B8" }}>
                    {String(p.n).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[12px] font-bold text-slate-900 leading-tight">{p.title}</p>
                  <p className="mt-1 text-[10px] text-slate-500 leading-snug">{p.stack}</p>
                </div>
              );
            };
            const Stub = ({ i }: { i: number }) => (
              <span aria-hidden className="w-[2px] h-[16px] motion-reduce:transition-none"
                style={{
                  background: shown === i ? "#3388FF" : "#BFD9FC",
                  opacity: visible ? 1 : 0,
                  transition: `opacity 400ms ease ${250 + i * 70}ms, background 180ms ease`,
                }} />
            );
            return (
              <>
                {/* Cards above the rail — stops 01, 03, 05, … */}
                <div className="grid items-end" style={cols}>
                  {track.projects.map((p, i) => i % 2 === 0 && (
                    <div key={`${track.slug}-t-${p.n}`}
                      className="flex flex-col items-center"
                      style={{ gridColumn: i + 1, gridRow: 1 }}>
                      <Card p={p} i={i} />
                      <Stub i={i} />
                    </div>
                  ))}
                </div>

                {/* Track line + dots (dots centered on the same grid columns) */}
                <div className="relative">
                  <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full motion-reduce:transition-none"
                      style={{
                        width: visible ? "100%" : "0%",
                        background: BLUE_GRADIENT,
                        transition: "width 1800ms cubic-bezier(0.4,0,0.2,1) 200ms",
                      }} />
                  </div>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 grid" style={cols}>
                    {track.projects.map((p, i) => {
                      const isShown = shown === i;
                      return (
                        <button
                          key={`${track.slug}-${p.n}`}
                          onClick={() => setPinned(pinned === i ? null : i)}
                          onMouseEnter={() => setHovered(i)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(i)}
                          onBlur={() => setHovered(null)}
                          aria-label={`Project ${p.n}: ${p.title}`}
                          className="relative rounded-full border-2 border-white cursor-pointer active:scale-90 justify-self-center motion-reduce:transition-none"
                          style={{
                            gridColumn: i + 1,
                            gridRow: 1,
                            width: isShown ? 20 : 14,
                            height: isShown ? 20 : 14,
                            background: isShown ? "#01224F" : pinned === i ? "#0056CE" : "#3388FF",
                            boxShadow: isShown
                              ? "0 4px 14px rgba(0,86,206,0.55), 0 0 0 4px rgba(51,136,255,0.2)"
                              : "0 2px 8px rgba(0,86,206,0.35)",
                            opacity: visible ? 1 : 0,
                            transform: visible ? "scale(1)" : "scale(0)",
                            transition: `opacity 300ms ease ${200 + i * 90}ms, transform 200ms cubic-bezier(0.34,1.56,0.64,1) ${visible ? 0 : 200 + i * 90}ms, width 180ms ease, height 180ms ease, background 180ms ease, box-shadow 180ms ease`,
                          }} />
                      );
                    })}
                  </div>
                </div>

                {/* Cards below the rail — stops 02, 04, 06, … */}
                <div className="grid items-start" style={cols}>
                  {track.projects.map((p, i) => i % 2 === 1 && (
                    <div key={`${track.slug}-b-${p.n}`}
                      className="flex flex-col items-center"
                      style={{ gridColumn: i + 1, gridRow: 1 }}>
                      <Stub i={i} />
                      <Card p={p} i={i} />
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* ── Mobile: the full real syllabus as a vertical rail ─────────────── */}
        <div className="md:hidden mt-8 relative pl-7">
          <div className="absolute left-2 top-1 bottom-1 w-1 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
            <div className="w-full rounded-full motion-reduce:transition-none"
              style={{
                height: visible ? "100%" : "0%",
                background: BLUE_GRADIENT,
                transition: "height 1600ms cubic-bezier(0.4,0,0.2,1) 200ms",
              }} />
          </div>
          <div className="space-y-4">
            {track.projects.map((p, i) => (
              <div key={`${track.slug}-m-${p.n}`} className="relative motion-reduce:transition-none"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(10px)",
                  transition: `opacity 400ms ease ${200 + i * 90}ms, transform 400ms ease ${200 + i * 90}ms`,
                }}>
                <span className="absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ background: "#0056CE", boxShadow: "0 2px 8px rgba(0,86,206,0.35)" }} />
                <p className="text-[10px] font-mono font-bold tabular-nums text-slate-400">Project {String(p.n).padStart(2, "0")}</p>
                <p className="text-sm font-bold text-slate-900 leading-tight">{p.title}</p>
                <p className="text-[11px] text-slate-500">{p.stack}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why building wins — three benefits (hover-lift, entrance on wrapper) ── */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              className="motion-reduce:transition-none"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 500ms ease ${600 + i * 120}ms, transform 500ms ease ${600 + i * 120}ms`,
              }}>
              <div
                className="spotlight-card h-full"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                }}
              >
                <div className="spotlight-card-inner p-6">
                  <div className="spotlight-card-glow" aria-hidden />
                  <div className="relative flex items-start justify-between">
                    <span className="benefit-icon w-11 h-11 rounded-[13px] flex items-center justify-center text-white"
                      style={{ background: BLUE_GRADIENT, boxShadow: "0 8px 18px -8px rgba(0,86,206,0.6)" }}>
                      <Icon size={20} strokeWidth={2.1} aria-hidden />
                    </span>
                    <span className="text-[11px] font-mono font-bold tabular-nums text-slate-300 select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="relative mt-4 text-base font-black tracking-tight text-slate-900">{title}</h3>
                  <p className="relative mt-2 text-[13px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Product facts — real, checkable numbers only */}
        <p className="mt-8 text-center text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wide">
          10+ projects per career track · 152 starter repos live on GitHub · real datasets included · every project Nova-graded
        </p>

        {/* CTA — same single funnel */}
        <div className="mt-8 flex justify-center">
          <PrimaryCta href="/diagnostic">Start project 01 — free 3-min skill check</PrimaryCta>
        </div>
      </div>
    </section>
  );
}
