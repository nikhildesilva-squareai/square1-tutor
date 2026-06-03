import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function CareersPage() {
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
        <Logo variant="light" size="lg" />
      </div>

      {/* Headline */}
      <div className="text-center max-w-3xl mx-auto px-6 sm:px-8 mt-12">
        <h1
          className="font-black tracking-tight text-white leading-[1.05] mb-6"
          style={{ fontSize: "clamp(36px, 6vw, 68px)", letterSpacing: "-0.03em" }}
        >
          Build the future of{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            education.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          We&apos;re a small team solving a big problem. If you&apos;re passionate about AI,
          education, or building beautiful products — we want to hear from you.
        </p>
      </div>

      {/* Open Roles */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-4">
          Open Roles
        </h2>
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-base text-slate-300 leading-relaxed mb-4">
            We&apos;re not hiring for specific roles right now — but we&apos;re always looking
            for exceptional people.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            If you think you&apos;d be a great fit, send us your portfolio (not your CV) and
            tell us what you&apos;d build first.
          </p>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-12 text-center">
        <a
          href="mailto:tech@square1ai.com"
          className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #6366f1 100%)",
            boxShadow: "0 16px 48px rgba(51,136,255,0.3), 0 0 0 1px rgba(255,255,255,0.10) inset",
          }}
        >
          tech@square1ai.com
        </a>
      </div>

      {/* Values */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-8 text-center">
          What We Value
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: "Proof over promises",
              desc: "Ship real things. Show the work.",
              accent: "#3388FF",
            },
            {
              title: "Feedback over lectures",
              desc: "We learn by building, not by watching.",
              accent: "#A78BFA",
            },
            {
              title: "Outcomes over theory",
              desc: "Every feature maps to a learner outcome.",
              accent: "#10B981",
            },
          ].map((v) => (
            <div key={v.title} className="text-center">
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

      {/* Spacer */}
      <div className="pb-20 sm:pb-28" />
    </main>
  );
}
