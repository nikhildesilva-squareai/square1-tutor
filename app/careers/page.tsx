import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Square 1 AI team. Help us build the future of AI-powered tech education.",
  openGraph: {
    title: "Careers — Square 1 AI",
    description: "Join the Square 1 AI team. Help us build the future of AI-powered tech education.",
  },
};

const ACCENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

export default function CareersPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-6 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="pointer-events-none absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* Nav */}
        <nav className="relative z-30 max-w-6xl mx-auto flex items-center justify-between mb-14 sm:mb-20">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors" style={{ minHeight: "unset" }}>
            <span>←</span> <Logo variant="dark" size="sm" />
          </Link>
          <Link href="/signup"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-wide uppercase transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", minHeight: "unset", boxShadow: "0 8px 24px rgba(0,86,206,0.25)" }}>
            Get started <span className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
          </Link>
        </nav>

        {/* Headline */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
            style={{ background: "rgba(0,86,206,0.06)", borderColor: "rgba(0,86,206,0.20)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand">Careers</span>
          </div>
          <h1 className="font-black tracking-tight text-slate-900 leading-[1.03] mb-6"
            style={{ fontSize: "clamp(36px, 6vw, 68px)", letterSpacing: "-0.03em" }}>
            Build the future of{" "}
            <span style={{ background: ACCENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              education.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            We&apos;re a small team solving a big problem. If you&apos;re passionate about AI,
            education, or building beautiful products — we want to hear from you.
          </p>
        </div>
      </section>

      {/* ── Open roles ───────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-2">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand font-bold mb-4">Open roles</h2>
        <div className="rounded-2xl p-8 border border-slate-200 bg-white" style={{ boxShadow: "0 4px 20px rgba(15,28,49,0.05)" }}>
          <p className="text-base text-slate-700 leading-relaxed mb-4">
            We&apos;re not hiring for specific roles right now — but we&apos;re always looking for exceptional people.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            If you think you&apos;d be a great fit, send us your portfolio (not your CV) and tell us what you&apos;d build first.
          </p>
        </div>
      </div>

      {/* ── Book a chat ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 mt-12">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand font-bold mb-4">Book a chat</h2>
        <p className="text-sm text-slate-500 mb-6">
          Pick a time that works for you. We&apos;d love to hear what you&apos;d build.
        </p>
        <div className="rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 12px 40px rgba(0,86,206,0.10)" }}>
          <iframe
            src="https://calendly.com/nikhil-desilva-square1ai?hide_gdpr_banner=1&hide_landing_page_details=1"
            width="100%"
            height="420"
            frameBorder="0"
            title="Book a career chat with Square1 Ai"
            className="w-full"
            style={{ minHeight: 420, background: "#FFFFFF" }}
          />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Or email us at{" "}
          <a href="mailto:tech@square1ai.com" className="text-brand hover:underline font-semibold">tech@square1ai.com</a>
        </p>
      </div>

      {/* ── What we value ────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 mt-16 sm:mt-20">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-brand font-bold mb-8 text-center">What we value</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: "Proof over promises", desc: "Ship real things. Show the work.", accent: "#3388FF" },
            { title: "Feedback over lectures", desc: "We learn by building, not by watching.", accent: "#0EA5E9" },
            { title: "Outcomes over theory", desc: "Every feature maps to a learner outcome.", accent: "#0056CE" },
          ].map((v) => (
            <div key={v.title} className="text-center rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: "0 4px 20px rgba(15,28,49,0.04)" }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${v.accent}15`, border: `1px solid ${v.accent}30` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={v.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{v.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-20 sm:pb-28" />
    </main>
  );
}
