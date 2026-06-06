"use client";

import React, { useState, use } from "react";
import { useSearchParams } from "next/navigation";
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
  isFeatured?: boolean;
}

const PLANS: Plan[] = [
  {
    months: 3,
    label: "3-MONTH",
    sublabel: "INTENSIVE",
    monthlyPrice: 29,
    upfrontPrice: 78,
    daily: "2 hrs/day",
    daysPerWeek: 5,
    projects: 8,
  },
  {
    months: 6,
    label: "6-MONTH",
    sublabel: "RECOMMENDED",
    monthlyPrice: 19,
    upfrontPrice: 103,
    daily: "1 hr/day",
    daysPerWeek: 5,
    projects: 10,
    isFeatured: true,
  },
  {
    months: 9,
    label: "9-MONTH",
    sublabel: "STEADY",
    monthlyPrice: 14,
    upfrontPrice: 113,
    daily: "45 min/day",
    daysPerWeek: 5,
    projects: 12,
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

  const [billingCycle, setBillingCycle] = useState<"monthly" | "upfront">("monthly");
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  HERO                                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-16 sm:pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pill eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
              Choose Your Plan
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-ink mb-3 leading-tight">
            Start closing the gaps
          </h1>
          <p className="text-ink-muted text-sm sm:text-base max-w-md mx-auto mb-10">
            All plans cover the same curriculum, with the same AI-graded projects and tutor access. Just pick your pace.
          </p>

          {/* ── Billing toggle ──────────────────────────────────────────── */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-surface-alt mb-12">
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
      <section className="px-4 sm:px-6 pb-16 sm:pb-20">
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
                  "relative rounded-2xl border p-6 sm:p-8 transition-all bg-surface",
                  plan.isFeatured
                    ? "border-brand shadow-card-hover"
                    : "border-border shadow-card hover:shadow-card-hover"
                )}
              >
                {/* Featured badge */}
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-brand text-white text-[10px] font-bold uppercase tracking-wider shadow-card-hover">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-6">
                  <h3 className="text-lg font-black text-ink">{plan.label}</h3>
                  <p className="text-xs text-ink-muted font-semibold uppercase tracking-wider">{plan.sublabel}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-ink">${price}</span>
                    <span className="text-sm text-ink-muted">{priceLabel}</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{altPrice}</p>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-8">
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
                </div>

                {/* CTA button */}
                <button
                  onClick={() => setShowModal(true)}
                  className={cn(
                    "w-full h-12 rounded-xl font-bold text-sm transition-all",
                    plan.isFeatured
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "bg-surface border border-border text-ink hover:bg-surface-alt"
                  )}
                >
                  Start Now
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  WHAT'S INCLUDED                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-surface-tint mb-4">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand">
                What&apos;s Included
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              Everything you need to master it
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      {/*  GUARANTEE                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-success-bg flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">30-day money-back guarantee</h3>
          <p className="text-sm text-ink-muted">No questions asked. If it&apos;s not for you, you get a full refund.</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  COMING SOON MODAL                                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="max-w-md w-full bg-surface rounded-2xl border border-border p-8 text-center shadow-card-hover">
            <div className="w-14 h-14 rounded-2xl bg-surface-tint flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-ink mb-2">Coming soon</h3>
            <p className="text-sm text-ink-muted mb-6">
              Payments are launching shortly. Enter your email to be first in line.
            </p>

            {emailSubmitted ? (
              <div className="rounded-xl bg-success-bg border border-success/20 p-4">
                <div className="flex items-center justify-center gap-2 text-success text-sm font-semibold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  You&apos;re on the list! We&apos;ll notify you.
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                />
                <button
                  onClick={() => {
                    if (email.includes("@")) setEmailSubmitted(true);
                  }}
                  className="h-11 px-5 rounded-xl bg-brand text-white font-semibold text-sm shrink-0 hover:bg-brand-dark transition-colors"
                >
                  Notify me
                </button>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 text-xs text-ink-muted hover:text-ink-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
