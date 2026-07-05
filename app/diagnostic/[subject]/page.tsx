"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
  getDiagnostic,
  getSubject,
  SUBJECT_SEO,
  encodeAnswers,
  type DiagQuestion,
} from "@/lib/diagnostic";

export default function SubjectDiagnosticPage() {
  const params = useParams<{ subject: string }>();
  const router = useRouter();
  const slug = params.subject;
  const subject = getSubject(slug);
  const seo = SUBJECT_SEO[slug];

  const [questions, setQuestions] = useState<DiagQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (subject) setQuestions(getDiagnostic(slug));
  }, [slug, subject]);

  if (!subject || !seo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-lg text-slate-600 mb-4">Subject not found.</p>
        <Link href="/diagnostic" className="text-sm font-semibold text-blue-600 hover:underline">
          Browse all skill checks
        </Link>
      </div>
    );
  }

  const accent = subject.color;

  function answer(optIdx: number) {
    setPicked(optIdx);
    setTimeout(() => {
      const nextAnswers = [...answers, optIdx];
      setAnswers(nextAnswers);
      setPicked(null);
      if (qIdx + 1 < questions.length) {
        setQIdx(qIdx + 1);
      } else {
        router.push(`/diagnostic/${slug}/results?a=${encodeAnswers(nextAnswers)}`);
      }
    }, 220);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 50%,#F4F8FF 100%)" }}>
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-10">
        {!started ? (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Free &middot; 3 minutes &middot; No signup
            </span>
            <h1 className="mt-4 mb-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(28px,4.5vw,48px)" }}>
              {seo.h1}
            </h1>

            <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-4 mb-8">
              {seo.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <button
              onClick={() => setStarted(true)}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm sm:text-base hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)", boxShadow: "0 12px 32px rgba(0,86,206,0.32), 0 0 0 1px rgba(255,255,255,0.12) inset" }}
            >
              Start the {subject.title} skill check
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>

            {/* FAQ section */}
            <div className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently asked questions</h2>
              <div className="space-y-5">
                {seo.faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{faq.q}</h3>
                    <p className="text-sm text-slate-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* JSON-LD FAQPage */}
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
          </div>
        ) : (
          /* Quiz flow */
          <div key={qIdx} className="max-w-xl mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>
                {subject.title}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">Question {qIdx + 1} / {questions.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 mb-8 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(qIdx / questions.length) * 100}%`, background: accent }} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-6">
              {questions[qIdx]?.stem}
            </h2>

            <div className="space-y-3">
              {questions[qIdx]?.options.map((opt, i) => {
                const isPicked = picked === i;
                return (
                  <button
                    key={i}
                    onClick={() => picked === null && answer(i)}
                    disabled={picked !== null}
                    className="w-full text-left rounded-xl px-4 py-4 border-2 transition-all flex items-center gap-3 disabled:cursor-default hover:-translate-y-px"
                    style={{
                      borderColor: isPicked ? accent : "rgba(15,28,49,0.10)",
                      background: isPicked ? `${accent}10` : "#fff",
                    }}
                  >
                    <span className="w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ borderColor: isPicked ? accent : "rgba(15,28,49,0.15)", color: isPicked ? accent : "#64748B" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm sm:text-base font-medium text-slate-800">{opt}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-slate-500 mt-6">
              No wrong-answer shame — this is just to find your starting point.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
