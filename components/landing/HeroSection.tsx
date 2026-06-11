"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ParticleGlobe } from "./ParticleGlobe";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      ref={heroRef}
      className="hero-section relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#050B14" }}
    >
      {/* ── Background video — neural network ──────────────────────────── */}
      {/* Sits behind everything else; muted/autoplay/loop/playsInline for       */}
      {/* cross-platform support. Respects prefers-reduced-motion via media query. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="motion-safe:block motion-reduce:hidden absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: 0.45,
          mixBlendMode: "screen",
        }}
      >
        <source src="/videos/neural-hero.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay to keep text legible over the video */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,11,20,0.55) 0%, rgba(5,11,20,0.35) 50%, rgba(5,11,20,0.75) 100%)",
        }}
      />
      {/* Left-side darkening — makes text panel readable on bright frames */}
      <div
        className="hidden lg:block pointer-events-none absolute inset-y-0 left-0 w-2/3"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,11,20,0.85) 0%, rgba(5,11,20,0.55) 50%, transparent 100%)",
        }}
      />

      {/* ── Background blobs ───────────────────────────────────────────── */}
      <div
        className="animate-blob-1 pointer-events-none absolute -top-40 -left-40 rounded-full opacity-[0.12]"
        style={{
          width: 700,
          height: 700,
          background: "radial-gradient(circle, #0056CE 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="animate-blob-2 pointer-events-none absolute -bottom-40 -right-40 rounded-full opacity-[0.10]"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* ── LUSION-STYLE NAV ───────────────────────────────────────────── */}
      <nav className="relative z-30 w-full">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
          <Logo variant="light" size="md" />

          {/* Right side — Lusion-inspired */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/about"
              className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors"
              style={{ minHeight: "unset" }}
            >
              About
            </Link>
            <Link
              href="/login"
              className="hidden sm:block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors"
              style={{ minHeight: "unset" }}
            >
              Sign In
            </Link>
            {/* "GET STARTED •" pill — Lusion style dark pill */}
            <Link
              href="/signup"
              className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full text-white text-xs font-bold tracking-wide uppercase hover:opacity-80 transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                minHeight: "unset",
              }}
            >
              Get Started
              <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            </Link>
            {/* Mobile Sign In */}
            <Link
              href="/login"
              className="sm:hidden text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50 hover:text-white transition-colors"
              style={{ minHeight: "unset" }}
            >
              In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO BODY ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto w-full px-6 sm:px-8">

        {/* LEFT — Text */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center py-8 lg:py-0">

          {/* Tag line */}
          <div className="mb-6 sm:mb-8">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-brand border border-brand/30 bg-brand/10 px-3 py-1.5 rounded-full">
              AI Powered Learn to Launch Platform
            </span>
          </div>

          {/* HEADLINE — Loaf-style HUGE bold typography */}
          <h1
            className="font-black leading-[0.92] tracking-tight text-white mb-6 sm:mb-8"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            The AI
            <br />
            tutor that
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #3388FF 0%, #6366f1 50%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              gets you
            </span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #3388FF 0%, #6366f1 50%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              hired.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8 sm:mb-10 max-w-sm">
            Get assessed. Get a personalised plan.
            Build 10–12 real projects.
            Land the job or start your company.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-brand font-bold text-sm hover:bg-slate-100 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(0,86,206,0.3)] hover:-translate-y-px"
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-white text-sm font-semibold transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Sign in
            </Link>
          </div>

          {/* Mini trust bar */}
          <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-600 uppercase tracking-widest">
            <span>12 Subjects</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>10–12 Projects</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>AI Graded</span>
          </div>
        </div>

        {/* RIGHT — Particle Globe (desktop, absolute) */}
        <div
          className="hidden lg:flex absolute right-0 top-0 bottom-0 w-[55%] items-center justify-center pointer-events-none"
          style={{ userSelect: "none" }}
        >
          {mounted && (
            <div style={{ width: 600, height: 600 }}>
              <ParticleGlobe
                particleCount={1400}
                radius={240}
                color2="#0056CE"
              />
            </div>
          )}
        </div>

        {/* Mobile globe — centered below text */}
        <div className="lg:hidden mt-8 w-full flex justify-center pointer-events-none">
          {mounted && (
            <div style={{ width: 300, height: 300 }}>
              <ParticleGlobe
                particleCount={600}
                radius={120}
                color2="#0056CE"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── LUSION-STYLE BOTTOM BAR ────────────────────────────────────── */}
      <div className="relative z-20 w-full border-t border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center gap-4">
          <span className="text-white/20 text-xs font-light">+</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/30 font-medium whitespace-nowrap">
            Scroll to explore
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-white/20 text-xs font-light">+</span>
        </div>
      </div>
    </section>
  );
}
