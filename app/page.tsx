import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { TerminalDemo } from "@/components/landing/TerminalDemo";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { TimelineSection } from "@/components/landing/TimelineSection";
import { TutorChatPreview } from "@/components/landing/TutorChatPreview";
import { GitHubPortfolio } from "@/components/landing/GitHubPortfolio";
import { StatsSection } from "@/components/landing/StatsSection";
import { TransformationStories } from "@/components/landing/TransformationStories";
import { SkillRadarPreview } from "@/components/landing/SkillRadarPreview";
import { JourneySection } from "@/components/landing/JourneySection";
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

      {/* ── 2. Journey (sticky scroll) ───────────────────────────────────────── */}
      <JourneySection />

      {/* ── 2b. Terminal Demo ────────────────────────────────────────────────── */}
      <TerminalDemo />

      {/* ── 3. Comparison ────────────────────────────────────────────────────── */}
      <ComparisonSection />

      {/* ── 4. Interactive Demo ──────────────────────────────────────────────── */}
      <InteractiveDemo />

      {/* ── 5. Courses grid ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand uppercase tracking-widest">
              Curriculum
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-ink">
              8 subjects. All tech. All in-demand.
            </h2>
            <p className="mt-3 text-ink-muted">
              Every course has an assessment, personalised plan, and 10–12 projects.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={course.status === "active" && course.slug !== "#" ? `/courses/${course.slug}` : "#"}
                className="group relative p-5 rounded-2xl bg-surface-soft border-2 border-border hover:border-brand hover:shadow-card-hover transition-all overflow-hidden"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl group-hover:w-1.5 transition-all"
                  style={{ backgroundColor: course.color }}
                />
                <div className="text-3xl mb-3">{course.icon}</div>
                <h3 className="font-bold text-ink text-sm leading-snug mb-1 group-hover:text-brand transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-ink-muted mb-3 line-clamp-2">{course.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] bg-surface-alt text-ink-secondary px-2 py-0.5 rounded-full">
                    {course.total_lessons} lessons
                  </span>
                  <span className="text-[10px] bg-surface-alt text-ink-secondary px-2 py-0.5 rounded-full">
                    {course.total_projects} projects
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/courses" className="inline-flex items-center gap-2 text-brand font-semibold hover:underline">
              Browse all courses →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Journey Timeline ──────────────────────────────────────────────── */}
      <TimelineSection />

      {/* ── 7. AI Tutor Chat Preview ─────────────────────────────────────────── */}
      <TutorChatPreview />

      {/* ── 8. GitHub Portfolio ──────────────────────────────────────────────── */}
      <GitHubPortfolio />

      {/* ── 9. Skill Radar ───────────────────────────────────────────────────── */}
      <SkillRadarPreview />

      {/* ── 10. Stats ────────────────────────────────────────────────────────── */}
      <StatsSection />

      {/* ── 11. Student Transformation Stories ──────────────────────────────── */}
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
