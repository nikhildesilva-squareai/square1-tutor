"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ─── Inquiry categories ───────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "learning",
    label: "Learning Enquiry",
    desc: "Questions about courses, assessment, or the learning experience",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
    accent: "#3388FF",
  },
  {
    id: "careers",
    label: "Careers at Square1 Ai",
    desc: "Interested in joining our team? Let's chat",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    accent: "#A78BFA",
  },
  {
    id: "partnerships",
    label: "Partnerships",
    desc: "Partner with us — integrations, co-marketing, or referrals",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    accent: "#10B981",
  },
  {
    id: "university",
    label: "University / Institution",
    desc: "Explore Square1 Ai for your students or organisation",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    accent: "#F59E0B",
  },
];

const SOCIALS = [
  {
    label: "LinkedIn", href: "https://linkedin.com/company/square1ai",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    label: "X", href: "https://x.com/square1ai",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: "GitHub", href: "https://github.com/nikhildesilva-squareai",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>,
  },
  {
    label: "YouTube", href: "https://youtube.com/@square1ai",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
];

const CALENDLY_URL = "https://calendly.com/nikhil-desilva-square1ai";

export default function ContactPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <main className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-8 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(180deg, #050B14 0%, #0B1626 100%)" }}
      >
        <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* Nav */}
        <nav className="relative z-30 max-w-6xl mx-auto flex items-center justify-between mb-16 sm:mb-20">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors" style={{ minHeight: "unset" }}>
            <span>←</span> <Logo variant="light" size="sm" />
          </Link>
          <Link href="/signup"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-wide uppercase hover:opacity-80 transition-all"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", minHeight: "unset" }}>
            Get Started <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
          </Link>
        </nav>

        {/* Headline */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6"
            style={{ background: "rgba(51,136,255,0.10)", borderColor: "rgba(51,136,255,0.30)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand">Contact Us</span>
          </div>

          <h1 className="font-black tracking-tight text-white leading-[0.95] mb-6"
            style={{ fontSize: "clamp(36px, 6vw, 80px)", letterSpacing: "-0.03em" }}>
            Let&apos;s{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              talk.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            Pick a reason, book a time, and we&apos;ll be there. Or just email us at{" "}
            <a href="mailto:tech@square1ai.com" className="text-brand hover:underline font-semibold">tech@square1ai.com</a>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* INQUIRY CATEGORIES + CALENDLY EMBED */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 20% 25%, rgba(0,86,206,0.08), transparent 60%),
            radial-gradient(ellipse 800px 500px at 80% 75%, rgba(167,139,250,0.07), transparent 60%),
            linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
          `,
        }}
      >
        <div className="relative max-w-5xl mx-auto">

          {/* Step 1: Choose your reason */}
          <div className="text-center mb-10">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Step 1
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              What&apos;s this about?
            </h2>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="relative rounded-2xl p-5 border text-left transition-all hover:shadow-lg group"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${cat.accent}15 0%, #FFFFFF 50%, ${cat.accent}08 100%)`
                      : "#FFFFFF",
                    borderColor: isActive ? `${cat.accent}50` : "rgba(15,23,42,0.08)",
                    boxShadow: isActive ? `0 8px 24px ${cat.accent}20` : "0 2px 8px rgba(15,23,42,0.04)",
                    minHeight: "unset",
                  }}
                >
                  {/* Accent blob on active */}
                  {isActive && (
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-50"
                      style={{ background: `radial-gradient(circle, ${cat.accent}25 0%, transparent 70%)`, filter: "blur(12px)" }} />
                  )}

                  <div className="relative">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                      style={{
                        background: isActive ? `${cat.accent}20` : "rgba(15,23,42,0.04)",
                        border: `1px solid ${isActive ? `${cat.accent}40` : "rgba(15,23,42,0.06)"}`,
                        color: isActive ? cat.accent : "#94A3B8",
                      }}
                    >
                      {cat.icon}
                    </div>
                    <h3 className="text-sm font-bold mb-1 transition-colors"
                      style={{ color: isActive ? cat.accent : "#0F172A" }}>
                      {cat.label}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                  </div>

                  {/* Selected indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: cat.accent }}>
                      <span className="text-white text-[10px] font-black">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Step 2: Book a time */}
          <div className="text-center mb-8">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
              Step 2
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Book a time
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {selectedCategory
                ? `Great — you selected "${CATEGORIES.find(c => c.id === selectedCategory)?.label}". Pick a slot below.`
                : "Select a reason above, then pick a time that works for you."
              }
            </p>
          </div>

          {/* Calendly embed */}
          <div
            className="rounded-2xl border overflow-hidden transition-all duration-500"
            style={{
              borderColor: selectedCategory
                ? `${CATEGORIES.find(c => c.id === selectedCategory)?.accent ?? "#3388FF"}30`
                : "rgba(15,23,42,0.08)",
              boxShadow: selectedCategory
                ? `0 12px 40px ${CATEGORIES.find(c => c.id === selectedCategory)?.accent ?? "#3388FF"}15`
                : "0 4px 16px rgba(15,23,42,0.04)",
              opacity: selectedCategory ? 1 : 0.6,
            }}
          >
            <iframe
              src={`${CALENDLY_URL}?hide_gdpr_banner=1&hide_landing_page_details=1`}
              width="100%"
              height="660"
              frameBorder="0"
              title="Book a meeting with Square1 Ai"
              className="w-full"
              style={{ minHeight: 660, background: "#FFFFFF" }}
            />
          </div>

          {/* Or just email */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Prefer email? Reach us at{" "}
              <a href="mailto:tech@square1ai.com" className="text-brand hover:underline font-semibold">
                tech@square1ai.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOCIAL LINKS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#050B14" }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Follow Us
          </span>
          <div className="mt-6 flex items-center justify-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/25 hover:scale-110 transition-all"
                aria-label={s.label}
                style={{ minHeight: "unset" }}
              >
                {s.icon}
              </a>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-600">
            tech@square1ai.com · All rights reserved © 2026
          </p>
        </div>
      </section>
    </main>
  );
}
