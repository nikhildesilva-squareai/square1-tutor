import Link from "next/link";

// ─── "Sound familiar?" — the pain mirror ──────────────────────────────────────
//
// Built from the 2026-08 audience research (docs/research/audience-pain-points-
// 2026-08.md): across every audience the deepest pain is PROVING, not learning.
// This section reflects the visitor's situation back in their own inner
// monologue, backs each line with a REAL cited statistic (never invented — the
// honesty rule that governs the whole landing), then turns: proof is the thing
// Square 1 is built around.
//
// The pain lines are OUR phrasing of themes that recur across forums — they are
// deliberately NOT styled as user quotes/testimonials, which we don't fabricate.

const PAINS = [
  {
    line: "A year of tutorials — and still not job-ready.",
    stat: "2.5%",
    fact: "of AI-engineer job postings are open to candidates with 0–2 years' experience.",
    source: "Glassdoor postings analysis, 365DataScience",
    href: "https://365datascience.com/career-advice/career-guides/ai-engineer-job-outlook-2025/",
  },
  {
    line: "“Entry-level” security roles asking for five years' experience.",
    stat: "34%",
    fact: "of entry-level cybersecurity postings require CISSP — a certification that itself takes ~5 years.",
    source: "ISC2 Cybersecurity Hiring Trends",
    href: "https://www.isc2.org/Insights/2025/06/cybersecurity-hiring-trends-study",
  },
  {
    line: "Told to “use AI at work.” Never actually shown how.",
    stat: "71%",
    fact: "of workers received no AI training from their employer in the past year.",
    source: "Dayforce Pulse of Talent",
    href: "https://stocktitan.net/news/DAY/16th-annual-dayforce-pulse-of-talent-71-of-workers-untrained-in-ai-wgasv2mdhodo.html",
  },
  {
    line: "Using AI every day — and hiding it, because you can't prove it's any good.",
    stat: "57%",
    fact: "of workers hide their AI use from managers and colleagues.",
    source: "KPMG & Univ. of Melbourne, 48,000 workers",
    href: "https://kpmg.com/xx/en/media/press-releases/2025/04/trust-of-ai-remains-a-critical-challenge.html",
  },
];

export function PainMirror() {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24" style={{ background: "linear-gradient(180deg,#FFFFFF, #F8FAFC 55%, #FFFFFF)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Sound familiar?</span>
          <h2 className="mt-3 font-black tracking-tight text-slate-900 leading-[1.05]" style={{ fontSize: "clamp(28px, 4.6vw, 48px)", letterSpacing: "-0.02em" }}>
            It&apos;s not you. <span className="text-slate-400">The door got narrower.</span>
          </h2>
        </div>

        {/* The four pains, each with its receipt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {PAINS.map((p) => (
            <div key={p.stat} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col gap-4"
              style={{ boxShadow: "0 1px 2px rgba(15,28,49,0.04)" }}>
              <p className="text-[17px] sm:text-lg font-extrabold text-slate-900 leading-snug tracking-[-0.015em]">
                {p.line}
              </p>
              <div className="mt-auto flex items-start gap-3 rounded-xl px-3.5 py-3" style={{ background: "rgba(217,54,54,0.05)", border: "1px solid rgba(217,54,54,0.15)" }}>
                <span className="text-2xl sm:text-[26px] font-black tabular-nums leading-none" style={{ color: "#D93636" }}>{p.stat}</span>
                <span className="text-[12.5px] leading-snug text-slate-600">
                  {p.fact}{" "}
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-600 whitespace-nowrap">
                    {p.source}
                  </a>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* The turn */}
        <div className="mt-6 sm:mt-8 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg,#050B14,#0B1626)" }}>
          <div className="px-6 py-8 sm:px-10 sm:py-10 text-center">
            <h3 className="font-black text-white tracking-tight leading-[1.08]" style={{ fontSize: "clamp(24px, 3.6vw, 38px)", letterSpacing: "-0.02em" }}>
              The hard part isn&apos;t learning.{" "}
              <span style={{ background: "linear-gradient(90deg,#3388FF,#9CC5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                It&apos;s proving.
              </span>
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              That&apos;s why every Square 1 track ends in proof — real projects graded against real rubrics,
              in public repos an employer can open, behind a certificate anyone can verify.
            </p>
            <Link
              href="/diagnostic"
              className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl text-white text-[15px] font-bold transition-transform motion-safe:hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 14px 30px -12px rgba(0,86,206,0.55)" }}
            >
              Find out where you stand — free, 3 minutes
            </Link>
            <p className="mt-2.5 text-[11px] text-slate-500">No account to start · real skill report at the end</p>
          </div>
        </div>
      </div>
    </section>
  );
}
