import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { BusinessLeadForm } from "@/components/business/BusinessLeadForm";
import { SeatSelector } from "@/components/business/SeatSelector";
import { TeamDashboardPreview } from "@/components/business/TeamDashboardPreview";
import { WhyManagers } from "@/components/business/WhyManagers";
import { HowItWorks } from "@/components/business/HowItWorks";

export const metadata: Metadata = {
  title: "For Teams — Upskill Your Staff in AI",
  description:
    "Buy seats, invite your staff, track everyone from one dashboard. An AI tutor that grades real code, a personalised path per employee, verifiable certificates. Free during early access.",
  openGraph: {
    title: "Square 1 Ai for Teams — Upskill your staff for the AI era",
    description:
      "AI-powered upskilling for your team: personalised paths, real projects, manager-visible progress, verifiable certificates.",
  },
};

export default function BusinessPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 35%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          For individuals →
        </Link>
      </header>

      {/* Hero — two-column: tight copy + the product (manager dashboard) */}
      <section className="relative overflow-hidden">
        {/* Depth: gradient glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute top-10 right-0 translate-x-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-8 sm:pt-14 pb-14 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Square 1 Ai for Teams
            </span>
            <h1 className="mt-4 mb-5 font-black tracking-tight text-slate-900 leading-[1.02]"
              style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.02em" }}>
              Upskill your team for the{" "}
              <span style={{ background: "linear-gradient(135deg,#0056CE,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                AI era.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              An AI tutor that grades your staff&apos;s real code, builds each person a personalised path, and gives you the dashboard to prove they actually upskilled.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
              <a href="#start"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
                Start your team →
              </a>
              <a href="#request" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                50+ seats? Talk to us →
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-400">Free during early access · set up in 2 minutes · no card today</p>
          </div>

          {/* Right — product preview */}
          <div className="lg:pl-6">
            <TeamDashboardPreview />
          </div>
        </div>
      </section>

      {/* PRIMARY ACTION — pick seats & start (self-serve) */}
      <section id="start" className="max-w-5xl mx-auto px-5 sm:px-6 pb-10 scroll-mt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Build your team in 2 minutes</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Pick your seats, start free, invite your staff — then track everyone from one dashboard.
          </p>
        </div>
        <SeatSelector />
      </section>

      {/* Why managers choose us — interactive (spotlight + reveal) */}
      <WhyManagers />

      {/* How it works — interactive auto-playing stepper */}
      <HowItWorks />

      {/* Pricing — reference only; CTAs jump to the seat selector */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-12">
        <div className="text-center mb-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Simple per-seat pricing</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            <span className="font-bold text-emerald-700">Free during early access.</span> Below is what it&apos;ll cost when billing launches — billed monthly or annually, the more seats the lower the rate. (vs $10,000+ for a bootcamp.)
          </p>
        </div>

        {/* Founding offer banner */}
        <div className="max-w-2xl mx-auto mb-9 mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-center">
          <p className="text-sm font-bold text-emerald-800">
            🎉 Founding offer — our first corporate customers get <span className="underline">30% off these rates, locked for life.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Starter", seats: "1–5 seats", price: 39, yr: 468, blurb: "Small teams getting started", popular: false },
            { name: "Team", seats: "6–15 seats", price: 32, yr: 384, blurb: "Growing teams upskilling together", popular: true },
            { name: "Growth", seats: "16–30 seats", price: 26, yr: 312, blurb: "Departments scaling capability", popular: false },
            { name: "Scale", seats: "31–50 seats", price: 20, yr: 240, blurb: "Best per-seat value for big teams", popular: false },
          ].map((t) => (
            <div key={t.name}
              className="relative rounded-2xl border-2 bg-white p-6 flex flex-col"
              style={{ borderColor: t.popular ? "#0056CE" : "rgba(15,28,49,0.10)", boxShadow: t.popular ? "0 16px 48px rgba(0,86,206,0.15)" : "0 2px 12px rgba(15,28,49,0.04)" }}>
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-white" style={{ background: "#0056CE" }}>
                  Most popular
                </span>
              )}
              <p className="text-sm font-bold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500 mb-4">{t.seats}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 tabular-nums">${t.price}</span>
                <span className="text-xs text-slate-500">/seat/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">annual · ${t.yr}/seat/yr · free for now</p>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{t.blurb}</p>
              <a href="#start"
                className="mt-5 inline-flex items-center justify-center h-10 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={t.popular
                  ? { background: "linear-gradient(135deg,#0056CE,#4F46E5)", color: "#fff" }
                  : { border: "1.5px solid rgba(0,86,206,0.25)", color: "#0056CE" }}>
                Choose this size
              </a>
            </div>
          ))}
        </div>

        {/* 50+ custom strip */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-slate-900">More than 50 employees?</p>
            <p className="text-xs text-slate-600">Custom pricing, volume rates, SSO, and dedicated onboarding.</p>
          </div>
          <a href="#request" className="text-sm font-bold text-brand hover:underline whitespace-nowrap">Talk to us →</a>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Every plan: full courses · AI tutor · code review · personalised paths · certificates · manager dashboard.
        </p>
      </section>

      {/* Lead form — ONLY for 50+ seats / questions */}
      <section id="request" className="max-w-xl mx-auto px-5 sm:px-6 pb-20 scroll-mt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Need 50+ seats, or have questions?</h2>
          <p className="text-sm text-slate-600">
            Tell us about your team and we&apos;ll set you up with custom pricing, SSO and onboarding. For smaller teams, just <a href="#start" className="text-brand font-semibold hover:underline">start above</a> — it&apos;s instant.
          </p>
        </div>
        <BusinessLeadForm />
      </section>
    </div>
  );
}
