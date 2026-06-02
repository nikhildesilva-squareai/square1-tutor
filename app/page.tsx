import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TimelineSection } from "@/components/landing/TimelineSection";
import { AICopilotSlider } from "@/components/landing/AICopilotSlider";
import { StatsSection } from "@/components/landing/StatsSection";
import { TransformationStories } from "@/components/landing/TransformationStories";
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

      {/* ── 4. Courses grid — 8 subjects with career outcomes ────────────────── */}
      <CourseGridSection courses={courses} />

      {/* ── 5. AI Co-pilot Slider — Terminal + Tutor + Portfolio (rotates 5s) ── */}
      <AICopilotSlider />

      {/* ── 6. Journey Timeline ──────────────────────────────────────────────── */}
      <TimelineSection />

      {/* ── 7. Skill Radar ───────────────────────────────────────────────────── */}
      <SkillRadarPreview />

      {/* ── 8. Stats ─────────────────────────────────────────────────────────── */}
      <StatsSection />

      {/* ── 9. Student Transformation Stories ────────────────────────────────── */}
      <TransformationStories />

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-24 text-center" style={{ background: "#00183A" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Your portfolio starts today.</h2>
          <p className="text-slate-400 mb-8 sm:mb-10 text-base sm:text-lg">
            Join learners building real skills, real projects, real careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-brand font-bold rounded-xl text-lg hover:bg-slate-100 transition-colors shadow-lg"
            >
              Get started for free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl text-lg hover:border-white/60 hover:bg-white/5 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-10" style={{ background: "#00183A" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="light" />
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:hello@square1.ai" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <p className="text-xs text-slate-500 text-center md:text-right">
            © 2026 Square 1 AI · GDPR Compliant · Essential Eight · SOC 2
          </p>
        </div>
      </footer>

      <CookieConsent />
    </main>
  );
}
