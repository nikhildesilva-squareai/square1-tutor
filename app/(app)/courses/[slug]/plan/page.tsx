"use client";

import React, { useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Plan {
  months: 3 | 6 | 9;
  label: string;
  sublabel: string;
  monthlyPrice: number;
  upfrontPrice: number;
  daily: string;
  daysPerWeek: number;
  projects: number;
  perDay: string;
  isFeatured?: boolean;
}

const PLANS: Plan[] = [
  {
    months: 3,
    label: "3-MONTH",
    sublabel: "INTENSIVE",
    monthlyPrice: 29.9,
    upfrontPrice: 80,
    daily: "2 hrs/day",
    daysPerWeek: 5,
    projects: 8,
    perDay: "1.00",
  },
  {
    months: 6,
    label: "6-MONTH",
    sublabel: "MOST POPULAR",
    monthlyPrice: 19.9,
    upfrontPrice: 107,
    daily: "1 hr/day",
    daysPerWeek: 5,
    projects: 10,
    perDay: "0.66",
    isFeatured: true,
  },
  {
    months: 9,
    label: "9-MONTH",
    sublabel: "STEADY",
    monthlyPrice: 15.9,
    upfrontPrice: 129,
    daily: "45 min/day",
    daysPerWeek: 5,
    projects: 12,
    perDay: "0.53",
  },
];

const FEATURES = [
  { icon: "book", text: "Full course curriculum (40 lessons)" },
  { icon: "code", text: "10-12 real deployable projects" },
  { icon: "ai", text: "AI code grading on every submission" },
  { icon: "chat", text: "Nova — 24/7 AI tutor" },
  { icon: "chart", text: "Skill reports & progress tracking" },
  { icon: "award", text: "Certificate of completion" },
  { icon: "github", text: "GitHub portfolio" },
];

const FAQS = [
  {
    q: "What if I fall behind my schedule?",
    a: "Life happens — we get it. Your plan gives you full access for the entire duration, and the schedule is a guide, not a deadline. If you miss a few days, you pick right up where you left off. Nova, your AI tutor, will adjust your study recommendations based on your actual pace. Many students study in bursts and still finish ahead of schedule.",
  },
  {
    q: "Can I switch plans or take multiple courses?",
    a: "Absolutely. You can upgrade or extend your current plan at any time and you only pay the difference. You can also enrol in multiple courses simultaneously — each one gets its own dashboard, progress tracker, and project portfolio. Many students pair complementary courses like Full Stack + AI, or Data Science + Machine Learning.",
  },
  {
    q: "Is this another video course I'll never finish?",
    a: "Not even close. There are no passive videos here. Every lesson is interactive — you read, you code, you solve inline exercises in real time. Every project you build is reviewed by AI that gives you line-by-line feedback on your code, just like a senior developer would. And if you get stuck at 2am, Nova is there to unblock you. The completion rate for students who start their first lesson is significantly higher than traditional video platforms because the format keeps you engaged.",
  },
  {
    q: "Do I need prior coding experience?",
    a: "It depends on the course you choose, but the short answer is: we meet you where you are. Before you enrol, you take a 30-minute diagnostic assessment. Our AI analyses your answers across multiple skill dimensions and determines your exact starting point — beginner, intermediate, or advanced. Your curriculum is then tailored to your level so you are never bored repeating things you know, and never lost on concepts you haven't seen yet.",
  },
  {
    q: "What exactly does the AI tutor do?",
    a: "Nova is your personal learning companion, available 24 hours a day, 7 days a week. Ask it to explain a concept in simpler terms, debug your code, quiz you on a topic, or walk you through a project step by step. It knows your course material, your current progress, and where your skill gaps are — so its answers are specific to you, not generic. Think of it as having a patient, knowledgeable mentor on call at all times.",
  },
  {
    q: "What do I get at the end?",
    a: "You walk away with three things that are yours forever. First, a verified certificate of completion you can add to your LinkedIn and resume. Second, a portfolio of 10-12 real, deployed projects hosted on your GitHub — not toy exercises, but production-quality applications that demonstrate your skills to employers. Third, a detailed skill report showing your strengths across every topic in the curriculum. Your code, your projects, and your certificate never expire.",
  },
  {
    q: "What happens after my plan ends?",
    a: "Your portfolio, certificate, project code, and skill reports are yours to keep permanently. If you want to continue learning, you can re-enrol in the same course to revisit material, or start a completely new course in a different subject. Many graduates go on to take a second or third course to broaden their skillset across multiple domains.",
  },
  {
    q: "How is this different from a bootcamp?",
    a: "Bootcamps cost $10,000-20,000, run on a fixed schedule that doesn't adapt to you, and typically offer limited 1-on-1 support. Square 1 gives you a fully personalised, AI-driven experience at a fraction of the cost. You learn at your own pace with an AI tutor available around the clock. Your projects get instant, detailed code reviews — not a grade three weeks later. And because the curriculum adapts to your diagnostic assessment, you skip what you already know and focus on what actually matters for your growth.",
  },
];

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
    code: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
    ai: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
    chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    award: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
    github: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>,
  };
  return <span className="text-brand">{icons[name] ?? null}</span>;
}

