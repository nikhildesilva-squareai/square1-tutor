import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ─── Stats for the "by the numbers" row ───────────────────────────────────────
const STATS = [
  { value: "12",   label: "career paths" },
  { value: "120+", label: "lessons built" },
  { value: "100+", label: "projects designed" },
  { value: "$0",   label: "cost to start" },
];

// ─── The problem we're solving ────────────────────────────────────────────────
const PROBLEMS = [
  {
    old: "Watch 40 hours of video",
    new: "45 minutes of focused, AI-guided learning per day",
    accent: "#EF4444",
  },
  {
    old: "Build a to-do app nobody cares about",
    new: "Ship 12 real projects employers can actually run",
    accent: "#F59E0B",
  },
  {
    old: "Zero feedback on your code",
    new: "Every line graded by Claude with specific fixes",
    accent: "#3388FF",
  },
  {
    old: "A certificate PDF nobody trusts",
    new: "A GitHub portfolio with 12 live, verifiable repos",
    accent: "#10B981",
  },
];

// ─── Principles ───────────────────────────────────────────────────────────────
const PRINCIPLES = [
  {
    n: "01",
    title: "Proof over promises",
    desc: "We don't tell you you're ready. We show you — with 12 deployed projects, an AI-graded portfolio score, and a skill report that maps every topic.",
    accent: "#3388FF",
  },
  {
    n: "02",
    title: "Feedback over content",
    desc: "Content is free on YouTube. What's missing is personalised, instant feedback on YOUR actual code. That's our core product — not videos.",
    accent: "#A78BFA",
  },
  {
    n: "03",
    title: "Outcomes over theory",
    desc: "Every course maps to a real job title with a real salary range. AI Engineer. Cybersecurity Engineer. Data Scientist. The curriculum exists to get you hired.",
    accent: "#10B981",
  },
];

export default function AboutPage() {
  return (
    <main className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO — dark, matches landing page hero */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-8 pb-24 sm:pb-32 lg:pb-40 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 100%)" }}
      >
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* Nav */}
        <nav className="relative z-30 max-w-6xl mx-auto flex items-center justify-between mb-20 sm:mb-28">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors" style={{ minHeight: "unset" }}>
            <span>←</span> <Logo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors" style={{ minHeight: "unset" }}>
              Sign In
            </Link>
            <Link href="/signup"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-wide uppercase hover:opacity-80 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", minHeight: "unset" }}>
              Get Started <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
            style={{ background: "rgba(51,136,255,0.10)", borderColor: "rgba(51,136,255,0.30)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand">
              About Square1 Ai
            </span>
          </div>

          <h1 className="font-black tracking-tight text-white leading-[0.95] mb-6"
            style={{ fontSize: "clamp(40px, 7vw, 96px)", letterSpacing: "-0.03em" }}>
            We&apos;re{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              revolutionising
            </span>
            <br />
            technical education.
          </h1>

          <p className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            The old model is broken — $15,000 bootcamps, certificate mills, and 40-hour video courses that leave you with theory and no proof. We built something better.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MISSION — white section matching the landing page zones */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 20% 25%, rgba(0,86,206,0.08), transparent 60%),
            radial-gradient(ellipse 800px 500px at 80% 75%, rgba(167,139,250,0.07), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Our Mission
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              Education that{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                actually works.
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Assess your level in 30 minutes. Get a personalised learning plan.
              Build 12 real, deployed projects. Land the job. That&apos;s it.
              No fluff. No theory marathons. Just signal.
            </p>
          </div>

          {/* The problem → our fix (animated comparison rows) */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                {/* Old way */}
                <div className="rounded-xl p-4 bg-slate-50 border border-slate-100 text-center sm:text-right">
                  <p className="text-sm text-slate-400 line-through decoration-1">{p.old}</p>
                </div>
                {/* Arrow */}
                <div className="hidden sm:flex items-center justify-center">
                  <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                    <path d="M2 8h26M22 2l6 6-6 6" stroke={p.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* New way */}
                <div className="rounded-xl p-4 border text-center sm:text-left"
                  style={{ background: `${p.accent}08`, borderColor: `${p.accent}20` }}>
                  <p className="text-sm font-semibold text-slate-800">{p.new}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BY THE NUMBERS — dark strip with count-up style stats */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#050B14" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-black tabular-nums text-white leading-none"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.04em" }}>
                {s.value}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-2 font-medium uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PRINCIPLES — white gradient, numbered like landing page Zone 2 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 80% 20%, rgba(167,139,250,0.07), transparent 60%),
            radial-gradient(ellipse 800px 500px at 20% 80%, rgba(16,185,129,0.06), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              What We Believe
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              Three principles.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Zero compromise.
              </span>
            </h2>
          </div>

          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {PRINCIPLES.map((p, i) => (
              <div key={p.n} className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}>
                {/* Big number */}
                <div className={`lg:col-span-4 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  <span className="font-black tabular-nums leading-none select-none"
                    style={{
                      fontSize: "clamp(80px, 14vw, 180px)",
                      letterSpacing: "-0.06em",
                      background: `linear-gradient(180deg, ${p.accent} 0%, ${p.accent}55 100%)`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      filter: `drop-shadow(0 0 24px ${p.accent}30)`,
                    }}>
                    {p.n}
                  </span>
                </div>
                {/* Content */}
                <div className={`lg:col-span-8 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight mb-3">
                    {p.title}
                  </h3>
                  <p className="text-sm lg:text-base text-slate-600 leading-relaxed max-w-lg">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ORIGIN STORY — dark section */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      >
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.20) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Our Story
          </span>
          <h2 className="mt-4 mb-8 font-black tracking-tight text-white leading-[1.05]"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
            Built by engineers who were{" "}
            <span style={{
              background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              frustrated.
            </span>
          </h2>
          <div className="space-y-6 text-base sm:text-lg text-slate-400 leading-relaxed">
            <p>
              We paid $15,000 for a bootcamp that taught us to build a to-do app.
              We watched 200 hours of YouTube tutorials and still couldn&apos;t pass a
              technical interview. We graduated university with a degree and zero
              deployed projects.
            </p>
            <p>
              So we built what we wished existed:{" "}
              <span className="text-white font-semibold">
                a platform that assesses exactly where you are, builds a plan around your life,
                grades every line of code you write, and doesn&apos;t stop until you&apos;re hired.
              </span>
            </p>
            <p>
              That&apos;s Square1 Ai. Not a course. Not a bootcamp.{" "}
              <span className="text-white font-semibold">A career launch system.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CLOSING CTA — white gradient */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 50%, rgba(0,86,206,0.08), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-black tracking-tight text-slate-900 leading-[0.95] mb-5"
            style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
            Ready to find out{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              where you stand?
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-10">
            30 minutes. Free forever. No credit card.
            Take the assessment and see your full skill report.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base lg:text-lg font-bold text-white overflow-hidden transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)",
                boxShadow: "0 16px 48px rgba(220,38,38,0.35)",
              }}
            >
              <span className="relative z-10">Take the assessment</span>
              <span className="relative z-10 text-xl transition-transform group-hover:translate-x-2">→</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-5 rounded-2xl text-slate-700 text-base font-semibold transition-all hover:bg-slate-50"
              style={{ border: "1px solid rgba(15,23,42,0.10)" }}
            >
              Get in touch
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            Or email us at{" "}
            <a href="mailto:hello@square1.ai" className="text-brand hover:underline font-semibold">hello@square1.ai</a>
          </p>
        </div>
      </section>
    </main>
  );
}
