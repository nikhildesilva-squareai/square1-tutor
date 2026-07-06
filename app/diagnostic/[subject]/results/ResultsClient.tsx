"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ShareResultButton } from "@/components/ShareResultButton";
import { FOUNDING_PLANS } from "@/lib/founding";
import {
  getDiagnostic,
  getSubject,
  scoreDiagnostic,
  decodeAnswers,
  getTopicResults,
  encodeAnswers,
  SUBJECT_SEO,
} from "@/lib/diagnostic";

// ═══════════════════════════════════════════════════════════════════════════════
// Skill-scan results — the highest-traffic conversion surface in the product.
// Visual language matches the brand system (see OG cards / founding card):
// deep navy surfaces, ONE data colour (brand blue) for scores and charts,
// emerald only for "free"/correct, soft red only for incorrect markers.
// Levels are expressed by position on the band meter, never by alarming hues.
//
// Narrative: your result → share it → what the FULL report tracks (the product
// showcase) → the founding offer (3 tiers + live seat counter).
// ═══════════════════════════════════════════════════════════════════════════════

const NAVY_BG = "#050B14";
const CARD = "#0B1626";
const CARD_ALT = "#081120";
const HAIRLINE = "rgba(51,136,255,0.14)";
const BLUE = "#3388FF";
const BLUE_SOFT = "#7EB3FF";
const TEXT_DIM = "#7EA6D8";
const BRAND_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

const READINESS_BANDS = [
  { label: "Novice", min: 0, max: 1 },
  { label: "Developing", min: 2, max: 2 },
  { label: "Competent", min: 3, max: 3 },
  { label: "Proficient", min: 4, max: 4 },
  { label: "Expert", min: 5, max: 5 },
];

function getBandIndex(score: number) {
  const i = READINESS_BANDS.findIndex((b) => score >= b.min && score <= b.max);
  return i < 0 ? 0 : i;
}

const ASPIRATIONAL: Record<string, string> = {
  "0": "You've identified all five focus areas. Now you know exactly where to start.",
  "1": "One down, four to go. You've got a foundation to build on.",
  "2": "Solid start. You've got the basics — the gaps are exactly what the learning path targets.",
  "3": "Strong showing. Three out of five means you're past the fundamentals.",
  "4": "Impressive. You're close to proficient — one area to sharpen.",
  "5": "Outstanding. You nailed every topic. The full assessment will challenge you deeper.",
};

/* ── Brand radar (dark) ──────────────────────────────────────────────────── */
function DarkRadar({ axes }: { axes: { label: string; value: number; max: number }[] }) {
  const N = axes.length;
  const CX = 150, CY = 150, R = 100;

  function point(i: number, r: number): [number, number] {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
  }
  const toPoints = (pairs: [number, number][]) => pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints: [number, number][] = axes.map((a, i) => point(i, (a.max > 0 ? a.value / a.max : 0) * R));

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[240px] mx-auto">
      {rings.map((ring) => (
        <polygon key={ring} points={toPoints(axes.map((_, i) => point(i, ring * R)))} fill="none"
          stroke="rgba(126,166,216,0.15)" strokeWidth="1" strokeDasharray={ring < 1 ? "3 3" : "none"} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(126,166,216,0.15)" strokeWidth="1" />;
      })}
      <defs>
        <radialGradient id="brandRadarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.45" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0.06" />
        </radialGradient>
      </defs>
      <polygon points={toPoints(dataPoints)} fill="url(#brandRadarFill)" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill={BLUE} stroke={NAVY_BG} strokeWidth="2" />
      ))}
      {axes.map((a, i) => {
        const [lx, ly] = point(i, R + 28);
        const anchor = lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="9"
            fontFamily="system-ui, sans-serif" fill={TEXT_DIM} fontWeight={500}>
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Mini chart previews — what the FULL report tracks ───────────────────────
   Illustrative previews of real product surfaces: competency radar, the
   Novice→Expert matrix, progress-over-time, and AI-scored projects. */
function MiniRadar() {
  const pts = "60,14 96,42 84,86 36,86 24,42";
  return (
    <svg viewBox="0 0 120 100" className="w-full h-20">
      {[0.5, 1].map((r) => (
        <polygon key={r} points={pts.split(" ").map((p) => { const [x, y] = p.split(",").map(Number); return `${60 + (x - 60) * r},${50 + (y - 50) * r}`; }).join(" ")}
          fill="none" stroke="rgba(126,166,216,0.2)" strokeWidth="1" />
      ))}
      <polygon points="60,26 84,44 76,76 42,72 34,46" fill="rgba(51,136,255,0.25)" stroke={BLUE} strokeWidth="1.5" />
    </svg>
  );
}
function MiniMatrix() {
  const rows = [82, 64, 47, 71];
  return (
    <div className="w-full h-20 flex flex-col justify-center gap-2 px-1">
      {rows.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(126,166,216,0.15)" }}>
            <div className="h-full rounded-full" style={{ width: `${v}%`, background: `linear-gradient(90deg, ${BLUE}, ${BLUE_SOFT})` }} />
          </div>
          <span className="text-[8px] font-bold tabular-nums" style={{ color: TEXT_DIM }}>{v}%</span>
        </div>
      ))}
    </div>
  );
}
function MiniProgress() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-20">
      {[20, 40, 60].map((y) => <line key={y} x1="8" y1={y} x2="112" y2={y} stroke="rgba(126,166,216,0.12)" strokeWidth="1" />)}
      <polyline points="10,66 34,58 56,44 80,30 110,14" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="110" cy="14" r="4" fill={BLUE} stroke={NAVY_BG} strokeWidth="2" />
    </svg>
  );
}
function MiniProjects() {
  const bars = [55, 72, 68, 88, 94];
  return (
    <svg viewBox="0 0 120 80" className="w-full h-20">
      {bars.map((v, i) => (
        <rect key={i} x={12 + i * 21} y={72 - v * 0.62} width="13" rx="3" height={v * 0.62}
          fill={i === bars.length - 1 ? BLUE : "rgba(51,136,255,0.35)"} />
      ))}
    </svg>
  );
}

