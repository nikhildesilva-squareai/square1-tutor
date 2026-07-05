import { ChevronDown } from "lucide-react";
import { FOUNDING_PLANS } from "@/lib/founding";

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ — answers the objections that stall signups, and doubles as an SEO
// surface (FAQPage structured data). Native <details>/<summary> — no JS,
// keyboard-accessible by default.
//
// Every answer states verifiable product facts only. No invented policies.
// ═══════════════════════════════════════════════════════════════════════════════

function buildFaqs(courseCount: number) {
  return [
    {
      q: "What's the difference between the skill check and the full assessment?",
      a: "The skill check is 5 quick questions, takes about 3 minutes, and needs no account — you get an instant skill snapshot. The full assessment is 20 questions across multiple choice, short answer, and real code; Claude AI grades it in about 30 minutes and builds your personalised learning plan. Both are free.",
    },
    {
      q: "Is Square 1 really free right now?",
      a: `Yes. Cohort 01 early access is free with no credit card required. When paid plans open, founding rates are ${FOUNDING_PLANS.map((p) => `${p.perMonth}/mo on the ${p.months}-month track`).join(", ")} — and founding members lock their rate for life. It never goes up on you.`,
    },
    {
      q: "How does the AI code review actually work?",
      a: "Every project you submit is read line-by-line by Claude against the project brief and a marking rubric. You get a score out of 100, what you did well, and specific fixes — not a generic tip or a video to rewatch.",
    },
    {
      q: "How much time do I need?",
      a: "About 45 minutes a day. Tracks are self-paced and typically run 3 to 9 months depending on the plan you choose and where the assessment places you.",
    },
    {
      q: "Do I need coding experience to start?",
      a: "No. The assessment finds your level first, and the curriculum adapts from complete beginner through to advanced — you start where you actually are, not where a syllabus assumes.",
    },
    {
      q: "What do I actually walk away with?",
      a: "10+ real projects deployed to GitHub with live URLs, a verified skill report, and a portfolio an employer can open, run, and check — proof, not a certificate PDF.",
    },
    {
      q: "Which subject should I pick?",
      a: `There are ${courseCount} subjects, and each maps to a real role with a real salary range — AI Engineer, ML Engineer, Data Scientist, Security Engineer, and more. If you're unsure, the free 3-minute skill check recommends a starting track.`,
    },
    {
      q: "Is this a bootcamp or a video course?",
      a: "Neither. It's 100% code and zero videos — you learn by building, every line you write gets AI feedback, and Nova (your AI tutor) knows your code, your weak topics, and your current lesson.",
    },
  ];
}

export function FAQSection({ courseCount = 9 }: { courseCount?: number }) {
  const faqs = buildFaqs(courseCount);

  return (
    <section id="faq" className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="relative max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            FAQ
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.98]"
            style={{ fontSize: "clamp(28px, 4.5vw, 52px)" }}>
            Questions, answered{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              straight.
            </span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white open:border-brand/30 open:shadow-[0_8px_32px_rgba(0,86,206,0.08)] transition-all">
              <summary className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-sm sm:text-base font-bold text-slate-900">{f.q}</span>
                <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-5 sm:px-6 pb-5 text-sm text-slate-600 leading-relaxed max-w-2xl">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* FAQPage structured data — mirrors the visible content exactly */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
