import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ background: "#050B14" }}>
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 pt-8">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-white transition-colors"
          style={{ minHeight: "unset" }}
        >
          &larr; Home
        </Link>
      </div>

      {/* Logo */}
      <div className="flex justify-center pt-16 sm:pt-20">
        <Logo variant="light" size="xl" />
      </div>

      {/* Headline */}
      <div className="text-center max-w-3xl mx-auto px-6 sm:px-8 mt-12">
        <h1
          className="font-black tracking-tight text-white leading-[1.05] mb-6"
          style={{ fontSize: "clamp(36px, 6vw, 68px)", letterSpacing: "-0.03em" }}
        >
          We&apos;re{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Square1 Ai.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 leading-relaxed">
          The world&apos;s first AI-powered learn-to-launch platform.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-4">
          Our Mission
        </h2>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Our mission is to replace outdated education with a system that works: assess your
          skills, build a personalised plan, grade every line of your code, and get you hired.
        </p>
      </div>

      {/* Values */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-8 text-center">
          Our Values
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: "Proof over promises",
              desc: "12 deployed projects. Not a certificate PDF.",
              accent: "#3388FF",
            },
            {
              title: "Feedback over lectures",
              desc: "AI grades YOUR code. Not a multiple choice quiz.",
              accent: "#A78BFA",
            },
            {
              title: "Outcomes over theory",
              desc: "Every course maps to a real job with a real salary.",
              accent: "#10B981",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-2xl p-6 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${v.accent}15`, border: `1px solid ${v.accent}30` }}
              >
                <span className="text-sm font-black" style={{ color: v.accent }}>
                  ✓
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{v.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-4">
          Our Team
        </h2>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Founded in 2026 by engineers who were frustrated with bootcamps that charged
          $15,000 and delivered a to-do app tutorial.
        </p>
      </div>

      {/* Contact */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-4">
          Contact
        </h2>
        <a
          href="mailto:hello@square1.ai"
          className="text-base text-slate-400 hover:text-white transition-colors underline underline-offset-4"
        >
          hello@square1.ai
        </a>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20 pb-20 sm:pb-28 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)",
            boxShadow: "0 16px 48px rgba(220,38,38,0.35), 0 0 0 1px rgba(255,255,255,0.10) inset",
          }}
        >
          Take the free assessment &rarr;
        </Link>
      </div>
    </main>
  );
}
