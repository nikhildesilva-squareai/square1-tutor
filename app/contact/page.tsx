import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const CONTACTS = [
  {
    label: "General Enquiries",
    email: "hello@square1.ai",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
  {
    label: "Careers",
    email: "careers@square1.ai",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    label: "Partnerships",
    email: "partnerships@square1.ai",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/square1ai",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/square1ai",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/nikhildesilva-squareai",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@square1ai",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen" style={{ background: "#050B14" }}>
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 pt-8">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-white transition-colors"
          style={{ minHeight: "unset" }}
        >
          &larr; Home
        </Link>
      </div>

      {/* Headline */}
      <div className="text-center max-w-3xl mx-auto px-6 sm:px-8 mt-20 sm:mt-24">
        <h1
          className="font-black tracking-tight text-white leading-[1.05] mb-6"
          style={{ fontSize: "clamp(36px, 6vw, 68px)", letterSpacing: "-0.03em" }}
        >
          Get in{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            touch.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          We&apos;d love to hear from you — whether you&apos;re a student, a partner, or just
          curious.
        </p>
      </div>

      {/* Contact cards */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 mt-14 sm:mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CONTACTS.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl p-6 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {c.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{c.label}</h3>
              <a
                href={`mailto:${c.email}`}
                className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4"
              >
                {c.email}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Social links */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 mt-14 sm:mt-16 text-center">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-6">
          Follow Us
        </h2>
        <div className="flex items-center justify-center gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/25 transition-colors"
              aria-label={s.label}
              style={{ minHeight: "unset" }}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="pb-20 sm:pb-28" />
    </main>
  );
}
