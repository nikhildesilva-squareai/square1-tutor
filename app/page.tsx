import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { RealityBand } from "@/components/landing/RealityBand";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TransformSection } from "@/components/landing/TransformSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { JourneyHook } from "@/components/landing/JourneyHook";
import { CourseGridSection } from "@/components/landing/CourseGridSection";
import { InlineDiagnostic } from "@/components/landing/InlineDiagnostic";
import { CodeReviewSlider } from "@/components/landing/CodeReviewSlider";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { MobileStickyCta } from "@/components/landing/MobileStickyCta";
import { WavePath } from "@/components/ui/wave-path";

// ─── Interactive wavy divider between sections (bends toward the cursor) ───────
function SectionWave() {
  return (
    <div className="relative z-20 flex justify-center text-brand/70">
      <WavePath />
    </div>
  );
}

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
      .is("parent_course_id", null)
      .not("slug", "in", "(game-development,drone-technology,devops-engineering)")
      .order("title");
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── Static fallback courses (matches the 9 world-class courses in Supabase) ─
const FALLBACK_COURSES: CourseRow[] = [
  { id: "1",  slug: "generative-ai",          title: "Generative AI",          description: "Master LLMs, RAG, prompt engineering, and AI agents.",           icon: "🤖", color: "#6366f1", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "2",  slug: "machine-learning",        title: "Machine Learning",       description: "From linear regression to neural networks.",                    icon: "🧠", color: "#8b5cf6", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "3",  slug: "artificial-intelligence",  title: "Artificial Intelligence", description: "Search algorithms, knowledge representation, and planning.",   icon: "⚡", color: "#0ea5e9", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "4",  slug: "cybersecurity",           title: "Cybersecurity",          description: "Ethical hacking, cryptography, OWASP, and incident response.",  icon: "🔐", color: "#ef4444", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "5",  slug: "data-science",            title: "Data Science",           description: "Statistics, SQL, data analysis, and predictive insights.",       icon: "📊", color: "#14b8a6", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "6",  slug: "fullstack-development",   title: "Full Stack Development", description: "APIs, databases, auth, and end-to-end web applications.",       icon: "🚀", color: "#06b6d4", total_lessons: 40, total_projects: 12, status: "active" },
  { id: "7",  slug: "computer-vision",         title: "Computer Vision",        description: "Image processing, CNNs, object detection, and segmentation.",   icon: "👁️", color: "#10b981", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "8",  slug: "llm-agent-architect",     title: "LLM Agent Architect",    description: "Design autonomous AI agents with tool use and orchestration.",  icon: "🤖", color: "#7C3AED", total_lessons: 40, total_projects: 10, status: "active" },
  { id: "9",  slug: "ai-product-management",   title: "AI Product Management",  description: "Ship AI products — strategy, roadmapping, and go-to-market.",  icon: "📋", color: "#0EA5E9", total_lessons: 40, total_projects: 10, status: "active" },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function Home() {
  const dbCourses = await getCourses();
  const courses   = dbCourses.length > 0 ? dbCourses : FALLBACK_COURSES;

  return (
    <main id="main" className="overflow-x-hidden">

      {/* ── 1. Hero (with goal-typer) ───────────────────────────────────────── */}
      <HeroSection courseCount={courses.length} />

      {/* ── 2. THE HOOK — outcome + proof: "Get hired as an [role]" + journey + employer view */}
      <JourneyHook />

      <SectionWave />

      {/* ── 3. Foot-in-the-door: one inline question → act by screen two ─────── */}
      <InlineDiagnostic />

      <SectionWave />

      {/* ── 4. The 2026 wedge — slim stakes strip ────────────────────────────── */}
      <RealityBand />

      <SectionWave />

      {/* ── 5. Before/After — drag to see Nova review your code ──────────────── */}
      <CodeReviewSlider />

      <SectionWave />

      {/* ── 6. Before → after: the learner's six-month transformation ─────────── */}
      <TransformSection />

      <SectionWave />

      {/* ── 7. Why Square 1 beats everything else ────────────────────────────── */}
      <ComparisonSection />

      <SectionWave />

      {/* ── 7. Courses — inline explorer (click → preview Lesson 1) ──────────── */}
      <CourseGridSection courses={courses} />

      <SectionWave />

      {/* ── 8. Honest proof — founder note + founding offer ──────────────────── */}
      <SocialProofSection courseCount={courses.length} />

      <SectionWave />

      {/* ── 9. Pricing — free start, founding rate locked for life ───────────── */}
      <PricingSection />

      <SectionWave />

      {/* ── 10. FAQ — objections answered + FAQPage structured data ──────────── */}
      <FAQSection courseCount={courses.length} />

      <SectionWave />

      {/* ── About + Final CTA + Footer ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">

        {/* Background accents — subtle blue on white */}
        <div className="pointer-events-none absolute top-1/4 left-0 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #0056CE 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="pointer-events-none absolute bottom-1/4 right-0 translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)", filter: "blur(100px)" }} />

        {/* ── About Square 1 Ai ───────────────────────────────────────── */}
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 pt-14 sm:pt-20 lg:pt-24 pb-16 sm:pb-20">
          {/* Logo centered + large */}
          <div className="flex justify-center mb-10">
            <Logo variant="dark" size="xl" />
          </div>

          {/* Mission statement */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-black tracking-tight text-slate-900 leading-[1.05] mb-6"
              style={{ fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.03em" }}>
              We&apos;re building the future of{" "}
              <span style={{
                background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                technical education.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              Square1 Ai is an AI-powered learn-to-launch platform.
              We don&apos;t just teach you — we assess your level, personalise your path,
              grade every line of code you write, and walk you from day one to a deployed
              portfolio you can put in front of any employer.
            </p>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Traditional education gives you theory and hopes you figure out the rest.
              Bootcamps rush you through and hand you a certificate.{" "}
              <span className="text-slate-900 font-semibold">We give you 10+ deployed projects,
              Nova — an AI tutor that knows your code — and a skill report that proves you&apos;re
              ready. </span>That&apos;s the difference.
            </p>
          </div>

          {/* Principles row */}
          <div className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                label: "Proof over certificates",
                desc: "10+ real projects. Live on GitHub. Run the code, not a PDF.",
                accent: "#3388FF",
              },
              {
                label: "Feedback over content",
                desc: "Content is free on YouTube. Personalised AI feedback on YOUR code isn't.",
                accent: "#0EA5E9",
              },
              {
                label: "Outcomes over promises",
                desc: "Every course maps to a real role with a real salary. That's the bar.",
                accent: "#0056CE",
              },
            ].map((p) => (
              <div key={p.label} className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${p.accent}15`, border: `1px solid ${p.accent}30` }}>
                  <Check size={16} strokeWidth={3} style={{ color: p.accent }} aria-hidden />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">{p.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="max-w-md mx-auto px-6 flex items-center gap-4 py-8">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[9px] tracking-[0.35em] uppercase text-slate-500 font-bold whitespace-nowrap">
            Ready?
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-24 text-center">
          <h3 className="font-black tracking-tight text-slate-900 leading-[0.95] mb-5"
            style={{ fontSize: "clamp(36px, 6vw, 76px)" }}>
            Your career starts
            <br />
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              with one test.
            </span>
          </h3>

          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-10">
            30 minutes. Free forever. No credit card.
            <br />Find out where you stand — and exactly how to get where you want to be.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <PrimaryCta href="/diagnostic" size="lg">
              Get your free skill report
            </PrimaryCta>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-5 rounded-full text-slate-700 text-base font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
            >
              Sign in
            </Link>
          </div>

          <p className="text-[10px] text-slate-600 tracking-widest uppercase">
            {courses.length} subjects · 10+ projects per course · AI graded · Career-mapped
          </p>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {/* Stays deep Square 1 navy — the page anchor under the white content */}
        <footer className="relative border-t border-white/[0.06]" style={{ background: "#00183A" }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 md:gap-8">

              {/* Col 1 — Brand + Social */}
              <div>
                <Logo variant="light" size="md" />
                <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-xs">
                  The AI-powered learn-to-launch platform.
                  From assessment to deployed portfolio.
                </p>
                {/* Social links */}
                <div className="mt-5 flex items-center gap-3">
                  {[
                    { label: "LinkedIn", href: "https://www.linkedin.com/company/square-1-ai/", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    )},
                    { label: "X", href: "https://x.com/square1ai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    )},
                    { label: "Instagram", href: "https://www.instagram.com/square1ai/", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    )},
                    { label: "Facebook", href: "https://facebook.com/square1ai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    )},
                    { label: "YouTube", href: "https://youtube.com/@square1ai", icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    )},
                  ].map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/25 transition-colors"
                      aria-label={s.label}>
                      {s.icon}
                    </a>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-[10px] tracking-widest uppercase text-slate-400 font-bold px-2 py-1 rounded border border-white/[0.10]">Australia-hosted</span>
                  <span className="text-[10px] tracking-widest uppercase text-slate-400 font-bold px-2 py-1 rounded border border-white/[0.10]">SSL Encrypted</span>
                </div>
              </div>

              {/* Col 2 — Learn (DB-driven course links) */}
              <div>
                <h5 className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mb-4">Learn</h5>
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/diagnostic" className="text-sm text-slate-300 font-semibold hover:text-white transition-colors">
                      Free 3-min skill check
                    </Link>
                  </li>
                  {courses.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/try/${c.slug}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3 — Company */}
              <div>
                <h5 className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mb-4">Company</h5>
                <ul className="space-y-2.5">
                  <li><Link href="/#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link href="/research" className="text-sm text-slate-400 hover:text-white transition-colors">Research</Link></li>
                  <li><Link href="/business" className="text-sm text-slate-400 hover:text-white transition-colors">For Teams</Link></li>
                  <li><Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/careers" className="text-sm text-slate-400 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>

              {/* Col 4 — Legal */}
              <div>
                <h5 className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mb-4">Legal</h5>
                <ul className="space-y-2.5">
                  <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                © 2026 Square 1 Ai. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </section>

      <CookieConsent />
      <MobileStickyCta />
    </main>
  );
}