export default function PlanPage({ params }: PageProps) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId") ?? "";

  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "upfront">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function goToCheckout(months: number) {
    const rp = reportId ? `&reportId=${reportId}` : "";
    router.push(`/courses/${slug}/checkout?months=${months}&billing=${billingCycle}${rp}`);
  }

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  HERO                                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-14 sm:pt-20 pb-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
              Your plan is ready
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-ink mb-3 leading-tight">
            Invest in yourself
          </h1>
          <p className="text-ink-muted text-sm sm:text-base max-w-lg mx-auto mb-4">
            Every plan includes the full curriculum, AI-graded projects, Nova AI tutor, and a certificate.
            Just pick your pace.
          </p>

          {/* Value anchor */}
          <p className="text-xs text-ink-muted mb-10">
            Coding bootcamps charge <span className="line-through">$10,000+</span>.
            University CS degrees cost <span className="line-through">$40,000+</span>.
            <span className="text-brand font-bold"> Start here for less than a coffee a day.</span>
          </p>

          {/* ── Billing toggle ──────────────────────────────────────────── */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-surface-alt mb-10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold transition-all",
                billingCycle === "monthly"
                  ? "bg-brand text-white"
                  : "text-ink-muted hover:text-ink-secondary"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("upfront")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                billingCycle === "upfront"
                  ? "bg-brand text-white"
                  : "text-ink-muted hover:text-ink-secondary"
              )}
            >
              Pay upfront
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                billingCycle === "upfront"
                  ? "bg-success text-white"
                  : "bg-success-bg text-success"
              )}>
                SAVE 10%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  PLAN CARDS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.upfrontPrice;
            const priceLabel = billingCycle === "monthly" ? "/mo" : " once";
            const altPrice = billingCycle === "monthly"
              ? `or $${plan.upfrontPrice} once (save 10%)`
              : `or $${plan.monthlyPrice}/mo`;

            return (
              <div
                key={plan.months}
                className={cn(
                  "relative rounded-2xl border p-6 sm:p-8 transition-all bg-surface flex flex-col",
                  plan.isFeatured
                    ? "border-brand shadow-card-hover ring-1 ring-brand/20"
                    : "border-border shadow-card hover:shadow-card-hover"
                )}
              >
                {/* Featured badge */}
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-brand text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-brand/25">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-5">
                  <h3 className="text-lg font-black text-ink">{plan.label}</h3>
                  <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">{plan.sublabel}</p>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-ink">${price}</span>
                    <span className="text-sm text-ink-muted">{priceLabel}</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{altPrice}</p>
                </div>

                {/* Per-day callout */}
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-bg/50 border border-success/20 text-[10px] font-bold text-success">
                    ${plan.perDay}/day
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-sm text-ink-secondary">{plan.daily}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-sm text-ink-secondary">{plan.daysPerWeek} days/week</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span className="text-sm text-ink-secondary">{plan.projects} projects</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm text-ink-secondary">Full AI tutor access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm text-ink-secondary">Certificate included</span>
                  </div>
                </div>

                {/* CTA button */}
                <button
                  onClick={() => goToCheckout(plan.months)}
                  className={cn(
                    "w-full h-13 py-3.5 rounded-xl font-bold text-sm transition-all",
                    plan.isFeatured
                      ? "bg-brand text-white hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-surface border border-border text-ink hover:bg-surface-alt"
                  )}
                >
                  {plan.isFeatured ? "Start Now — Best Value" : "Start Now"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust signals under cards */}
        <div className="max-w-5xl mx-auto mt-6 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Secure payment via Stripe
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
            Cancel anytime
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            Full access from day one
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  WHAT'S INCLUDED                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-3">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
                What&apos;s Included
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              Everything you need to master it
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
                <div className="w-8 h-8 rounded-lg bg-surface-tint flex items-center justify-center shrink-0">
                  <FeatureIcon name={f.icon} />
                </div>
                <span className="text-sm font-medium text-ink-secondary">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  COMPARISON — BOOTCAMP vs SQUARE 1                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-3">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
                Compare
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              Bootcamp vs Square 1
            </h2>
            <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">
              Same skills. Fraction of the cost. Better tools.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Bootcamp column */}
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-ink">Bootcamp</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Cost", value: "$10,000 — $20,000", bad: true },
                  { label: "Schedule", value: "Fixed, rigid", bad: true },
                  { label: "AI Tutor", value: "None", bad: true },
                  { label: "Code Review", value: "Weeks later", bad: true },
                  { label: "Projects", value: "2-3 guided", bad: false },
                  { label: "Personalised", value: "One-size-fits-all", bad: true },
                  { label: "Certificate", value: "Yes", bad: false },
                  { label: "Self-paced", value: "No", bad: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-ink-muted">{row.label}</span>
                    <span className={cn("text-xs font-medium text-right", row.bad ? "text-red-400" : "text-ink-secondary")}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Square 1 column */}
            <div className="rounded-2xl border-2 border-brand bg-surface p-5 sm:p-6 ring-1 ring-brand/10 shadow-card-hover">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-brand">Square 1</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Cost", value: "From $15.9/mo" },
                  { label: "Schedule", value: "Your pace, your time" },
                  { label: "AI Tutor", value: "24/7 — always on" },
                  { label: "Code Review", value: "Instant, every submission" },
                  { label: "Projects", value: "10-12 real, deployed" },
                  { label: "Personalised", value: "AI-adapted to your level" },
                  { label: "Certificate", value: "Yes, verified" },
                  { label: "Self-paced", value: "100%" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-ink-muted">{row.label}</span>
                    <span className="text-xs font-semibold text-brand text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  FAQ                                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-ink">Questions?</h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden shadow-card">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-soft transition-colors"
                  >
                    <span className="text-sm font-semibold text-ink">{faq.q}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={cn("text-ink-muted shrink-0 transition-transform", isOpen && "rotate-180")}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 -mt-1">
                      <p className="text-sm text-ink-muted leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  FINAL CTA                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-ink mb-3">
            Your gaps won&apos;t close themselves
          </h2>
          <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto">
            You took the assessment. You saw where you stand. Now do something about it.
          </p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-brand text-white font-bold text-base hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Pick your plan
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </section>

    </div>
  );
}
