import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { BusinessLeadForm } from "@/components/business/BusinessLeadForm";
import { SeatSelector } from "@/components/business/SeatSelector";
import { TeamDashboardPreview } from "@/components/business/TeamDashboardPreview";
import { WhyManagers } from "@/components/business/WhyManagers";
import { HowItWorks } from "@/components/business/HowItWorks";
import { EmployeeJourney } from "@/components/business/EmployeeJourney";
import { ROICalculator } from "@/components/business/ROICalculator";
import { NovaCapabilities } from "@/components/business/NovaCapabilities";
import { InlineDiagnostic } from "@/components/landing/InlineDiagnostic";

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
        <div className="pointer-events-none absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,86,206,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute top-10 right-0 translate-x-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(90px)" }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-8 sm:pt-14 pb-14 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Square 1 Ai for Teams
            </span>
            <h1 className="mt-4 mb-5 font-black tracking-tight text-slate-900 leading-[1.02]"
              style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.02em" }}>
              Upskill your team for the{" "}
              <span style={{ background: "linear-gradient(135deg,#3388FF,#0056CE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                AI era.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              An AI tutor that grades your staff&apos;s real code, builds each person a personalised path, and gives you the dashboard to prove they actually upskilled.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
              <a href="#start"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#3388FF)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
                Start your team →
              </a>
              <a href="#request" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                Book a demo →
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-400">Free during early access · set up in 2 minutes · no card today</p>
          </div>

          <div className="lg:pl-6">
            <TeamDashboardPreview />
          </div>
        </div>
      </section>

      {/* ─── VALUE FIRST: see what your staff do, see the product, try it ─────── */}

      {/* 1. What your staff actually do — interactive walkthrough */}
      <EmployeeJourney />

      {/* 2. Meet Nova — compact, full-capability (tutor / review / build / adapt) */}
      <NovaCapabilities />

      {/* 3. Try it yourself — the real skill check (manager-framed) */}
      <InlineDiagnostic eyebrow="Try it yourself · 2 minutes" heading="Take the skill check your staff take." />

      {/* 4. Proof, not completion — deployed, reviewed, verifiable (white + blue) */}
      <section className="relative overflow-hidden py-20 sm:py-24 px-4 sm:px-6 lg:px-8" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 100%)" }}>
        <div className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(0,86,206,0.07) 0%,transparent 70%)", filter: "blur(110px)" }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Proof, not completion certificates</span>
            <h2 className="mt-3 font-black tracking-tight text-slate-900" style={{ fontSize: "clamp(26px,4vw,42px)" }}>
              They certify your staff <span className="text-slate-400">watched</span>. We prove they can{" "}
              <span style={{ background: "linear-gradient(135deg,#3388FF,#0056CE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ship</span>.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Every employee finishes with work an employer — or your CTO — can actually open and verify. Not a completion checkbox.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { t: "Deployed to a live URL", d: "Real projects shipped to a public link — run the code, don't take their word for it.", accent: "#3388FF", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
              { t: "Every line reviewed by Nova", d: "An AI code review on real submissions — strengths, fixes, and a score that vouches for quality.", accent: "#0EA5E9", icon: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
              { t: "Verifiable certificate", d: "A credential anyone can verify in one click — not a PDF that's trivial to fake.", accent: "#0056CE", icon: "M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.12" },
            ].map((p) => (
              <div key={p.t} className="rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: "0 4px 16px rgba(15,28,49,0.05)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent}cc)`, boxShadow: `0 8px 20px ${p.accent}33` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1.5">{p.t}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Manager value — bento (visibility / measurable) */}
      <WhyManagers />

      {/* 6. ROI — quantify the value */}
      <ROICalculator />

      {/* 7. How you get set up — manager 3-step */}
      <HowItWorks />

      {/* ─── THE ACTION: pricing + start your team ────────────────────────────── */}

      {/* Pricing — reference; CTAs jump to the seat selector */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-12">
        <div className="text-center mb-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Simple per-seat pricing</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            <span className="font-bold text-emerald-700">Free during early access.</span> Below is what it&apos;ll cost when billing launches — billed monthly or annually, the more seats the lower the rate.
          </p>
        </div>

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
                  ? { background: "linear-gradient(135deg,#0056CE,#3388FF)", color: "#fff" }
                  : { border: "1.5px solid rgba(0,86,206,0.25)", color: "#0056CE" }}>
                Choose this size
              </a>
            </div>
          ))}
        </div>

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

      {/* PRIMARY ACTION — pick seats & start */}
      <section id="start" className="max-w-5xl mx-auto px-5 sm:px-6 pb-12 scroll-mt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Start your team in 2 minutes</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Pick your seats, start free, invite your staff — then track everyone from one dashboard.
          </p>
        </div>
        <SeatSelector />
      </section>

      {/* Enterprise trust — security & SSO (white + blue) */}
      <section className="relative overflow-hidden py-20 sm:py-24 px-4 sm:px-6 lg:px-8" style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#F4F8FF 100%)" }}>
        <div className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(0,86,206,0.06) 0%,transparent 70%)", filter: "blur(110px)" }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-9">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-brand font-bold">Enterprise-ready</span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">Built to clear IT &amp; security.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { t: "Single sign-on", now: "Google Workspace SSO, live today.", soon: "SAML SSO + SCIM provisioning on the roadmap for 50+ teams.", icon: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" },
              { t: "Your data, handled right", now: "Australia-hosted (AWS Sydney). We never train AI models on your team's data.", soon: "SOC 2 on our roadmap.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
              { t: "Works with your stack", now: "Manager dashboard + exportable reports today.", soon: "LMS / HRIS completion sync on the roadmap.", icon: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 4px 16px rgba(15,28,49,0.05)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border border-blue-100" style={{ background: "#E5F0FF" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                </div>
                <p className="text-sm font-black text-slate-900 mb-1">{s.t}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{s.now}</p>
                <p className="text-[11px] text-slate-400 mt-1">{s.soon}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">
            Need a security review or SSO for your team? <a href="#request" className="font-semibold text-brand hover:underline">Book a demo</a> and we&apos;ll walk you through it.
          </p>
        </div>
      </section>

      {/* Lead form — book a demo / 50+ / questions */}
      <section id="request" className="max-w-xl mx-auto px-5 sm:px-6 pb-20 scroll-mt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Book a demo, or talk to us.</h2>
          <p className="text-sm text-slate-600">
            For 50+ seats, custom pricing, SSO or a security review — leave your details and we&apos;ll set it up. Smaller team? Just <a href="#start" className="text-brand font-semibold hover:underline">start above</a> — it&apos;s instant.
          </p>
        </div>
        <BusinessLeadForm />
      </section>
    </div>
  );
}
