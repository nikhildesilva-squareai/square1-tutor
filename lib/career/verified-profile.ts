// ═══════════════════════════════════════════════════════════════════════════════
// The verified profile — the ONLY source of claims the career agent may make.
//
// Everything here is backed by graded artifacts already in the DB: enrolments
// and lesson completions, AI-reviewed project submissions (with the student's
// real repo URL and rubric score), placement-assessment topic results, and
// Nova's memory of graded strengths/gaps. Nothing self-reported.
//
// The honesty contract of the whole feature lives in inventoryBlock(): every
// prompt receives this block plus rules forbidding claims from anywhere else.
// A CV that lies is worse than no CV — it fails at the exact moment it matters,
// and "proof, not promises" is the product.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseMemory, type StudentMemory } from "@/lib/nova-memory";

export type VerifiedTrack = {
  courseTitle: string;
  slug: string;
  lessonsCompleted: number;
  totalLessons: number;
  assessmentLevel: string | null;
};

export type VerifiedProject = {
  title: string;
  courseTitle: string;
  score: number;
  maxScore: number;
  techStack: string[];
  githubUrl: string;
  liveUrl: string | null;
  strengths: string[];
};

export type VerifiedProfile = {
  name: string;
  tracks: VerifiedTrack[];
  projects: VerifiedProject[];
  /** Latest graded placement-assessment topic results, best first. */
  topics: { topic: string; pct: number }[];
  /** Modules of enrolled courses — the only things "closes the gap"
   *  suggestions may point at, so the agent can never invent curriculum.
   *  Ids ride along so suggestions can resolve to a real lesson deep link. */
  enrolledModules: { courseTitle: string; modules: { id: string; title: string }[] }[];
  memory: StudentMemory;
  isEmpty: boolean;
};

/** Projects below this rubric score stay out of the inventory — work the
 *  grader marked as not-yet-passing is not evidence. */
const PROJECT_SCORE_FLOOR = 60;

