"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ShareResultButton } from "@/components/ShareResultButton";
import {
  getDiagnostic,
  getSubject,
  scoreDiagnostic,
  decodeAnswers,
  getTopicResults,
  encodeAnswers,
  SUBJECT_SEO,
} from "@/lib/diagnostic";

const READINESS_BANDS = [
  { label: "Novice", min: 0, max: 1, color: "#EF4444", glow: "rgba(239,68,68,0.3)" },
  { label: "Developing", min: 2, max: 2, color: "#F59E0B", glow: "rgba(245,158,11,0.3)" },
  { label: "Competent", min: 3, max: 3, color: "#0056CE", glow: "rgba(0,86,206,0.3)" },
  { label: "Proficient", min: 4, max: 4, color: "#10B981", glow: "rgba(16,185,129,0.3)" },
  { label: "Expert", min: 5, max: 5, color: "#8B5CF6", glow: "rgba(139,92,246,0.3)" },
];

function getBand(score: number) {
  return READINESS_BANDS.find((b) => score >= b.min && score <= b.max) ?? READINESS_BANDS[0];
}

const ASPIRATIONAL: Record<string, string> = {
  "0": "You've identified all five focus areas. Now you know exactly where to start.",
  "1": "One down, four to go. You've got a foundation to build on.",
  "2": "Solid start. You've got the basics — the gaps are exactly what the learning path targets.",
  "3": "Strong showing. Three out of five means you're past the fundamentals.",
  "4": "Impressive. You're close to proficient — one area to sharpen.",
  "5": "Outstanding. You nailed every topic. The full assessment will challenge you deeper.",
};

