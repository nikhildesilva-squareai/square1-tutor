import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildVerifiedProfile } from "@/lib/career/verified-profile";
import { CareerClient } from "./CareerClient";

// ═══════════════════════════════════════════════════════════════════════════════
// /career — the job-hunt agent. Paste a real job posting; the agent maps it
// against the student's GRADED record (never self-report), drafts application
// documents grounded in that record, and runs a role-specific mock interview.
//
// The server page's only job is auth + showing the student what their agent
// stands on (the verified inventory). All AI calls happen in /api/career/*.
// ═══════════════════════════════════════════════════════════════════════════════

export const metadata = { title: "Career — your job-hunt agent" };

export default async function CareerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!student) redirect("/dashboard");

  const [profile, { data: targets }] = await Promise.all([
    buildVerifiedProfile(supabase, student.id, student.name ?? user.email?.split("@")[0] ?? "Student"),
    supabase
      .from("job_targets")
      .select("id, role, company, readiness, history, updated_at")
      .eq("student_id", student.id)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <CareerClient
      firstName={(student.name ?? "there").split(" ")[0]}
      initialTargets={(targets ?? []) as import("./CareerClient").TargetSummary[]}
      inventory={{
        tracks: profile.tracks.map((t) => ({
          title: t.courseTitle, done: t.lessonsCompleted, total: t.totalLessons,
        })),
        projects: profile.projects.map((p) => ({
          title: p.title, score: p.score, maxScore: p.maxScore, githubUrl: p.githubUrl,
        })),
        topicCount: profile.topics.length,
        isEmpty: profile.isEmpty,
      }}
    />
  );
}
