import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TimelineSection } from "@/components/landing/TimelineSection";
import { AICopilotSlider } from "@/components/landing/AICopilotSlider";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { SkillRadarPreview } from "@/components/landing/SkillRadarPreview";
import { JourneyHook } from "@/components/landing/JourneyHook";
import { CourseGridSection } from "@/components/landing/CourseGridSection";
import { CookieConsent } from "@/components/ui/cookie-consent";

// ─── Server-side data fetch ───────────────────────────────────────────────────
type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  total_lessons: number;
  total_projects: number;
  status: string;
};

async function getCourses(): Promise<CourseRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("courses")
      .select("id,slug,title,description,icon,color,total_lessons,total_projects,status")
      .order("title");
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── Static fallback courses (shown when Supabase is not yet configured) ──────
const FALLBACK_COURSES: CourseRow[] = [
  { id: "1", slug: "#", title: "Python",             description: "From scripting to data pipelines",      icon: "🐍", color: "#3776AB", total_lessons: 42, total_projects: 11, status: "active" },
  { id: "2", slug: "#", title: "React & Next.js",    description: "Modern frontend & full-stack",           icon: "⚛️", color: "#61DAFB", total_lessons: 48, total_projects: 12, status: "active" },
  { id: "3", slug: "#", title: "SQL & Databases",    description: "Relational design to query optimisation",icon: "🛢️", color: "#F29111", total_lessons: 38, total_projects: 10, status: "active" },
  { id: "4", slug: "#", title: "AI & LLMs",          description: "Prompt engineering to deployed AI apps", icon: "🤖", color: "#0056CE", total_lessons: 44, total_projects: 12, status: "active" },
  { id: "5", slug: "#", title: "Cloud & DevOps",     description: "AWS, Docker, CI/CD pipelines",          icon: "☁️", color: "#FF9900", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "6", slug: "#", title: "Cybersecurity",      description: "Foundations to ethical hacking",        icon: "🔐", color: "#E53E3E", total_lessons: 36, total_projects: 10, status: "active" },
  { id: "7", slug: "#", title: "Mobile (React Native)", description: "Cross-platform app development",     icon: "📱", color: "#61DAFB", total_lessons: 40, total_projects: 11, status: "active" },
  { id: "8", slug: "#", title: "Data Science",       description: "Analysis, visualisation, ML basics",    icon: "📊", color: "#19A65F", total_lessons: 42, total_projects: 10, status: "active" },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function Home() {
  const dbCourses = await getCourses();
  const courses   = dbCourses.length > 0 ? dbCourses : FALLBACK_COURSES;

  return (
    <main className="overflow-x-hidden">

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── 2. THE HOOK — Why take the course + 5-step journey + red CTA ────── */}
      <JourneyHook />

      {/* ── 3. Why Square 1 beats everything else (moved up · gradient bg) ──── */}
      <ComparisonSection />

      {/* ── 4. Courses grid — 12 subjects with career outcomes ───────────────── */}
      <CourseGridSection courses={courses} />

      {/* ── 5. AI Co-pilot Slider — Terminal + Tutor + Portfolio (rotates 5s) ── */}
      <AICopilotSlider />

      {/* ── 6. Journey Timeline ──────────────────────────────────────────────── */}
      <TimelineSection />

      {/* ── 7. Skill Radar ───────────────────────────────────────────────────── */}
      <SkillRadarPreview />

      {/* ── 8. Social Proof — rotating stories + embedded stats ────────────── */}
      <SocialProofSection />

      {/* ── About + Final CTA + Footer ────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "#050B14" }}>

        {/* Background accents */}
        <div className="pointer-events-none absolute top-1/4 left-0 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute bottom-1/4 right-0 translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* ── About Square 1 Ai ───────────────────────────────────────── */}
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-20">
          {/* Logo centered + large */}
          <div className="flex justify-center mb-10">
            <Logo variant="light" size="xl" />
          </div>

          {/* Mission statement */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-black tracking-tight text-white leading-[1.05] mb-6"
              style={{ fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.03em" }}>
              We&apos;re building the future of{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                technical education.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
              Square1 Ai is the world&apos;s first AI-powered learn-to-launch platform.
              We don&apos;t just teach you — we assess your level, personalise your path,
              grade every line of code you write, and walk you from day one to a deployed
              portfolio and a real job offer.
            </p>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Traditional education gives you theory and hopes you figure out the rest.
              Bootcamps rush you through and hand you a certificate.{" "}
              <span className="text-white font-semibold">We give you 12 deployed projects,
              an AI tutor that knows your code, and a skill report that proves you&apos;re
              ready.</span> That&apos;s the difference.
            </p>
          </div>

          {/* Principles row */}
          <div className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                label: "Proof over certificates",
                desc: "12 real projects. Live on GitHub. Run the code, not a PDF.",
                accent: "#3388FF",
              },
              {
                label: "Feedback over content",
                desc: "Content is free on YouTube. Personalised AI feedback on YOUR code isn't.",
                accent: "#A78BFA",
              },
              {
                label: "Outcomes over promises",
                desc: "Every course maps to a real role with a real salary. That's the bar.",
                accent: "#10B981",
              },
            ].map((p) => (
              <div key={p.label} className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${p.accent}15`, border: `1px solid ${p.accent}30` }}>
                  <span className="text-sm font-black" style={{ color: p.accent }}>✓</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{p.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="max-w-md mx-auto px-6 flex items-center gap-4 py-8">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[9px] tracking-[0.35em] uppercase text-slate-600 font-bold whitespace-nowrap">
            Ready?
          </span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-24 text-center">
          <h3 className="font-black tracking-tight text-white leading-[0.95] mb-5"
            style={{ fontSize: "clamp(36px, 6vw, 76px)" }}>
            Your career starts
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              with one test.
            </span>
          </h3>

          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-10">
            30 minutes. Free forever. No credit card.
            <br />Find out where you stand — and exactly how to get where you want to be.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base lg:text-lg font-bold text-white overflow-hidden transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)",
                boxShadow: "0 16px 48px rgba(220,38,38,0.40), 0 0 0 1px rgba(255,255,255,0.10) inset",
              }}
            >
              <span className="relative z-10">Take the assessment</span>
              <span className="relative z-10 text-xl transition-transform group-hover:translate-x-2">→</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-5 rounded-2xl text-white text-base font-semibold transition-all hover:bg-white/[0.06]"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Sign in
            </Link>
          </div>

          <p className="text-[10px] text-slate-600 tracking-widest uppercase">
            12 subjects · 12 projects per course · AI graded · Career-mapped
          </p>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="relative border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

              {/* Col 1 — Brand + Social */}
              <div>
                <Logo variant="light" size="md" />
                <p className="mt-4 text-xs text-slate-500 leading-relaxed max-w-xs">
                  The world&apos;s first AI-powered learn-to-launch platform.
                  From assessment to job offer.
                </p>
                {/* Social links */}
                <div className="mt-5 flex items-center gap-3">
                  {[
                    { label: "LinkedIn", href: "https://linkedin.com/company/square1ai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    )},
                    { label: "X", href: "https://x.com/square1ai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    )},
                    { label: "GitHub", href: "https://github.com/nikhildesilva-squareai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    )},
                    { label: "YouTube", href: "https://youtube.com/@square1ai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    )},
                  ].map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/25 transition-colors"
                      aria-label={s.label} style={{ minHeight: "unset" }}>
                      {s.icon}
                    </a>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-[9px] tracking-widest uppercase text-slate-600 font-bold px-2 py-1 rounded border border-white/[0.08]">GDPR</span>
                  <span className="text-[9px] tracking-widest uppercase text-slate-600 font-bold px-2 py-1 rounded border border-white/[0.08]">SOC 2</span>
                  <span className="text-[9px] tracking-widest uppercase text-slate-600 font-bold px-2 py-1 rounded border border-white/[0.08]">Essential 8</span>
                </div>
              </div>

              {/* Col 2 — Company */}
              <div>
                <h5 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-4">Company</h5>
                <ul className="space-y-2.5">
                  <li><Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/careers" className="text-sm text-slate-400 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>

              {/* Col 3 — Legal */}
              <div>
                <h5 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-4">Legal</h5>
                <ul className="space-y-2.5">
                  <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-600">
                © 2026 Square 1 Ai. All rights reserved.
              </p>
              <p className="text-[10px] text-slate-700 text-center sm:text-right">
                Built with ❤️ for learners who want more than tutorials.
              </p>
            </div>
          </div>
        </footer>
      </section>

      <CookieConsent />
    </main>
  );
}