// Dark-themed radar chart inline (avoids prop-drilling dark mode to shared component)
function DarkRadar({ axes }: { axes: { label: string; value: number; max: number }[] }) {
  const N = axes.length;
  const CX = 150, CY = 150, R = 100;

  function point(i: number, r: number): [number, number] {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
  }

  function toPoints(pairs: [number, number][]): string {
    return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  }

  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints: [number, number][] = axes.map((a, i) => {
    const pct = a.max > 0 ? a.value / a.max : 0;
    return point(i, pct * R);
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[240px] mx-auto">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={toPoints(axes.map((_, i) => point(i, ring * R)))}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth="1"
          strokeDasharray={ring < 1 ? "3 3" : "none"}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />;
      })}
      <defs>
        <radialGradient id="darkRadarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <polygon
        points={toPoints(dataPoints)}
        fill="url(#darkRadarFill)"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#06B6D4" stroke="#0B1120" strokeWidth="2" />
      ))}
      {axes.map((a, i) => {
        const labelR = R + 28;
        const [lx, ly] = point(i, labelR);
        const anchor = lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
        return (
          <text
            key={i}
            x={lx} y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="9"
            fontFamily="system-ui, sans-serif"
            fill="#94A3B8"
            fontWeight={500}
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function ResultsClient() {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];

  const answers = decodeAnswers(searchParams.get("a"));

  if (!subject || !seo || !answers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0B1120" }}>
        <p className="text-lg text-slate-400 mb-4">Invalid or missing results.</p>
        <Link href={`/diagnostic/${slug || ""}`} className="text-sm font-semibold text-cyan-400 hover:underline">
          Take the skill check
        </Link>
      </div>
    );
  }

  const questions = getDiagnostic(slug);
  const result = scoreDiagnostic(questions, answers);
  const topicResults = getTopicResults(questions, answers);
  const band = getBand(result.score);

  const radarAxes = topicResults.map((t) => ({
    label: t.topic,
    value: t.correct ? 1 : 0,
    max: 1,
  }));

  const origin = typeof window !== "undefined" ? window.location.origin : "https://square1-tutor.vercel.app";
  const shareUrl = `${origin}/diagnostic/${slug}/results?a=${encodeAnswers(answers)}`;
  const answersParam = encodeAnswers(answers);
  const readinessScore = ((result.score / result.total) * 10).toFixed(1);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B1120" }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b" style={{ borderColor: "#1E293B" }}>
        <Link href="/"><Logo variant="light" size="md" /></Link>
        <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">Sign in</Link>
      </header>

      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-[640px] mx-auto">

          {/* Title bar */}
          <div className="rounded-t-xl px-5 py-3" style={{ background: "linear-gradient(135deg, #0056CE 0%, #06B6D4 100%)" }}>
            <h1 className="text-[11px] sm:text-xs tracking-[0.3em] uppercase font-black text-white/90">
              Your Square 1 AI Skill Scan
            </h1>
          </div>

          {/* Report card */}
          <div className="rounded-b-xl border border-t-0" style={{ background: "#111827", borderColor: "#1E293B" }}>

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-px" style={{ background: "#1E293B" }}>
              <div className="px-4 py-2.5" style={{ background: "#111827" }}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold">Date</span>
                <p className="text-sm text-slate-200 font-semibold mt-0.5">{today}</p>
              </div>
              <div className="px-4 py-2.5" style={{ background: "#111827" }}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold">Track</span>
                <p className="text-sm text-slate-200 font-semibold mt-0.5">{subject.icon} {subject.title}</p>
              </div>
            </div>

            {/* Score + Readiness row */}
            <div className="grid grid-cols-2 gap-px mt-px" style={{ background: "#1E293B" }}>
              {/* Score ring */}
              <div className="flex flex-col items-center justify-center px-4 py-6" style={{ background: "#111827" }}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold mb-3">Score</span>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="7" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#06B6D4" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${(result.score / result.total) * 264} 264`}
                      style={{ filter: "drop-shadow(0 0 8px rgba(6,182,212,0.4))" }} />
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-black text-white tabular-nums leading-none">
                      {result.score}<span className="text-base text-slate-500">/{result.total}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Readiness score */}
              <div className="flex flex-col items-center justify-center px-4 py-6" style={{ background: "#111827" }}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold mb-3">Readiness</span>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="7" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={band.color} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${(result.score / result.total) * 264} 264`}
                      style={{ filter: `drop-shadow(0 0 8px ${band.glow})` }} />
                  </svg>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white tabular-nums leading-none">
                      {readinessScore}<span className="text-xs text-slate-500">/10</span>
                    </p>
                    <p className="text-[9px] font-bold mt-1" style={{ color: band.color }}>{band.label}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Readiness band strip */}
            <div className="px-4 py-3 mt-px" style={{ background: "#0F172A" }}>
              <div className="flex items-center gap-0.5">
                {READINESS_BANDS.map((b) => {
                  const active = b.label === band.label;
                  return (
                    <div key={b.label} className="flex flex-col items-center" style={{ flex: 1 }}>
                      <div
                        className="w-full h-1.5 rounded-full transition-all"
                        style={{
                          background: active ? b.color : "rgba(148,163,184,0.15)",
                          boxShadow: active ? `0 0 10px ${b.glow}` : "none",
                        }}
                      />
                      <span
                        className="text-[8px] font-bold mt-1 tracking-wide"
                        style={{ color: active ? b.color : "#475569" }}
                      >
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar + Aspirational */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px mt-px" style={{ background: "#1E293B" }}>
              <div className="flex flex-col items-center justify-center px-4 py-5" style={{ background: "#111827" }}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold mb-2">Topic Coverage</span>
                <DarkRadar axes={radarAxes} />
              </div>
              <div className="flex flex-col justify-center px-5 py-5" style={{ background: "#111827" }}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold mb-3">Assessment</span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {ASPIRATIONAL[String(result.score)] ?? result.blurb}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold text-white" style={{ background: band.color }}>
                    {band.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{subject.role} track</span>
                </div>
              </div>
            </div>

            {/* Topic breakdown grid */}
            <div className="mt-px px-4 py-4" style={{ background: "#0F172A" }}>
              <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold">Topic Breakdown</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {topicResults.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-3 py-2.5 border"
                    style={{
                      background: t.correct ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                      borderColor: t.correct ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${t.correct ? "bg-emerald-500" : "bg-red-500"}`}>
                        {t.correct ? "✓" : "✗"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 truncate">{t.topic}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                      {seo.topicRelevance[t.topic] ?? (t.correct ? "You've got this covered." : "Worth revisiting.")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Share & download section */}
            <div className="mt-px px-4 py-5" style={{ background: "#111827" }}>
              <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 font-bold block mb-3">Share Your Results</span>
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

            {/* CTA */}
            <div className="mt-px px-4 py-5 rounded-b-xl" style={{ background: "#0F172A" }}>
              <p className="text-xs text-slate-400 mb-1 font-bold">This is the 60-second snapshot.</p>
              <p className="text-xs text-slate-500 mb-3">
                The <span className="font-bold text-slate-300">full free assessment</span> has 20 questions including code challenges, is AI-graded, and builds a personalised learning plan.
              </p>
              <Link
                href={`/signup?subject=${slug}`}
                className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-lg text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg, #0056CE 0%, #06B6D4 100%)", boxShadow: "0 8px 24px rgba(6,182,212,0.25)" }}
              >
                Get your full skill report &rarr;
              </Link>
              <p className="text-[10px] text-slate-600 mt-2 text-center">Free forever &middot; No credit card</p>
            </div>
          </div>

          {/* Take yours CTA */}
          <div className="mt-5 text-center space-y-2">
            <Link
              href={`/diagnostic/${slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {subject.icon} Take the {subject.title} skill check yourself
            </Link>
            <br />
            <Link href="/diagnostic" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
              &larr; Try a different track
            </Link>
          </div>

          {/* Footer brand */}
          <div className="mt-8 pb-6 flex items-center justify-center gap-2 opacity-40">
            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black text-white" style={{ background: "#0056CE" }}>S1</div>
            <span className="text-[10px] text-slate-500 font-semibold">square1ai.com</span>
          </div>
        </div>
      </main>
    </div>
  );
}
