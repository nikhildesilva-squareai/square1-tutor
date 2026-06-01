import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types/database";

// ─── Server-side data fetch ───────────────────────────────────────────────────
async function getCourses(): Promise<Course[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(8);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── HOW IT WORKS steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    n: "01",
    icon: "📝",
    title: "Take the Assessment",
    desc: "20 questions — MCQ, short answer, and code. AI grades everything. 30 minutes.",
  },
  {
    n: "02",
    icon: "📊",
    title: "Get Your Skill Report",
    desc: "See exactly where you stand. Topics, strengths, gaps, and AI recommendations.",
  },
  {
    n: "03",
    icon: "🗓️",
    title: "Choose Your Plan",
    desc: "3, 6, or 9 months. Adapts to your schedule and skill level automatically.",
  },
  {
    n: "04",
    icon: "🚀",
    title: "Build Real Projects",
    desc: "10–12 deployed projects. A live portfolio employers can actually verify.",
  },
];

// ─── DIFFERENTIATORS ──────────────────────────────────────────────────────────
const DIFFS = [
  {
    icon: "🤖",
    title: "AI grades your code",
    desc: "Not just multiple choice. Your short answers and code submissions are graded by Claude AI with line-by-line feedback.",
  },
  {
    icon: "🚀",
    title: "Real projects, not toy apps",
    desc: "Every project is deployable. By the end you have 10–12 live GitHub repos a hiring manager can actually review.",
  },
  {
    icon: "📊",
    title: "Adapts to your level",
    desc: "Assessment determines if you're beginner, intermediate, or advanced. The curriculum adjusts so you're never bored or lost.",
  },
];

