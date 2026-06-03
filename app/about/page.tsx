import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ─── The 5-step ecosystem ─────────────────────────────────────────────────────
const ECOSYSTEM = [
  {
    n: "01", title: "Learning",
    desc: "AI-enhanced courses that adapt to your level. Theory meets practice from day one.",
    accent: "#3388FF",
  },
  {
    n: "02", title: "Practical Application",
    desc: "Real-world projects, coding challenges, and competitions — not toy apps. Every project ships live.",
    accent: "#6366F1",
  },
  {
    n: "03", title: "Certification",
    desc: "AI-verified skill reports and deployed portfolios that prove what you can do — not just what you studied.",
    accent: "#A78BFA",
  },
  {
    n: "04", title: "Career Enablement",
    desc: "Job-ready assessment scores, interview preparation, and direct pathways to employers who trust our graduates.",
    accent: "#8B5CF6",
  },
  {
    n: "05", title: "Startup Incubation",
    desc: "For builders who want to launch, not just land a job. Mentorship, investor access, and a community of founders.",
    accent: "#10B981",
  },
];

// ─── Why it matters — AI features ─────────────────────────────────────────────
const AI_FEATURES = [
  {
    title: "AI that grades your code",
    desc: "Not multiple choice. Claude AI reads every line of your code and tells you exactly what's wrong and how to fix it.",
    accent: "#3388FF",
  },
  {
    title: "AI that knows your level",
    desc: "The 30-minute assessment maps your skills topic by topic. Your learning plan starts where YOU are — not where a curriculum assumes.",
    accent: "#A78BFA",
  },
  {
    title: "AI that adapts in real time",
    desc: "Struggling with RAG systems? Your AI tutor adjusts. Breezing through APIs? It accelerates. Every session is personalised.",
    accent: "#10B981",
  },
  {
    title: "AI that proves you're ready",
    desc: "Your portfolio score, skill report, and 12 deployed projects tell employers everything they need to know — without a single interview question.",
    accent: "#F59E0B",
  },
];

export default function AboutPage() {
  return (
    <main className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-8 pb-24 sm:pb-32 lg:pb-40 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 100%)" }}
      >
        {/* Blobs */}
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
          <div className="flex justify-center mb-8">
            <Logo variant="light" size="xl" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
            style={{ background: "rgba(51,136,255,0.10)", borderColor: "rgba(51,136,255,0.30)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand">
              The World&apos;s First AI-Powered Learn-to-Launch Platform
            </span>
          </div>

          <h1 className="font-black tracking-tight text-white leading-[0.95] mb-8"
            style={{ fontSize: "clamp(36px, 7vw, 88px)", letterSpacing: "-0.03em" }}>
            Learn Your Way.
            <br />
            Build Real Skills.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Launch Your Future.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Education is still one-size-fits-all. We&apos;re changing that. Square1 Ai
            combines AI-powered assessment, personalised learning, and real-world
            project building into one platform — designed to take you from where you
            are to where you want to be.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* WHAT WE ARE — the vision */}
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
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              What We Are
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              Not a course.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                A career launch system.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                Traditional education gives you theory and hopes you figure out the rest.
                Bootcamps rush you through and hand you a certificate. YouTube gives you
                content but zero feedback.
              </p>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Square1 Ai is different.</span>{" "}
                We assess exactly where you are, build a plan around your life, grade every
                line of code you write with AI, and don&apos;t stop until you&apos;ve shipped
                12 real projects and landed the job — or launched the startup.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Personalised", desc: "Your path adapts to your level — beginner to advanced" },
                { label: "Project-based", desc: "12 deployed projects, not 12 certificates" },
                { label: "AI-graded", desc: "Every line of code reviewed by Claude AI" },
                { label: "Career-mapped", desc: "Every course leads to a real role with a real salary" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-[10px] font-black text-brand shrink-0 mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OUR MISSION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      >
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.20) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Our Mission
          </span>
          <h2 className="mt-4 mb-8 font-black tracking-tight text-white leading-[1.05]"
            style={{ fontSize: "clamp(28px, 4.5vw, 56px)" }}>
            Make world-class technical education{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              accessible to everyone.
            </span>
          </h2>
          <div className="space-y-6 text-base sm:text-lg text-slate-400 leading-relaxed">
            <p>
              The best engineers in the world didn&apos;t get there by watching videos.
              They got there by building things, getting feedback, and iterating. But until
              now, that kind of mentorship cost $15,000+ or required knowing the right people.
            </p>
            <p className="text-white font-semibold">
              We believe every person on earth should have access to a personal AI tutor that
              grades their code, a curriculum that adapts to their level, and a portfolio that
              proves they&apos;re ready — regardless of where they went to school or how much
              they can afford.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS — The 5-step ecosystem */}
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
              The Ecosystem
            </span>
            <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              Five pillars.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                One platform.
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Square1 Ai isn&apos;t just courses. It&apos;s a complete ecosystem — from learning to launching.
            </p>
          </div>

          {/* 5 pillars — alternating left/right with big numbers */}
          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {ECOSYSTEM.map((step, i) => (
              <div key={step.n} className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}>
                {/* Big number */}
                <div className={`lg:col-span-4 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  <span className="font-black tabular-nums leading-none select-none"
                    style={{
                      fontSize: "clamp(80px, 14vw, 180px)",
                      letterSpacing: "-0.06em",
                      background: `linear-gradient(180deg, ${step.accent} 0%, ${step.accent}55 100%)`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      filter: `drop-shadow(0 0 24px ${step.accent}30)`,
                    }}>
                    {step.n}
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.35em] uppercase"
                      style={{ color: step.accent }}>{step.title}</span>
                    <span className="h-px flex-1 max-w-[80px] bg-slate-200" />
                  </div>
                </div>
                {/* Content */}
                <div className={`lg:col-span-8 ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm lg:text-base text-slate-600 leading-relaxed max-w-lg">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* WHY IT MATTERS — AI features */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 50%, #050B14 100%)" }}
      >
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Why It Matters
            </span>
            <h2 className="mt-4 font-black tracking-tight text-white leading-[0.95]"
              style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
              AI isn&apos;t a feature.{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                It&apos;s the foundation.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
            {AI_FEATURES.map((f) => (
              <div key={f.title}
                className="rounded-3xl p-6 lg:p-8 border overflow-hidden relative"
                style={{
                  background: `linear-gradient(135deg, ${f.accent}12 0%, rgba(255,255,255,0.02) 100%)`,
                  borderColor: `${f.accent}25`,
                  boxShadow: `0 8px 32px ${f.accent}10`,
                }}>
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-40"
                  style={{ background: `radial-gradient(circle, ${f.accent}30 0%, transparent 70%)`, filter: "blur(16px)" }} />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.accent}20`, border: `1px solid ${f.accent}30` }}>
                    <span className="text-sm font-black" style={{ color: f.accent }}>AI</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OUR PROMISE */}
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
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Our Promise
          </span>
          <h2 className="mt-4 mb-8 font-black tracking-tight text-slate-900 leading-[1.05]"
            style={{ fontSize: "clamp(28px, 4.5vw, 56px)" }}>
            We don&apos;t stop until{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              you&apos;re hired.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto">
            Every feature we build, every course we design, every AI model we tune —
            exists for one reason: to get you from where you are today to a real career
            in tech. Not someday. Not maybe.{" "}
            <span className="font-bold text-slate-900">In 3 to 9 months.</span>
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
