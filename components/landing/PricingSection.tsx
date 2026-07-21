import Link from "next/link";
import { Check } from "lucide-react";
import { FOUNDING_PLANS, FOUNDING_PRICE_FROM } from "@/lib/founding";
import { PrimaryCta } from "@/components/ui/primary-cta";

// ═══════════════════════════════════════════════════════════════════════════════
// Pricing — honest about the current reality: early access is free, and
// founding members lock their rate for life. Everything price-related reads
// from FOUNDING_PRICE (lib/founding.ts); set it once and this section, the
// founding-offer card, and the comparison table all update together.
// ═══════════════════════════════════════════════════════════════════════════════

const FREE_FEATURES = [
  "3-minute skill check — no account",
  "Full 20-question AI-graded assessment",
  "Personal skill report with gap map",
  "Lesson 1 of every course, free",
];

const FOUNDING_FEATURES = [
  "Every course, both paths — career engineering tracks and no-code role tracks (Marketing, Finance, Founders and more)",
  "Real, hands-on projects in every track",
  "Nova — an AI tutor that adapts to whatever you're learning",
  "Every submission reviewed and graded, with feedback",
  "Verified, shareable skill report",
];

const TEAM_FEATURES = [
  "Seats for your whole team",
  "Manager portal & invites",
  "Team skill reporting",
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 55%,#F4F8FF 100%)" }}>
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-[500px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.07) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-14">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Pricing
          </span>
          <h2 className="mt-4 font-black tracking-tight text-slate-900 leading-[0.95]"
            style={{ fontSize: "clamp(30px, 5vw, 60px)" }}>
            Start free.{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Lock your rate for life.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            One membership, one price — both paths included: the career engineering tracks
            and the no-code role tracks. No credit card anywhere below. Founding members keep
            whatever they pay now; the price never goes up on you.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 flex flex-col"
            style={{ boxShadow: "0 8px 32px rgba(15,28,49,0.06)" }}>
            <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-500 mb-3">Skill check</p>
            <p className="font-black text-slate-900 leading-none" style={{ fontSize: 40 }}>
              $0
            </p>
            <p className="text-xs text-slate-500 mt-1.5 mb-6">free forever</p>
            <ul className="space-y-2.5 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check size={15} strokeWidth={3} className="shrink-0 mt-0.5" style={{ color: "#0056CE" }} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/diagnostic"
              className="mt-7 inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all">
              Take the skill check
            </Link>
          </div>

          {/* Founding — highlighted */}
          <div className="relative rounded-3xl p-7 flex flex-col text-white overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #0B1626 0%, #050B14 100%)",
              border: "1px solid rgba(51,136,255,0.35)",
              boxShadow: "0 24px 64px rgba(0,86,206,0.25)",
            }}>
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{ background: "radial-gradient(circle, rgba(51,136,255,0.35) 0%, transparent 70%)", filter: "blur(24px)" }} />
            <div className="relative flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-400">Founding membership</p>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.30)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
                Cohort 01 · open now
              </span>
            </div>
            <p className="relative font-black leading-none" style={{ fontSize: 40 }}>
              from {FOUNDING_PRICE_FROM}
              <span className="text-base font-bold text-slate-400">/mo</span>
            </p>
            <p className="relative text-xs text-slate-400 mt-1.5 mb-5">
              founding rate — locked for life · free while early access is open
            </p>

            {/* Plan rates by track length */}
            <div className="relative rounded-2xl border border-white/10 divide-y divide-white/10 mb-6 overflow-hidden">
              {FOUNDING_PLANS.map((p) => (
                <div key={p.months}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={p.popular ? { background: "rgba(51,136,255,0.10)" } : undefined}>
                  <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    {p.months}-month track
                    {p.popular && (
                      <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(51,136,255,0.18)", color: "#7EB3FF", border: "1px solid rgba(51,136,255,0.35)" }}>
                        Most popular
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-black tabular-nums text-white">
                    {p.perMonth}<span className="text-[10px] font-semibold text-slate-400">/mo</span>
                  </span>
                </div>
              ))}
            </div>

            <ul className="relative space-y-2.5 flex-1">
              {FOUNDING_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check size={15} strokeWidth={3} className="shrink-0 mt-0.5" style={{ color: "#3388FF" }} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <PrimaryCta href="/signup" className="relative mt-7 w-full">
              Claim a founding seat
            </PrimaryCta>
          </div>

          {/* Teams */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 flex flex-col"
            style={{ boxShadow: "0 8px 32px rgba(15,28,49,0.06)" }}>
            <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-500 mb-3">For Teams</p>
            <p className="font-black text-slate-900 leading-none" style={{ fontSize: 40 }}>
              from $20<span className="text-base font-bold text-slate-400">/seat/mo</span>
            </p>
            <p className="text-xs text-slate-500 mt-1.5 mb-6">volume-tiered · free during early access</p>
            <ul className="space-y-2.5 flex-1">
              {TEAM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check size={15} strokeWidth={3} className="shrink-0 mt-0.5" style={{ color: "#0056CE" }} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/business"
              className="mt-7 inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all">
              Explore Teams
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 max-w-md mx-auto">
          Being early is a trade: you get a locked price and a direct line to the founder;
          we get the feedback that makes this the best place to learn.
        </p>
      </div>
    </section>
  );
}
