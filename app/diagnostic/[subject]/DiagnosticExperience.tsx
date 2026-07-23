"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getDiagnostic, encodeAnswers, type DiagQuestion } from "@/lib/diagnostic";
import { DiagnosticEvent } from "@/components/DiagnosticEvent";

interface Mod { title: string; lessons: number }
interface Props {
  slug: string;
  subject: { title: string; role: string; color: string };
  seo: {
    h1: string;
    description: string;
    body: string;
    faqs: { q: string; a: string }[];
    topicRelevance: Record<string, string>;
  };
  modules: Mod[];
  totalProjects: number;
}

const BRAND = "#0056CE";
const TINT = "#ECF8FE";

export function DiagnosticExperience({ slug, subject, seo, modules, totalProjects }: Props) {
  const router = useRouter();
  const questions = useMemo<DiagQuestion[]>(() => getDiagnostic(slug), [slug]);

  const [started, setStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);

  // Fast path: internal traffic (picker cards, course modals) arrives with
  // ?start=1 and goes straight into question 1 — the landing-page version of
  // this route exists for ORGANIC search arrivals, not visitors the homepage
  // already convinced. useEffect (not initial state) so SSR/CSR markup match.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("start") === "1") setStarted(true);
    } catch { /* ignore */ }
  }, []);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  // The five areas this check covers — unique question topics + why each matters.
  const areas = useMemo(() => {
    const seen = new Set<string>();
    const out: { topic: string; why: string }[] = [];
    for (const q of questions) {
      if (!seen.has(q.topic)) {
        seen.add(q.topic);
        out.push({ topic: q.topic, why: seo.topicRelevance[q.topic] ?? "" });
      }
    }
    return out;
  }, [questions, seo.topicRelevance]);

  const accent = subject.color;

  function start() {
    setStarted(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function answer(optIdx: number) {
    setPicked(optIdx);
    setTimeout(() => {
      const next = [...answers, optIdx];
      setAnswers(next);
      setPicked(null);
      if (qIdx + 1 < questions.length) setQIdx(qIdx + 1);
      else router.push(`/diagnostic/${slug}/results?a=${encodeAnswers(next)}`);
    }, 220);
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  if (started) {
    return (
      <main className="flex-1 px-4 py-10 sm:px-6" style={{ background: "linear-gradient(180deg,#F8FAFC,#fff)" }}>
        {/* Fires once when the quiz mounts — the TRUE top of the quiz funnel
            (the page-level "started" event is just a page view). */}
        <DiagnosticEvent event="quiz_started" subject={slug} />
        <div key={qIdx} className="mx-auto max-w-xl animate-fade-in-up">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>{subject.title}</span>
            <span className="tabular-nums text-xs text-slate-500">Question {qIdx + 1} / {questions.length}</span>
          </div>
          <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(qIdx / questions.length) * 100}%`, background: accent }} />
          </div>

          <h2 className="mb-6 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{questions[qIdx]?.stem}</h2>

          <div className="space-y-3">
            {questions[qIdx]?.options.map((opt, i) => {
              const isPicked = picked === i;
              return (
                <button
                  key={i}
                  onClick={() => picked === null && answer(i)}
                  disabled={picked !== null}
                  className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all hover:-translate-y-px disabled:cursor-default"
                  style={{ borderColor: isPicked ? accent : "rgba(15,28,49,0.10)", background: isPicked ? `${accent}10` : "#fff" }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold" style={{ borderColor: isPicked ? accent : "rgba(15,28,49,0.15)", color: isPicked ? accent : "#64748B" }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium text-slate-800 sm:text-base">{opt}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-500">No wrong-answer shame — this is just to find your starting point.</p>
        </div>
      </main>
    );
  }

  // ── Landing ──────────────────────────────────────────────────────────────
  const OUTCOMES = [
    { t: "A working project, graded", d: "Build a real project and get an AI review against a professional rubric." },
    { t: "A verified skill profile", d: "See exactly where you stand across the competencies employers test for." },
    { t: "Production-grade patterns", d: "Learn the patterns teams actually ship — not toy demos." },
    { t: "A portfolio you can share", d: "Completed projects live in a public portfolio you can send to employers." },
    { t: "A certificate on completion", d: "Earn a shareable certificate when you finish the track." },
  ];
  const VALUE = [
    { t: `${subject.role} is a role worth aiming for`, d: `This platform is built to get you into roles like ${subject.role} — this quick check is step zero.` },
    { t: "Your result is a roadmap", d: "You get an instant snapshot of your strengths and the exact gaps to close next." },
    { t: "Built for career changers", d: "No account, no code, no pressure — just an honest read on where you're starting from." },
  ];

  return (
    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-4 pb-4 pt-2 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl px-6 py-8 sm:px-9 sm:py-9" style={{ background: BRAND }}>
          {/* Watermark */}
          <span aria-hidden className="pointer-events-none absolute -bottom-12 -right-6 select-none text-[200px] font-black leading-none text-white/[0.06] sm:text-[260px]">S1</span>

          <div className="relative grid items-center gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8CCFF]">Free · 3 minutes · No signup</span>
              <h1 className="mt-2.5 text-[24px] font-bold leading-[1.12] text-white sm:text-[30px]">{seo.h1}</h1>
              <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-white/85 sm:text-sm">{seo.description}</p>
              <div className="mt-5 flex flex-col items-start gap-2">
                <button
                  onClick={start}
                  className="group inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0056CE] shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Start the {subject.title} skill check
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <span className="text-xs text-white/75">Instant results. No account needed.</span>
              </div>
            </div>

            {/* Right — what this check covers */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_12px_24px_-6px_rgba(1,34,79,0.35)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">What this check covers</p>
              <ul className="mt-3 space-y-2.5">
                {areas.map((a, i) => (
                  <li key={a.topic} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: TINT, color: BRAND }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-slate-900">{a.topic}</p>
                      {a.why && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{a.why}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value strip ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUE.map((v) => (
            <div key={v.t} className="rounded-xl border border-[#E8EEF5] bg-white p-4 shadow-[0_1px_2px_rgba(21,47,84,0.04)]">
              <h3 className="text-[15px] font-bold leading-snug text-slate-900">{v.t}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The course ───────────────────────────────────────────────────── */}
      {modules.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: BRAND }}>The course</p>
          <h2 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">What you&apos;ll learn</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-500">
            {modules.length} modules · {modules.reduce((s, m) => s + m.lessons, 0)} lessons{totalProjects ? ` · ${totalProjects} hands-on projects` : ""}. Your placement result maps straight onto this path.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <div key={i} className="group flex flex-col overflow-hidden rounded-xl border border-[#D8E2ED] bg-white transition-all hover:-translate-y-0.5 hover:border-[#0056CE]/40 hover:shadow-[0_10px_22px_-12px_rgba(21,47,84,0.18)]">
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 55%, #000))` }} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Module {i + 1}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: TINT, color: BRAND }}>
                      {m.lessons} {m.lessons === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-[17px] font-bold leading-snug text-slate-900">{m.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Outcomes ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="grid gap-6 rounded-2xl bg-[#F8FAFC] p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: BRAND }}>Outcomes</p>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">What you walk away with</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
              The skill check is just the on-ramp. Finish the track and you leave with proof, not just knowledge.
            </p>
          </div>
          <ul className="space-y-4">
            {OUTCOMES.map((o) => (
              <li key={o.t} className="flex gap-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E6F6EE] text-[#19A65F]">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">{o.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{o.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ (kept for SEO) ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h2 className="text-xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {seo.faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{faq.a}</p>
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: seo.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            }),
          }}
        />
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="px-4 pb-12 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 rounded-2xl px-6 py-8 sm:flex-row sm:items-center sm:px-10" style={{ background: BRAND }}>
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Three minutes. Five questions.</h2>
            <p className="mt-1.5 text-sm text-white/85">Find your starting point as {subject.role.startsWith("A") || subject.role.startsWith("E") ? "an" : "a"} {subject.role} — instantly, no signup.</p>
          </div>
          <button
            onClick={start}
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0056CE] shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Start the skill check
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>
    </main>
  );
}
