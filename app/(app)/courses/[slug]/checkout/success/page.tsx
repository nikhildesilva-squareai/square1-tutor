"use client";

import React, { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Confetti burst ────────────────────────────────────────────────────────── */
function Confetti() {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; color: string; delay: number; size: number; rotation: number }[]
  >([]);

  useEffect(() => {
    const colors = ["#0056CE", "#19A65F", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -50 - 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 1,
            animation: `confettiFall 3s ease-out ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated checkmark ────────────────────────────────────────────────────── */
function AnimatedCheck() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-6">
      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          0% { stroke-dashoffset: 30; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div
        className="w-24 h-24 rounded-full bg-success flex items-center justify-center"
        style={{ animation: "ringPulse 0.6s ease-out forwards" }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <polyline
            points="20 6 9 17 4 12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: 30,
              animation: "checkDraw 0.5s ease-out 0.4s forwards",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
const PLAN_MAP: Record<number, { label: string; price: number; upfront: number }> = {
  3: { label: "3-Month Intensive", price: 29.9, upfront: 80 },
  6: { label: "6-Month Plan", price: 19.9, upfront: 107 },
  9: { label: "9-Month Steady", price: 15.9, upfront: 129 },
};

export default function CheckoutSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();

  const months = parseInt(searchParams.get("months") ?? "6", 10);
  const billing = searchParams.get("billing") ?? "monthly";
  const plan = PLAN_MAP[months] ?? PLAN_MAP[6];
  const amount = billing === "monthly" ? plan.price : plan.upfront;

  const [courseTitle, setCourseTitle] = useState("");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("courses")
      .select("title")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setCourseTitle(data?.title ?? "your course"));

    // Stop confetti after 4s
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-16">
      {showConfetti && <Confetti />}

      <div className="max-w-md w-full text-center">
        <AnimatedCheck />

        <h1 className="text-3xl sm:text-4xl font-black text-ink mb-2">You&apos;re in!</h1>
        <p className="text-ink-muted text-sm sm:text-base mb-8">
          Welcome to <span className="font-semibold text-ink">{courseTitle || "the course"}</span>.
          Your enrolment is confirmed.
        </p>

        {/* ── Receipt card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card text-left mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Receipt</span>
            <span className="text-xs text-success font-semibold">Paid</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Course</span>
              <span className="text-ink font-medium">{courseTitle || "Loading..."}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Plan</span>
              <span className="text-ink font-medium">{plan.label}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Billing</span>
              <span className="text-ink font-medium capitalize">{billing}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
              <span className="text-ink font-bold">Amount paid</span>
              <span className="text-ink font-bold text-lg">${amount.toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* ── What happens next ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface-soft p-5 mb-8 text-left">
          <h3 className="text-sm font-bold text-ink mb-3">What happens next</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Your personalised study plan is ready" },
              { step: "2", text: "Start Lesson 1 — takes about 15 minutes" },
              { step: "3", text: "Nova, your AI tutor, will guide you" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {step}
                </div>
                <span className="text-sm text-ink-secondary">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ──────────────────────────────────────────────────────── */}
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-brand text-white font-bold text-base hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          Start learning
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>

        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border text-ink text-sm font-semibold hover:bg-surface-soft transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/courses"
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border text-ink text-sm font-semibold hover:bg-surface-soft transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another course
          </Link>
        </div>

        <p className="text-xs text-ink-muted mt-4">
          A confirmation email will be sent to your account email.
        </p>
      </div>
    </div>
  );
}
