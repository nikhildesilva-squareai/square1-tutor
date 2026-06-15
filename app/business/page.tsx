import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { BusinessLeadForm } from "@/components/business/BusinessLeadForm";

export const metadata: Metadata = {
  title: "For Teams — Upskill Your Staff in AI",
  description:
    "Train your team in AI, cloud, security and data with an AI tutor that grades real code. Personalised per employee, measurable progress, verifiable certificates. Request team pricing.",
  openGraph: {
    title: "Square 1 AI for Teams — Upskill your staff for the AI era",
    description:
      "AI-powered upskilling for your team: personalised paths, real projects, manager-visible progress, verifiable certificates.",
  },
};

const VALUE_PROPS = [
  {
    title: "Measurable, not 'they watched a video'",
    desc: "Every employee is assessed, graded on real code, and tracked. You see who's progressing and who's stalled — proof you can take to leadership.",
    accent: "#0056CE",
    icon: "M18 20V10M12 20V4M6 20v-6",
  },
  {
    title: "Personalised to each person's level",
    desc: "A diagnostic places every employee, then builds them a path from where they actually are — junior to senior, no one bored or lost.",
    accent: "#7C3AED",
    icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4l3 2",
  },
  {
    title: "Verifiable proof of skill",
    desc: "Staff finish with deployed projects and AI-verified certificates — real evidence of capability, not a completion checkbox.",
    accent: "#10B981",
    icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4 12 14.01l-3-3",
  },
  {
    title: "A fraction of bootcamp cost",
    desc: "AI tutoring + project review at scale, for every employee, at a per-seat price that makes a bootcamp look absurd.",
    accent: "#F59E0B",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  },
];

const STEPS = [
  { n: "1", title: "Assess your team", desc: "Each employee takes a skill check — you see the baseline across your whole team." },
  { n: "2", title: "Personalised paths", desc: "Everyone gets a tailored track in AI, cloud, security or data — built for their level and role." },
  { n: "3", title: "Track + prove it", desc: "A manager dashboard shows progress, scores and certificates. Export it for L&D reporting." },
];

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

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 pt-10 sm:pt-16 pb-12 text-center">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
          Square 1 for Teams
        </span>
        <h1 className="mt-4 mb-4 font-black tracking-tight text-slate-900 leading-[1.0]"
          style={{ fontSize: "clamp(34px,6vw,64px)" }}>
          Upskill your team for the{" "}
          <span style={{ background: "linear-gradient(135deg,#0056CE,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            AI era.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8">
          An AI tutor that grades your staff&apos;s real code, builds each person a personalised path, and gives you the dashboard to prove they actually upskilled.
        </p>
        <a href="#request"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
          Request team pricing →
        </a>
      </section>

      {/* Value props */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${v.accent}12` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={v.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={v.icon} /></svg>
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1.5 leading-snug">{v.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-14">
        <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-900 mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center text-lg font-black mx-auto mb-3">{s.n}</div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-14">
        <div className="text-center mb-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Simple per-seat pricing</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            From <span className="font-bold text-slate-900">$240/employee a year</span> — versus $10,000+ for a bootcamp. Billed annually, the more seats the lower the rate.
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
              <p className="text-[11px] text-slate-400 mb-4">billed annually · ${t.yr}/seat/yr</p>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{t.blurb}</p>
              <a href="#request"
                className="mt-5 inline-flex items-center justify-center h-10 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={t.popular
                  ? { background: "linear-gradient(135deg,#0056CE,#4F46E5)", color: "#fff" }
                  : { border: "1.5px solid rgba(0,86,206,0.25)", color: "#0056CE" }}>
                Get started
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

      {/* Lead form */}
      <section id="request" className="max-w-xl mx-auto px-5 sm:px-6 pb-20 scroll-mt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Tell us about your team</h2>
          <p className="text-sm text-slate-600">We&apos;ll reply with per-seat pricing and a pilot offer to trial it with your staff.</p>
        </div>
        <BusinessLeadForm />
      </section>
    </div>
  );
}