const SHOWCASE = [
  { title: "Competency radar", sub: "Mastery across every domain of your track", chart: MiniRadar },
  { title: "Novice → Expert matrix", sub: "A level for every skill, not one blunt grade", chart: MiniMatrix },
  { title: "Progress over time", sub: "Watch readiness climb as you learn", chart: MiniProgress },
  { title: "AI-scored projects", sub: "Every line of code reviewed and scored", chart: MiniProjects },
];

export default function ResultsClient() {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];

  const answers = decodeAnswers(searchParams.get("a"));

  // Live seat counter for the founding offer (public endpoint; hidden on failure)
  const [seats, setSeats] = useState<{ left: number; cap: number } | null>(null);
  useEffect(() => {
    fetch("/api/free-access/status")
      .then((r) => r.json())
      .then((d) => { if (d?.open && typeof d.remaining === "number") setSeats({ left: d.remaining, cap: d.cap ?? 100 }); })
      .catch(() => {});
  }, []);

  if (!subject || !seo || !answers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: NAVY_BG }}>
        <p className="text-lg text-slate-400 mb-4">Invalid or missing results.</p>
        <Link href={`/diagnostic/${slug || ""}`} className="text-sm font-semibold hover:underline" style={{ color: BLUE_SOFT }}>
          Take the skill check
        </Link>
      </div>
    );
  }

  const questions = getDiagnostic(slug);
  const result = scoreDiagnostic(questions, answers);
  const topicResults = getTopicResults(questions, answers);
  const bandIdx = getBandIndex(result.score);
  const band = READINESS_BANDS[bandIdx];

  const radarAxes = topicResults.map((t) => ({ label: t.topic, value: t.correct ? 1 : 0, max: 1 }));

  const origin = typeof window !== "undefined" ? window.location.origin : "https://square1-tutor.vercel.app";
  const shareUrl = `${origin}/diagnostic/${slug}/results?a=${encodeAnswers(answers)}`;
  const answersParam = encodeAnswers(answers);
  const readinessScore = ((result.score / result.total) * 10).toFixed(1);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const cellLabel = "text-[9px] tracking-[0.2em] uppercase font-bold" as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, #00183A 0%, ${NAVY_BG} 320px)` }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b" style={{ borderColor: HAIRLINE }}>
        <Link href="/"><Logo variant="light" size="md" /></Link>
        <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Sign in</Link>
      </header>

      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-[680px] mx-auto">

          {/* Title bar — canonical brand gradient */}
          <div className="rounded-t-2xl px-5 py-3.5" style={{ background: BRAND_GRADIENT }}>
            <h1 className="text-[11px] sm:text-xs tracking-[0.3em] uppercase font-black text-white/95">
              Your Square 1 AI Skill Scan
            </h1>
          </div>

          {/* Report card */}
          <div className="rounded-b-2xl border border-t-0 overflow-hidden" style={{ background: CARD, borderColor: HAIRLINE }}>

            {/* Meta row */}
            <div className="grid grid-cols-2 border-b" style={{ borderColor: HAIRLINE }}>
              <div className="px-5 py-3 border-r" style={{ borderColor: HAIRLINE }}>
                <span className={cellLabel} style={{ color: TEXT_DIM }}>Date</span>
                <p className="text-sm text-white font-semibold mt-0.5">{today}</p>
              </div>
              <div className="px-5 py-3">
                <span className={cellLabel} style={{ color: TEXT_DIM }}>Track</span>
                <p className="text-sm text-white font-semibold mt-0.5">{subject.title}</p>
              </div>
            </div>

            {/* Score + Readiness — one data colour */}
            <div className="grid grid-cols-2 border-b" style={{ borderColor: HAIRLINE }}>
              {[
                { label: "Score", big: `${result.score}`, small: `/${result.total}`, pct: result.score / result.total, sub: null as string | null },
                { label: "Readiness", big: readinessScore, small: "/10", pct: result.score / result.total, sub: band.label },
              ].map((ring, idx) => (
                <div key={ring.label} className={`flex flex-col items-center justify-center px-4 py-7 ${idx === 0 ? "border-r" : ""}`} style={{ borderColor: HAIRLINE }}>
                  <span className={`${cellLabel} mb-3`} style={{ color: TEXT_DIM }}>{ring.label}</span>
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(126,166,216,0.14)" strokeWidth="7" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={BLUE} strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={`${Math.max(ring.pct * 264, 6)} 264`}
                        style={{ filter: "drop-shadow(0 0 8px rgba(51,136,255,0.45))" }} />
                    </svg>
                    <div className="text-center">
                      <p className="text-3xl font-black text-white tabular-nums leading-none">
                        {ring.big}<span className="text-base" style={{ color: TEXT_DIM }}>{ring.small}</span>
                      </p>
                      {ring.sub && <p className="text-[10px] font-bold mt-1" style={{ color: BLUE_SOFT }}>{ring.sub}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Readiness meter — level = position, not hue */}
            <div className="px-5 py-3.5 border-b" style={{ background: CARD_ALT, borderColor: HAIRLINE }}>
              <div className="flex items-center gap-1">
                {READINESS_BANDS.map((b, i) => {
                  const reached = i <= bandIdx;
                  const active = i === bandIdx;
                  return (
                    <div key={b.label} className="flex flex-col items-center" style={{ flex: 1 }}>
                      <div className="w-full h-1.5 rounded-full transition-all"
                        style={{
                          background: reached ? `linear-gradient(90deg, ${BLUE}, ${BLUE_SOFT})` : "rgba(126,166,216,0.15)",
                          boxShadow: active ? "0 0 10px rgba(51,136,255,0.5)" : "none",
                        }} />
                      <span className="text-[8px] font-bold mt-1.5 tracking-wide"
                        style={{ color: active ? "#FFFFFF" : reached ? BLUE_SOFT : "#3D5578" }}>
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar + Assessment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b" style={{ borderColor: HAIRLINE }}>
              <div className="flex flex-col items-center justify-center px-4 py-6 sm:border-r" style={{ borderColor: HAIRLINE }}>
                <span className={`${cellLabel} mb-2`} style={{ color: TEXT_DIM }}>Topic Coverage</span>
                <DarkRadar axes={radarAxes} />
              </div>
              <div className="flex flex-col justify-center px-6 py-6">
                <span className={`${cellLabel} mb-3`} style={{ color: TEXT_DIM }}>Assessment</span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {ASPIRATIONAL[String(result.score)] ?? result.blurb}
                </p>
                <div className="mt-4 inline-flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: BRAND_GRADIENT }}>
                    {band.label}
                  </span>
                  <span className="text-[10px]" style={{ color: TEXT_DIM }}>{subject.role} track</span>
                </div>
              </div>
            </div>

            {/* Topic breakdown — neutral cards, status via icon only */}
            <div className="px-5 py-5 border-b" style={{ background: CARD_ALT, borderColor: HAIRLINE }}>
              <span className={cellLabel} style={{ color: TEXT_DIM }}>Topic Breakdown</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {topicResults.map((t, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5 border" style={{ background: CARD, borderColor: HAIRLINE }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ background: t.correct ? "#19A65F" : "#D93636" }}>
                        {t.correct ? "✓" : "✗"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-200 truncate">{t.topic}</span>
                    </div>
                    <p className="text-[9px] leading-snug line-clamp-2" style={{ color: TEXT_DIM }}>
                      {seo.topicRelevance[t.topic] ?? (t.correct ? "You've got this covered." : "Worth revisiting.")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="px-5 py-5">
              <span className={`${cellLabel} block mb-3`} style={{ color: TEXT_DIM }}>Share Your Results</span>
              <ShareResultButton
                percentage={Math.round((result.score / result.total) * 100)}
                level={result.level}
                courseTitle={subject.title}
                shareUrl={shareUrl}
                subject={slug}
                answersParam={answersParam}
                dark
              />
            </div>
          </div>

          {/* ── THE PRODUCT SHOWCASE — what the full report tracks ─────────── */}
          <div className="mt-6 rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: HAIRLINE }}>
            <div className="px-5 pt-5 pb-4 text-center">
              <p className={cellLabel} style={{ color: TEXT_DIM }}>This was the 60-second snapshot</p>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
                The full report tracks{" "}
                <span style={{ background: "linear-gradient(135deg, #7EB3FF, #3388FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  everything.
                </span>
              </h2>
              <p className="text-xs sm:text-sm mt-2 max-w-md mx-auto" style={{ color: TEXT_DIM }}>
                20 questions including real code, AI-graded — then every skill mapped, levelled, and tracked as you learn.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px px-4 pb-5 sm:px-5 sm:gap-3">
              {SHOWCASE.map((s) => (
                <div key={s.title} className="rounded-xl border p-3.5" style={{ background: CARD_ALT, borderColor: HAIRLINE }}>
                  <s.chart />
                  <p className="text-[11px] font-bold text-white mt-2">{s.title}</p>
                  <p className="text-[9px] leading-snug mt-0.5" style={{ color: TEXT_DIM }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── THE OFFER — 3 founding tiers + live seats ──────────────────── */}
          <div className="mt-6 rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: "rgba(51,136,255,0.3)" }}>
            <div className="px-5 pt-5 pb-1 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
                {seats ? `Free early access — ${seats.left} of ${seats.cap} seats left` : "Free during early access"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3 leading-tight">
                Start free. Lock your founding rate for life.
              </h2>
              <p className="text-xs mt-1.5" style={{ color: TEXT_DIM }}>
                Everything below is free today — these rates only apply when billing launches, and founding members keep them forever.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 sm:px-5 pt-4">
              {FOUNDING_PLANS.map((p) => (
                <div key={p.months} className="rounded-xl border p-3 text-center relative"
                  style={{
                    background: p.popular ? "rgba(51,136,255,0.10)" : CARD_ALT,
                    borderColor: p.popular ? "rgba(51,136,255,0.5)" : HAIRLINE,
                  }}>
                  {p.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase text-white whitespace-nowrap" style={{ background: BLUE }}>
                      Most popular
                    </span>
                  )}
                  <p className="text-[10px] font-bold mt-1" style={{ color: TEXT_DIM }}>{p.months}-month track</p>
                  <p className="text-lg sm:text-xl font-black text-white mt-1 tabular-nums">
                    {p.perMonth}<span className="text-[10px] font-semibold" style={{ color: TEXT_DIM }}>/mo</span>
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: TEXT_DIM }}>locked for life</p>
                </div>
              ))}
            </div>

            <div className="px-4 sm:px-5 py-5">
              <Link
                href={`/signup?subject=${slug}`}
                className="flex items-center justify-center gap-2 w-full px-5 py-4 rounded-full text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: BRAND_GRADIENT, boxShadow: "0 12px 32px rgba(0,86,206,0.4)" }}
              >
                Get your full skill report — free
                <span aria-hidden>→</span>
              </Link>
              <p className="text-[10px] mt-2.5 text-center" style={{ color: TEXT_DIM }}>
                Full assessment · personalised plan · all courses · no credit card
              </p>
            </div>
          </div>

          {/* Take yours */}
          <div className="mt-6 text-center space-y-2">
            <Link href={`/diagnostic/${slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-white" style={{ color: BLUE_SOFT }}>
              Take the {subject.title} skill check yourself →
            </Link>
            <br />
            <Link href="/diagnostic" className="text-[10px] transition-colors hover:text-slate-300" style={{ color: "#3D5578" }}>
              &larr; Try a different track
            </Link>
          </div>

          {/* Footer brand */}
          <div className="mt-8 pb-6 flex items-center justify-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black text-white" style={{ background: BRAND_GRADIENT }}>S1</div>
            <span className="text-[10px] font-semibold" style={{ color: TEXT_DIM }}>square1ai.com</span>
          </div>
        </div>
      </main>
    </div>
  );
}
