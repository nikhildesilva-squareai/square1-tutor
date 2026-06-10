import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import type { ProjectSubmission } from "@/types/database";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

function ScoreRing({ score, max, size = 48, color = "#22C55E" }: { score: number; max: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? score / max : 0;
  const offset = circ * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { studentId } = await params;
  const supabase = await createClient();

  // Fetch student (public page — no auth required)
  const { data: student } = await supabase
    .from("students")
    .select("id, name, email, created_at")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) notFound();

  // Fetch only portfolio-worthy submissions (score 70+ auto-added)
  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("*")
    .eq("student_id", student.id)
    .eq("in_portfolio", true)
    .not("score", "is", null)
    .order("score", { ascending: false }) as { data: ProjectSubmission[] | null };

  const allSubs = submissions ?? [];
  const projectIds = allSubs.map(s => s.project_id);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, tech_stack, difficulty, course_id")
    .in("id", projectIds.length > 0 ? projectIds : ["__none__"]);

  const projectMap = new Map((projects ?? []).map(p => [p.id, p]));
  const courseIds = [...new Set((projects ?? []).map(p => p.course_id))];

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, color")
    .in("id", courseIds.length > 0 ? courseIds : ["__none__"]);

  const courseMap = new Map((courses ?? []).map(c => [c.id, c]));

  // Enrollments for course count
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("course_id, course:courses(title)")
    .eq("student_id", student.id)
    .eq("status", "active");

  const coursesTaken = (enrollments ?? []).length;

  // Stats
  const scores = allSubs.map(s => s.score).filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Tech stack
  const techCount = new Map<string, number>();
  for (const sub of allSubs) {
    const proj = projectMap.get(sub.project_id);
    if (proj) for (const t of proj.tech_stack ?? []) techCount.set(t, (techCount.get(t) ?? 0) + 1);
  }
  const topTech = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const displayName = student.name ?? student.email?.split("@")[0] ?? "Student";
  const joinYear = new Date(student.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Public header */}
      <header className="bg-surface border-b border-border px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Logo variant="dark" size="sm" /></Link>
          <span className="text-[10px] text-ink-muted uppercase tracking-widest font-bold">Student Portfolio</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile hero */}
        <div className="relative rounded-2xl overflow-hidden mb-8"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg">
                {displayName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black text-white mb-1">{displayName}</h1>
                <p className="text-slate-400 text-sm">
                  {coursesTaken} course{coursesTaken !== 1 ? "s" : ""} · {allSubs.length} project{allSubs.length !== 1 ? "s" : ""} deployed · Since {joinYear}
                </p>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <ScoreRing score={avgScore} max={100} size={72} color="#22C55E" />
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mt-1">Avg Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {topTech.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">Skills</p>
            <div className="flex flex-wrap gap-2">
              {topTech.map(([tech, count]) => (
                <div key={tech} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-sm">
                  <span className="font-semibold text-ink">{tech}</span>
                  <span className="text-[10px] text-ink-muted bg-surface-alt px-1.5 py-0.5 rounded-full font-bold">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {allSubs.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">Projects</p>
            <div className="space-y-3">
              {allSubs.map((sub) => {
                const proj = projectMap.get(sub.project_id);
                const course = proj ? courseMap.get(proj.course_id) : null;
                const score = sub.score ?? 0;
                const scoreColor = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
                if (!proj) return null;
                return (
                  <div key={sub.id} className="bg-surface rounded-xl border border-border p-5">
                    <div className="flex items-start gap-4">
                      <ScoreRing score={score} max={sub.max_score} size={48} color={scoreColor} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {course && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: course.color }} />}
                          <span className="text-[10px] text-ink-muted">{course?.title}</span>
                        </div>
                        <h3 className="text-sm font-bold text-ink mb-2">{proj.title}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {proj.tech_stack.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-surface-alt text-[10px] font-semibold text-ink-secondary border border-border">{t}</span>
                          ))}
                          <span className={[
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                            proj.difficulty === "beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                            proj.difficulty === "advanced" ? "bg-red-50 text-red-600 border-red-200" :
                            "bg-amber-50 text-amber-600 border-amber-200",
                          ].join(" ")}>
                            {proj.difficulty}
                          </span>
                          {(sub.attempt_number ?? 1) > 1 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-alt text-ink-muted border border-border">
                              {sub.attempt_number} attempts
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <a href={sub.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-ink-muted hover:text-ink">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61C4.42 17.92 3.63 17.5 3.63 17.5c-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23A11.5 11.5 0 0112 5.8c1.02.01 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.21 0 1.6-.02 2.89-.02 3.28 0 .32.22.7.83.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                            Source
                          </a>
                          {sub.live_url && (
                            <a href={sub.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand font-semibold hover:underline">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              Live
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-10 text-center">
            <p className="text-sm text-ink-muted">This student hasn&apos;t deployed any projects yet.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-ink-muted">
            Verified by <span className="font-bold text-brand">Square 1 AI</span> · <a href="https://square1-tutor.vercel.app" className="hover:underline">square1ai.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