export async function buildVerifiedProfile(
  supabase: SupabaseClient,
  studentId: string,
  name: string,
): Promise<VerifiedProfile> {
  const [{ data: enrollments }, { data: submissions }, { data: attempts }, { data: studentRow }] =
    await Promise.all([
      supabase
        .from("student_enrollments")
        .select("assessment_level, course:courses(id, slug, title, total_lessons)")
        .eq("student_id", studentId)
        .eq("status", "active"),
      supabase
        .from("project_submissions")
        .select("project_id, score, max_score, github_url, live_url, strengths")
        .eq("student_id", studentId)
        .not("score", "is", null)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("assessment_attempts")
        .select("topic_scores")
        .eq("student_id", studentId)
        .eq("status", "graded")
        .order("submitted_at", { ascending: false })
        .limit(1),
      supabase.from("students").select("memory").eq("id", studentId).maybeSingle(),
    ]);

  type CourseRef = { id: string; slug: string; title: string; total_lessons: number | null };
  const courses = (enrollments ?? [])
    .map((e) => ({ level: e.assessment_level as string | null, course: e.course as unknown as CourseRef | null }))
    .filter((e): e is { level: string | null; course: CourseRef } => !!e.course);

  // Lessons completed per course (completions → lessons → course_id).
  const { data: completions } = await supabase
    .from("lesson_completions")
    .select("lesson:lessons!inner(course_id)")
    .eq("student_id", studentId);
  const doneByCourse = new Map<string, number>();
  for (const c of completions ?? []) {
    const courseId = (c.lesson as unknown as { course_id: string } | null)?.course_id;
    if (courseId) doneByCourse.set(courseId, (doneByCourse.get(courseId) ?? 0) + 1);
  }

  const tracks: VerifiedTrack[] = courses.map(({ level, course }) => ({
    courseTitle: course.title,
    slug: course.slug,
    lessonsCompleted: doneByCourse.get(course.id) ?? 0,
    totalLessons: course.total_lessons ?? 0,
    assessmentLevel: level,
  }));

  // Passing graded projects, deduped to each project's best submission.
  const bestByProject = new Map<string, NonNullable<typeof submissions>[number]>();
  for (const s of submissions ?? []) {
    const prev = bestByProject.get(s.project_id);
    if (!prev || (s.score ?? 0) > (prev.score ?? 0)) bestByProject.set(s.project_id, s);
  }
  const passing = [...bestByProject.values()].filter((s) => (s.score ?? 0) >= PROJECT_SCORE_FLOOR);

  let projects: VerifiedProject[] = [];
  if (passing.length > 0) {
    const { data: projectRows } = await supabase
      .from("projects")
      .select("id, title, tech_stack, course_id")
      .in("id", passing.map((s) => s.project_id));
    const { data: courseRows } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", [...new Set((projectRows ?? []).map((p) => p.course_id))]);
    const courseTitle = new Map((courseRows ?? []).map((c) => [c.id, c.title as string]));
    const projMeta = new Map((projectRows ?? []).map((p) => [p.id, p]));

    projects = passing.flatMap((s) => {
      const meta = projMeta.get(s.project_id);
      if (!meta) return [];
      return [{
        title: meta.title as string,
        courseTitle: courseTitle.get(meta.course_id) ?? "",
        score: s.score as number,
        maxScore: (s.max_score as number) ?? 100,
        techStack: ((meta.tech_stack as string[] | null) ?? []).slice(0, 6),
        githubUrl: s.github_url as string,
        liveUrl: (s.live_url as string | null) ?? null,
        strengths: ((s.strengths as string[] | null) ?? []).slice(0, 3),
      }];
    });
  }

  // Topic results from the latest graded placement assessment.
  const topicScores = (attempts?.[0]?.topic_scores ?? null) as Record<string, { score: number; max: number }> | null;
  const topics = topicScores
    ? Object.entries(topicScores)
        .filter(([, d]) => d.max > 0)
        .map(([topic, d]) => ({ topic, pct: Math.round((d.score / d.max) * 100) }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 12)
    : [];

  // Module titles of enrolled courses — grounding for gap-closing suggestions.
  let enrolledModules: VerifiedProfile["enrolledModules"] = [];
  if (courses.length > 0) {
    const { data: moduleRows } = await supabase
      .from("modules")
      .select("id, title, course_id")
      .in("course_id", courses.map((c) => c.course.id))
      .order("order_index", { ascending: true });
    enrolledModules = courses.map(({ course }) => ({
      courseTitle: course.title,
      modules: (moduleRows ?? [])
        .filter((m) => m.course_id === course.id)
        .map((m) => ({ id: m.id as string, title: m.title as string })),
    }));
  }

  const memory = parseMemory(studentRow?.memory);
  const isEmpty = tracks.length === 0 && projects.length === 0 && topics.length === 0;

  return { name, tracks, projects, topics, enrolledModules, memory, isEmpty };
}

/** Render the profile as the evidence block every career prompt receives. */
export function inventoryBlock(p: VerifiedProfile): string {
  const lines: string[] = [
    `STUDENT'S VERIFIED RECORD — every line is backed by graded work on Square 1 AI. This is the ONLY permissible source of claims about this student.`,
    `Name: ${p.name}`,
  ];

  if (p.tracks.length > 0) {
    lines.push(`Tracks in progress:`);
    for (const t of p.tracks) {
      lines.push(`- ${t.courseTitle}: ${t.lessonsCompleted}/${t.totalLessons} lessons completed${t.assessmentLevel ? ` (placement level: ${t.assessmentLevel})` : ""}`);
    }
  }

  if (p.projects.length > 0) {
    lines.push(`Graded projects (real code, AI-reviewed against a weighted rubric; scores are genuine):`);
    for (const pr of p.projects) {
      lines.push(`- "${pr.title}" (${pr.courseTitle}) — scored ${pr.score}/${pr.maxScore}. Repo: ${pr.githubUrl}${pr.liveUrl ? ` · Live: ${pr.liveUrl}` : ""}. Tech: ${pr.techStack.join(", ")}${pr.strengths.length ? `. Reviewer-noted strengths: ${pr.strengths.join("; ")}` : ""}`);
    }
  }

  if (p.topics.length > 0) {
    lines.push(`Placement-assessment topic results: ${p.topics.map((t) => `${t.topic} ${t.pct}%`).join(", ")}`);
  }

  if (p.memory.strengths.length > 0) {
    lines.push(`Recently demonstrated strengths (graded exercises): ${p.memory.strengths.map((s) => s.t).join("; ")}`);
  }
  if (p.memory.gaps.length > 0) {
    lines.push(`Known gaps currently being worked on (be honest about these where relevant): ${p.memory.gaps.map((g) => g.t).join("; ")}`);
  }

  if (p.isEmpty) {
    lines.push(`(No graded work yet — the record is essentially empty. Say so honestly wherever it matters.)`);
  }

  return lines.join("\n").slice(0, 4000);
}

/** The curriculum the agent may point gap-closing suggestions at. */
export function curriculumBlock(p: VerifiedProfile): string {
  if (p.enrolledModules.length === 0) return "";
  return [
    `Modules available in the student's enrolled tracks (gap-closing suggestions must name ONLY these, verbatim):`,
    ...p.enrolledModules.map((c) => `- ${c.courseTitle}: ${c.modules.map((m) => m.title).join(" · ")}`),
  ].join("\n").slice(0, 1500);
}