// ─── STATS ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "8", label: "Subjects" },
  { value: "40+", label: "Lessons per course" },
  { value: "10–12", label: "Projects per student" },
  { value: "AI-powered", label: "Grading" },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const courses = await getCourses();

  return (
    <main className="flex flex-col min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#00183A" }}
      >
        {/* Animated gradient blobs */}
        <style>{`
          @keyframes blob-drift-a {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(60px, -40px) scale(1.1); }
            66% { transform: translate(-30px, 50px) scale(0.95); }
          }
          @keyframes blob-drift-b {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-50px, 60px) scale(1.05); }
            66% { transform: translate(70px, -30px) scale(0.92); }
          }
          .blob-a {
            animation: blob-drift-a 18s ease-in-out infinite;
          }
          .blob-b {
            animation: blob-drift-b 22s ease-in-out infinite;
          }
        `}</style>

        {/* Blob A — brand blue */}
        <div
          className="blob-a pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, #0056CE 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Blob B — indigo */}
        <div
          className="blob-b pointer-events-none absolute -bottom-40 right-0 w-[700px] h-[700px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #3730a3 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo variant="light" size="md" />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors font-semibold"
            >
              Get Started →
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-28 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
            The AI tutor that
            <br />
            <span style={{ color: "#3388FF" }}>gets you hired.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Get assessed. Get a personalised plan. Build 10–12 real projects.
            Land the job or start your company.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl bg-white text-brand font-bold text-base hover:bg-slate-100 transition-colors shadow-lg"
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 flex flex-col items-center gap-2 text-slate-500">
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface-soft">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-brand uppercase tracking-widest">
              The process
            </span>
            <h2 className="mt-3 text-4xl font-bold text-ink">
              From zero to hired in one platform
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div
              className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-border"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.n} className="relative flex flex-col items-center text-center">
                  {/* Number circle */}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-brand flex flex-col items-center justify-center shadow-[0_4px_24px_rgb(0_86_206_/_0.3)] mb-5">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <span className="absolute top-0 right-1/2 translate-x-8 -translate-y-1 text-xs font-bold text-brand-light bg-surface-tint px-2 py-0.5 rounded-full border border-brand/20">
                    {step.n}
                  </span>
                  <h3 className="text-base font-bold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COURSES ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand uppercase tracking-widest">
              Curriculum
            </span>
            <h2 className="mt-3 text-4xl font-bold text-ink">
              8 subjects. All tech. All in-demand.
            </h2>
          </div>

          {courses.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {courses.slice(0, 8).map((course) => (
                  <div
                    key={course.id}
                    className="bg-surface-soft rounded-xl p-5 border border-border hover:shadow-[0_4px_24px_rgb(0_86_206_/_0.12)] transition-shadow group"
                    style={{ borderLeft: `4px solid ${course.color || "#0056CE"}` }}
                  >
                    <div className="text-3xl mb-3">{course.icon}</div>
                    <h3 className="font-bold text-ink text-sm leading-snug mb-1 group-hover:text-brand transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <span className="text-[11px] font-semibold text-brand bg-surface-tint px-2 py-1 rounded-full">
                      {course.total_projects} projects · {course.total_lessons} lessons
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link
                  href="/courses"
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  See all courses →
                </Link>
              </div>
            </>
          ) : (
            // Fallback when no Supabase data available
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "🐍", title: "Python", desc: "From scripting to data pipelines", color: "#3776AB", projects: 11, lessons: 42 },
                { icon: "⚛️", title: "React & Next.js", desc: "Modern frontend & full-stack", color: "#61DAFB", projects: 12, lessons: 48 },
                { icon: "🛢️", title: "SQL & Databases", desc: "Relational design to query optimisation", color: "#F29111", projects: 10, lessons: 38 },
                { icon: "🤖", title: "AI & LLMs", desc: "Prompt engineering to deployed AI apps", color: "#0056CE", projects: 12, lessons: 44 },
                { icon: "☁️", title: "Cloud & DevOps", desc: "AWS, Docker, CI/CD pipelines", color: "#FF9900", projects: 10, lessons: 40 },
                { icon: "🔐", title: "Cybersecurity", desc: "Foundations to ethical hacking", color: "#E53E3E", projects: 10, lessons: 36 },
                { icon: "📱", title: "Mobile (React Native)", desc: "Cross-platform app development", color: "#61DAFB", projects: 11, lessons: 40 },
                { icon: "📊", title: "Data Science", desc: "Analysis, visualisation, ML basics", color: "#19A65F", projects: 10, lessons: 42 },
              ].map((c) => (
                <div
                  key={c.title}
                  className="bg-surface-soft rounded-xl p-5 border border-border hover:shadow-[0_4px_24px_rgb(0_86_206_/_0.12)] transition-shadow"
                  style={{ borderLeft: `4px solid ${c.color}` }}
                >
                  <div className="text-3xl mb-3">{c.icon}</div>
                  <h3 className="font-bold text-ink text-sm leading-snug mb-1">{c.title}</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed mb-3">{c.desc}</p>
                  <span className="text-[11px] font-semibold text-brand bg-surface-tint px-2 py-1 rounded-full">
                    {c.projects} projects · {c.lessons} lessons
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface-soft">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-brand uppercase tracking-widest">
              Why Square 1
            </span>
            <h2 className="mt-3 text-4xl font-bold text-ink">Built different. By design.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIFFS.map((d) => (
              <div
                key={d.title}
                className="bg-surface rounded-2xl p-8 border border-border shadow-[0_1px_2px_rgb(15_23_42_/_0.05)] hover:shadow-[0_4px_24px_rgb(0_86_206_/_0.12)] transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-tint flex items-center justify-center text-2xl mb-5">
                  {d.icon}
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">{d.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <section style={{ background: "#00183A" }} className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-surface text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-brand uppercase tracking-widest">
            Ready to start?
          </span>
          <h2 className="mt-4 text-5xl font-bold text-ink leading-tight">
            Your portfolio
            <br />
            starts today.
          </h2>
          <p className="mt-5 text-lg text-ink-secondary leading-relaxed">
            Join thousands of learners building real skills, real projects, real careers.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-brand text-white font-bold text-lg hover:bg-brand-dark transition-colors shadow-[0_4px_24px_rgb(0_86_206_/_0.3)]"
          >
            Get started for free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#00183A" }} className="py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 text-center">
          <Logo variant="light" size="sm" />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:hello@square1.ai" className="hover:text-white transition-colors">
              Contact
            </a>
          </nav>
          <p className="text-xs text-slate-500 max-w-lg">
            Square 1 AI is GDPR compliant. We store only essential data. Hosted on Supabase (EU
            servers available).
          </p>
          <p className="text-xs text-slate-600">© 2026 Square 1 AI</p>
        </div>
      </footer>
    </main>
  );
}
