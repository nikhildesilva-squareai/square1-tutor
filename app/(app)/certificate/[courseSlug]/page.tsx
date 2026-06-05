import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CertificateView } from "./CertificateView";

interface PageProps {
  params: Promise<{ courseSlug: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const { courseSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) redirect("/dashboard");

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, color, total_lessons")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (!course) notFound();

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("student_enrollments")
    .select("id, assessment_level, enrolled_at")
    .eq("student_id", student.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${courseSlug}`);

  // Check completion — count lessons done
  const { count: completedCount } = await supabase
    .from("lesson_completions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("enrollment_id", enrollment.id);

  const completed = completedCount ?? 0;
  const total = course.total_lessons ?? 40;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Get assessment score
  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("score, max_score, percentage")
    .eq("student_id", student.id)
    .eq("course_id", course.id)
    .eq("status", "graded")
    .order("graded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get project count
  const { count: projectCount } = await supabase
    .from("project_submissions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .not("score", "is", null);

  const displayName = student.name ?? student.email?.split("@")[0] ?? "Student";
  const enrollDate = new Date(enrollment.enrolled_at).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });
  const today = new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });

  return (
    <CertificateView
      studentName={displayName}
      courseTitle={course.title}
      courseColor={course.color}
      level={enrollment.assessment_level ?? "beginner"}
      lessonsCompleted={completed}
      totalLessons={total}
      completionPct={pct}
      assessmentScore={attempt?.percentage ?? null}
      projectsCompleted={projectCount ?? 0}
      enrollDate={enrollDate}
      issueDate={today}
      courseSlug={courseSlug}
    />
  );
}
