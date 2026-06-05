import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProjectSubmission } from "@/types/database";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ProjectWithSubmission {
  submission: ProjectSubmission;
  project: { id: string; title: string; tech_stack: string[]; difficulty: string; course_id: string; order_index: number };
  course: { title: string; color: string } | null;
}

function getCareerLevel(avgScore: number): { label: string; color: string; bg: string; border: string; tier: number } {
  if (avgScore >= 90) return { label: "Senior Engineer", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", tier: 5 };
  if (avgScore >= 80) return { label: "AI Engineer",     color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    tier: 4 };
  if (avgScore >= 70) return { label: "Mid-Level",       color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200",  tier: 3 };
  if (avgScore >= 60) return { label: "Junior Engineer",  color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   tier: 2 };
  return { label: "Foundation",  color: "text-ink-muted",  bg: "bg-surface-alt",  border: "border-border",  tier: 1 };
}

/* ─── Score ring (SVG) ─────────────────────────────────────────────────── */
function ScoreRing({ score, max, size = 64, color = "#0056CE" }: { score: number; max: number; size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? score / max : 0;
  const offset = circ * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CAREER PORTFOLIO                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) return null;

  // Fetch submissions
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("*")
    .eq("student_id", student.id)
    .not("score", "is", null)
    .order("submitted_at", { ascending: false }) as { data: ProjectSubmission[] | null };

  const allSubmissions = submissions ?? [];
  const projectIds = allSubmissions.map((s) => s.project_id);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, tech_stack, difficulty, course_id, order_index")
    .in("id", projectIds.length > 0 ? projectIds : ["__none__"]);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));
  const courseIds = [...new Set((projects ?? []).map((p) => p.course_id))];

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, color")
    .in("id", courseIds.length > 0 ? courseIds : ["__none__"]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

  const enriched: ProjectWithSubmission[] = allSubmissions.reduce<ProjectWithSubmission[]>((acc, s) => {
    const project = projectMap.get(s.project_id);
    if (!project) return acc;
    acc.push({ submission: s, project, course: courseMap.get(project.course_id) ?? null });
    return acc;
  }, []);

  // Stats
  const scores = allSubmissions.map((s) => s.score).filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highScore = scores.length > 0 ? Math.max(...scores) : 0;

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id")
    .eq("student_id", student.id)
    .eq("status", "active");

  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);
  const { count: totalProjects } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .in("course_id", enrolledCourseIds.length > 0 ? enrolledCourseIds : ["__none__"]);

  const total = totalProjects ?? 0;
  const deployed = scores.length;
  const readinessPct = total > 0 ? Math.round((deployed / total) * 100) : 0;
  const career = getCareerLevel(avgScore);

  // Tech stack with score weighting
  const techScores = new Map<string, { count: number; totalScore: number }>();
  for (const item of enriched) {
    const s = item.submission.score ?? 0;
    for (const tech of item.project.tech_stack ?? []) {
      const existing = techScores.get(tech) ?? { count: 0, totalScore: 0 };
      existing.count++;
      existing.totalScore += s;
      techScores.set(tech, existing);
    }
  }
  const topTech = [...techScores.entries()]
    .map(([tech, data]) => ({ tech, count: data.count, avg: Math.round(data.totalScore / data.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Achievements
  const achievements: { icon: string; label: string; earned: boolean }[] = [
    { icon: "M12 2L2 7l10 5 10-5-10-5z", label: "First Project", earned: deployed >= 1 },
    { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", label: "5 Projects", earned: deployed >= 5 },
    { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", label: "High Scorer", earned: highScore >= 90 },
    { icon: "M22 11.08V12a10 10 0 11-5.93-9.14", label: "All Complete", earned: deployed >= total && total > 0 },
  ];

  /* ═══ EMPTY STATE ═══ */
  if (enriched.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">Career Portfolio</h1>
            <p className="text-sm text-ink-muted">Your public showcase of completed projects</p>
          </div>
        </div>

        {/* Journey visualization */}
        <div className="bg-surface rounded-2xl border border-border p-8 sm:p-10 text-center">
          <div className="max-w-md mx-auto">
            {/* Visual steps */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[
                { label: "Learn", done: true },
                { label: "Build", done: false },
                { label: "Deploy", done: false },
                { label: "Hired", done: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={[
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                      step.done ? "bg-brand text-white" : "bg-surface-alt text-ink-muted",
                    ].join(" ")}>
                      {step.done ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : i + 1}
                    </div>
                    <span className={["text-[10px] font-bold uppercase tracking-wider", step.done ? "text-brand" : "text-ink-muted"].join(" ")}>
                      {step.label}
                    </span>
                  </div>
                  {i < 3 && <div className={["w-8 h-px mb-5", step.done ? "bg-brand" : "bg-border"].join(" ")} />}
                </div>
              ))}
            </div>

            <h3 className="text-xl font-bold text-ink mb-2">Build projects to fill your portfolio</h3>
            <p className="text-sm text-ink-muted mb-8 leading-relaxed">
              Every project you complete shows up here with your score, tech stack, and links.
              This is what employers see — your proof of skill.
            </p>

            <Link href="/projects"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-all hover:shadow-lg hover:shadow-brand/20">
              Open Project Lab
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ FULL PORTFOLIO ═══ */
  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">

      {/* ── Profile hero ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-8"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg shadow-brand/30">
              {(student.name ?? student.email ?? "?")[0].toUpperCase()}
            </div>

            {/* Name + meta */}
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white mb-1">{student.name ?? student.email}</h1>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${career.color} ${career.bg} ${career.border} border`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                {career.label}
              </div>
              <p className="text-slate-400 text-xs mt-2">
                {deployed} project{deployed !== 1 ? "s" : ""} shipped · {[...new Set(enriched.map(e => e.course?.title))].filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Big score gauge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative">
                <ScoreRing score={avgScore} max={100} size={80} color="#22C55E" />
              </div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mt-1">Avg Score</p>
            </div>
          </div>

          {/* Career readiness bar */}
          <div className="mt-6 bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Career Readiness</span>
              <span className="text-xs text-slate-500 tabular-nums">{deployed}/{total} projects</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${readinessPct}%`, background: "linear-gradient(90deg, #0056CE, #22C55E)" }} />
            </div>
            {/* Level markers */}
            <div className="flex items-center justify-between mt-2">
              {["Foundation", "Junior", "Mid", "Senior", "Lead"].map((lvl, i) => (
                <span key={lvl} className={["text-[9px] font-bold uppercase tracking-wider",
                  career.tier > i ? "text-slate-300" : "text-slate-600"
                ].join(" ")}>{lvl}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats + Achievements row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Skills */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Tech Stack Proficiency</p>
          {topTech.length > 0 ? (
            <div className="space-y-3">
              {topTech.slice(0, 6).map((t) => (
                <div key={t.tech} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-ink w-24 truncate">{t.tech}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${t.avg}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-ink-muted tabular-nums w-8 text-right">{t.avg}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Complete projects to build your skill profile</p>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Achievements</p>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div key={a.label} className={[
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all",
                a.earned ? "bg-surface-tint border-brand/20" : "bg-surface-alt/50 border-border opacity-40",
              ].join(" ")}>
                <div className={[
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  a.earned ? "bg-brand text-white" : "bg-surface-alt text-ink-muted",
                ].join(" ")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={a.icon} />
                  </svg>
                </div>
                <span className={["text-xs font-semibold", a.earned ? "text-ink" : "text-ink-muted"].join(" ")}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Deployed Projects ─────────────────────────────────────────── */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Deployed Projects</p>
      </div>

      <div className="space-y-3">
        {enriched.map((item) => {
          const score = item.submission.score ?? 0;
          const max = item.submission.max_score ?? 100;
          const scoreColor = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
          const courseColor = item.course?.color ?? "#0056CE";

          return (
            <div key={item.submission.id}
              className="bg-surface rounded-xl border border-border p-5 hover:shadow-card hover:border-brand/15 transition-all group">
              <div className="flex items-start gap-5">
                {/* Score ring */}
                <div className="shrink-0 hidden sm:block">
                  <ScoreRing score={score} max={max} size={56} color={scoreColor} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {/* Course dot */}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: courseColor }} />
                    <span className="text-[10px] text-ink-muted font-medium">{item.course?.title}</span>
                    {/* Mobile score */}
                    <span className="sm:hidden text-xs font-bold ml-auto" style={{ color: scoreColor }}>{score}/{max}</span>
                  </div>

                  <h3 className="text-sm font-bold text-ink group-hover:text-brand transition-colors mb-2">
                    {item.project.title}
                  </h3>

                  {/* Tech pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {(item.project.tech_stack ?? []).map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-alt text-ink-secondary border border-border">
                        {tech}
                      </span>
                    ))}
                    <span className={[
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                      item.project.difficulty === "beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      item.project.difficulty === "advanced" ? "bg-red-50 text-red-600 border-red-200" :
                      "bg-amber-50 text-amber-600 border-amber-200",
                    ].join(" ")}>
                      {item.project.difficulty}
                    </span>
                  </div>

                  {/* Links row */}
                  <div className="flex items-center gap-5 text-xs">
                    <a href={item.submission.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      Source Code
                    </a>
                    {item.submission.live_url && (
                      <a href={item.submission.live_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-brand font-semibold hover:underline">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Live Demo
                      </a>
                    )}
                  </div>

                  {/* AI feedback */}
                  {item.submission.strengths && item.submission.strengths.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {item.submission.strengths.slice(0, 2).join(" · ")}
                        </p>
                      </div>
                      {item.submission.improvements && item.submission.improvements.length > 0 && (
                        <div className="flex items-start gap-2 mt-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M12 9v2m0 4h.01M5.07 19H18.93a2 2 0 001.72-2.97L13.72 4.03a2 2 0 00-3.44 0L3.35 16.03A2 2 0 005.07 19z" /></svg>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            {item.submission.improvements.slice(0, 1).join("")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
