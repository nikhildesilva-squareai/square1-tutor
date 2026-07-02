"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { RadarChart } from "@/components/RadarChart";
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
  { label: "Novice", min: 0, max: 1, color: "#D93636", bg: "rgba(217,54,54,0.08)" },
  { label: "Developing", min: 2, max: 2, color: "#E5B217", bg: "rgba(229,178,23,0.08)" },
  { label: "Competent", min: 3, max: 3, color: "#0056CE", bg: "rgba(0,86,206,0.08)" },
  { label: "Proficient", min: 4, max: 4, color: "#19A65F", bg: "rgba(25,166,95,0.08)" },
  { label: "Expert", min: 5, max: 5, color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
];

function getBand(score: number) {
  return READINESS_BANDS.find((b) => score >= b.min && score <= b.max) ?? READINESS_BANDS[0];
}

const ASPIRATIONAL: Record<string, string> = {
  "0": "You've identified all five focus areas — that's the hardest part. Now you know exactly where to start.",
  "1": "One down, four to go. You've got a foundation to build on — the full assessment will map your path.",
  "2": "Solid start. You've got the basics — the gaps you've found are exactly what the learning path targets.",
  "3": "Strong showing. Three out of five means you're past the fundamentals — time to close the remaining gaps.",
  "4": "Impressive. You're close to proficient — one area to sharpen and you're there.",
  "5": "Outstanding. You nailed every topic. The full assessment will challenge you at a deeper level.",
};

export default function ResultsClient() {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];

  const answers = decodeAnswers(searchParams.get("a"));

  if (!subject || !seo || !answers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-lg text-slate-600 mb-4">Invalid or missing results.</p>
        <Link href={`/diagnostic/${slug || ""}`} className="text-sm font-semibold text-blue-600 hover:underline">
          Take the skill check
        </Link>
      </div>
    );
  }

  const questions = getDiagnostic(slug);
  const result = scoreDiagnostic(questions, answers);
  const topicResults = getTopicResults(questions, answers);
  const band = getBand(result.score);
  const accent = subject.color;

  const radarAxes = topicResults.map((t) => ({
    label: t.topic,
    value: t.correct ? 1 : 0,
    max: 1,
  }));

  const origin = typeof window !== "undefined" ? window.location.origin : "https://square1-tutor.vercel.app";
  const shareUrl = `${origin}/diagnostic/${slug}/results?a=${encodeAnswers(answers)}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 50%,#F4F8FF 100%)" }}>
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto animate-fade-in-up">
          <span className="text-[10px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Your {subject.title} skill snapshot
          </span>

          {/* Score ring */}
          <div className="my-6 flex flex-col items-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(15,28,49,0.08)" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(result.score / result.total) * 276} 276`} />
              </svg>
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">
                  {result.score}<span className="text-lg text-slate-500">/{result.total}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Readiness band */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-1 mb-3">
              {READINESS_BANDS.map((b) => {
                const active = b.label === band.label;
                return (
                  <div
                    key={b.label}
                    className="flex flex-col items-center"
                    style={{ flex: 1, maxWidth: 100 }}
                  >
                    <div
                      className="w-full h-2 rounded-full transition-all"
                      style={{
                        background: active ? b.color : "#E8EEF5",
                        boxShadow: active ? `0 2px 8px ${b.color}40` : "none",
                      }}
                    />
                    <span
                      className="text-[9px] sm:text-[10px] font-bold mt-1.5 tracking-wide"
                      style={{ color: active ? b.color : "#94A3B8" }}
                    >
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-center">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white"
                style={{ background: band.color }}
              >
                {band.label} &middot; {subject.role} track
              </span>
            </p>
          </div>

          {/* Aspirational blurb */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-center mb-8 max-w-md mx-auto">
            {ASPIRATIONAL[String(result.score)] ?? result.blurb}
          </p>

          {/* Radar chart */}
          <div className="rounded-2xl border border-slate-200 p-5 sm:p-6 bg-white shadow-sm mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Topic coverage</h3>
            <p className="text-xs text-slate-500 mb-3">How you performed across the five areas</p>
            <RadarChart axes={radarAxes} />
          </div>

          {/* Topic breakdown */}
          <div className="rounded-2xl border border-slate-200 p-5 sm:p-6 bg-white shadow-sm mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Topic-by-topic breakdown</h3>
            <div className="space-y-3">
              {topicResults.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${t.correct ? "bg-green-500" : "bg-red-500"}`}>
                    {t.correct ? "✓" : "✗"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.topic}</p>
                    <p className="text-xs text-slate-500">
                      {seo.topicRelevance[t.topic] ?? (t.correct ? "You've got this covered." : "Worth revisiting.")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="mb-8">
            <ShareResultButton
              percentage={Math.round((result.score / result.total) * 100)}
              level={result.level}
              courseTitle={subject.title}
              shareUrl={shareUrl}
            />
          </div>

          {/* Full assessment CTA */}
          <div className="rounded-2xl p-6 border" style={{ borderColor: `${accent}25`, background: `${accent}08` }}>
            <p className="text-sm text-slate-700 mb-2 font-bold">This is the 60-second snapshot.</p>
            <p className="text-sm text-slate-600 mb-4">
              The <span className="font-bold text-slate-900">full free assessment</span> has 20 questions including code challenges, is AI-graded, and builds a personalised learning plan to <span className="font-bold" style={{ color: accent }}>{subject.role}</span>.
            </p>
            <Link
              href={`/signup?subject=${slug}`}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-white font-bold text-sm sm:text-base hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 100%)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}
            >
              Get your full skill report &rarr;
            </Link>
            <p className="text-[11px] text-slate-500 mt-3 text-center">Free forever &middot; No credit card</p>
          </div>

          {/* Take yours CTA (for people arriving via shared link) */}
          <div className="mt-6 text-center space-y-3">
            <Link
              href={`/diagnostic/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              style={{ color: accent }}
            >
              {subject.icon} Take the {subject.title} skill check yourself
            </Link>
            <br />
            <Link href="/diagnostic" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              &larr; Try a different track
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
