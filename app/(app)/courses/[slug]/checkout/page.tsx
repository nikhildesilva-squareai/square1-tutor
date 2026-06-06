"use client";

import React, { useState, useEffect, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/* ─── Plan data (mirrors plan page) ─────────────────────────────────────────── */
interface PlanConfig {
  months: number;
  label: string;
  monthlyPrice: number;
  upfrontPrice: number;
  daily: string;
  projects: number;
}

const PLAN_MAP: Record<number, PlanConfig> = {
  3: { months: 3, label: "3-Month Intensive", monthlyPrice: 29.9, upfrontPrice: 80, daily: "2 hrs/day", projects: 8 },
  6: { months: 6, label: "6-Month Plan", monthlyPrice: 19.9, upfrontPrice: 107, daily: "1 hr/day", projects: 10 },
  9: { months: 9, label: "9-Month Steady", monthlyPrice: 15.9, upfrontPrice: 129, daily: "45 min/day", projects: 12 },
};

const INCLUDED = [
  "Full course curriculum",
  "AI code grading",
  "Nova — 24/7 AI tutor",
  "Skill reports & tracking",
  "Certificate of completion",
  "GitHub portfolio",
];

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const months = parseInt(searchParams.get("months") ?? "6", 10);
  const billing = (searchParams.get("billing") ?? "monthly") as "monthly" | "upfront";
  const reportId = searchParams.get("reportId") ?? "";

  const plan = PLAN_MAP[months] ?? PLAN_MAP[6];

  const price = billing === "monthly" ? plan.monthlyPrice : plan.upfrontPrice;
  const priceLabel = billing === "monthly" ? "/mo" : " one-time";
  const totalToday = billing === "monthly" ? plan.monthlyPrice : plan.upfrontPrice;

  /* ─── Course title fetch ─────────────────────────────────────────────────── */
  const [courseTitle, setCourseTitle] = useState("");
  const [courseIcon, setCourseIcon] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("courses")
      .select("title, icon")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setCourseTitle(data?.title ?? "Course");
        setCourseIcon(data?.icon ?? "");
      });
  }, [slug]);

  /* ─── Form state ──────────────────────────────────────────────────────────── */
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  /* ─── Card number formatting ──────────────────────────────────────────────── */
  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  const [error, setError] = useState("");

  /* ─── Payment + Enrollment handler ────────────────────────────────────────── */
  async function handlePayment() {
    if (!cardName || !cardNumber || !expiry || !cvc || !agreed) return;
    setProcessing(true);
    setError("");

    try {
      // ── TODO: Replace card processing with real Stripe Checkout ──
      // 1. POST /api/checkout { slug, months, billing }
      // 2. Server creates Stripe checkout session
      // 3. Confirm payment with Stripe Elements
      // For now: simulate 1.5s card processing
      await new Promise((r) => setTimeout(r, 1500));

      // ── Create enrollment in Supabase ──
      // When Stripe is live, move this to the Stripe webhook handler
      // so enrollment only happens after confirmed payment
      if (reportId) {
        const res = await fetch("/api/plan/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, planMonths: months }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("[checkout] enroll error:", data);
          // Don't block checkout on enrollment failure — log and continue
          // The user can be enrolled manually or via a retry mechanism
        }
      }

      router.push(`/courses/${slug}/checkout/success?months=${months}&billing=${billing}`);
    } catch (err) {
      console.error("[checkout] payment error:", err);
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  }

  const isFormValid = cardName.length > 2 && cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvc.length >= 3 && agreed;

  return (
    <div className="min-h-screen py-8 sm:py-14 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* ── Back link ───────────────────────────────────────────────────────── */}
        <Link
          href={`/courses/${slug}/plan`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-8 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to plans
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/*  LEFT — PAYMENT FORM                                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3">
            <h1 className="text-2xl sm:text-3xl font-black text-ink mb-1">Checkout</h1>
            <p className="text-sm text-ink-muted mb-8">Complete your enrolment in {courseTitle || "this course"}</p>

            {/* ── Card form ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-ink">Payment details</h2>
                <div className="flex items-center gap-2">
                  {/* Visa */}
                  <div className="w-10 h-6 rounded border border-border bg-white flex items-center justify-center">
                    <svg width="24" height="10" viewBox="0 0 48 16" fill="none">
                      <path d="M19.2 1l-4.8 14h-3.6L7.2 4.2c-.18-.72-.36-.96-.9-1.26C5.22 2.34 3.6 1.8 2.16 1.44L2.28 1h5.76c.78 0 1.44.54 1.56 1.38l1.44 7.56L14.76 1h4.44zm4.56 14h-3.36L22.56 1h3.36L23.76 15zm13.44 0h-3.12L37.32 1h3.6c.78 0 1.44.42 1.74 1.08L45.84 15h-3.48l-.66-1.86h-5.16L35.88 15h1.32zm2.58-4.44l-1.56-4.44-.06-.18-1.02 4.62h2.64z" fill="#1A1F71" />
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-10 h-6 rounded border border-border bg-white flex items-center justify-center">
                    <svg width="20" height="12" viewBox="0 0 32 20">
                      <circle cx="10" cy="10" r="10" fill="#EB001B" /><circle cx="22" cy="10" r="10" fill="#F79E1B" /><path d="M16 2.92A9.97 9.97 0 0 0 12 10a9.97 9.97 0 0 0 4 7.08A9.97 9.97 0 0 0 20 10a9.97 9.97 0 0 0-4-7.08z" fill="#FF5F00" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cardholder name */}
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                    Cardholder name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                {/* Card number */}
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                    Card number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors font-mono tracking-wider"
                    />
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted/40" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="4" width="22" height="16" rx="3" /><line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                </div>

                {/* Expiry + CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors font-mono tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                      CVC
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors font-mono tracking-wider"
                      />
                      <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r="0.5" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-brand focus:ring-brand accent-[#0056CE]"
                  />
                  <span className="text-xs text-ink-muted leading-relaxed">
                    I agree to the{" "}
                    <span className="text-brand font-medium">Terms of Service</span> and{" "}
                    <span className="text-brand font-medium">Privacy Policy</span>.
                    I understand I can cancel my subscription at any time.
                  </span>
                </label>
              </div>

              {/* ── Pay button ──────────────────────────────────────────────── */}
              <button
                onClick={handlePayment}
                disabled={!isFormValid || processing}
                className={cn(
                  "w-full h-14 mt-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2",
                  isFormValid && !processing
                    ? "bg-brand text-white hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 active:translate-y-0"
                    : "bg-border text-ink-muted cursor-not-allowed"
                )}
              >
                {processing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Pay ${totalToday.toFixed(2)} USD
                  </>
                )}
              </button>

              {/* Error message */}
              {error && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* ── Dev bypass — remove when Stripe is live ──────────── */}
              {!processing && (
                <button
                  onClick={async () => {
                    setProcessing(true);
                    setError("");
                    try {
                      if (reportId) {
                        await fetch("/api/plan/enroll", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reportId, planMonths: months }),
                        });
                      }
                      router.push(`/courses/${slug}/checkout/success?months=${months}&billing=${billing}`);
                    } catch {
                      setError("Enrollment failed");
                      setProcessing(false);
                    }
                  }}
                  className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  ⚡ Skip payment (dev mode) — enrol & go to course
                </button>
              )}

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  SSL Encrypted
                </span>
                <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  Full access from day one
                </span>
                <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/*  RIGHT — ORDER SUMMARY                                            */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card sticky top-8">
              <h2 className="text-base font-bold text-ink mb-5">Order summary</h2>

              {/* Course */}
              <div className="flex items-start gap-3 pb-5 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-surface-tint flex items-center justify-center text-xl shrink-0">
                  {courseIcon || "📚"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{courseTitle || "Loading..."}</p>
                  <p className="text-xs text-ink-muted">{plan.label}</p>
                </div>
              </div>

              {/* Plan details */}
              <div className="py-5 border-b border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Duration</span>
                  <span className="text-ink font-medium">{plan.months} months</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Pace</span>
                  <span className="text-ink font-medium">{plan.daily}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Projects</span>
                  <span className="text-ink font-medium">{plan.projects} projects</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Billing</span>
                  <span className="text-ink font-medium capitalize">{billing}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="py-5 border-b border-border space-y-2">
                {billing === "monthly" ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Monthly rate</span>
                      <span className="text-ink font-medium">${plan.monthlyPrice}/mo</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Total ({plan.months} months)</span>
                      <span className="text-ink font-medium">${(plan.monthlyPrice * plan.months).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Full price</span>
                      <span className="text-ink-muted line-through">${(plan.monthlyPrice * plan.months).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-success font-medium">10% discount</span>
                      <span className="text-success font-medium">
                        -${((plan.monthlyPrice * plan.months) - plan.upfrontPrice).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Total */}
              <div className="pt-5 pb-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-ink">Due today</span>
                  <span className="text-2xl font-black text-ink">${totalToday.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  {billing === "monthly" ? "Billed monthly. Cancel anytime." : "One-time payment. Full access."}
                </p>
              </div>

              {/* Included */}
              <div className="pt-5">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Includes</p>
                <ul className="space-y-2">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-ink-secondary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#19A65F" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
