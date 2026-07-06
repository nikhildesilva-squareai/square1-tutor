import { createAdminClient } from "@/lib/supabase/admin";
import { rollUpDomains, roleReadiness } from "@/lib/competency";
import type { ReportData } from "@/components/SkillReportView";

// ═══════════════════════════════════════════════════════════════════════════════
// Shared skill reports — the data layer behind /report/[token].
//
// A shared report is the SUMMARY view only: score, level, domain/topic mastery,
// strengths/gaps, role readiness. Per-question answers, AI feedback, and the
// personal action plan stay private (questionResults: [], recommendationsMd: "").
// Sharing is opt-in: the token exists only after the owner clicks Share.
// ═══════════════════════════════════════════════════════════════════════════════

export interface SharedReport {
  report: ReportData;
  slug: string;
  courseTitle: string;
  firstName: string;
  sharedAt: string | null;
}

export async function getSharedReport(token: string): Promise<SharedReport | null> {
  // Tokens are 16+ hex chars; reject junk before touching the DB.
  if (!/^[a-f0-9]{12,64}$/i.test(token)) return null;

  try {
    const admin = createAdminClient();

    const { data: row } = await admin
      .from("skill_reports")
      .select("id, student_id, attempt_id, course_id, topic_mastery_json, level_determined, estimated_score, max_score, shared_at")
      .eq("share_token", token)
      .maybeSingle();
    if (!row) return null;

    const [{ data: attempt }, { data: course }, { data: student }] = await Promise.all([
      admin.from("assessment_attempts").select("score, max_score, percentage, level_determined").eq("id", row.attempt_id).maybeSingle(),
      admin.from("courses").select("slug, title").eq("id", row.course_id).maybeSingle(),
      admin.from("students").select("name, email").eq("id", row.student_id).maybeSingle(),
    ]);
    if (!course) return null;

    const percentage = Number(attempt?.percentage ?? (row.max_score ? (Number(row.estimated_score) / Number(row.max_score)) * 100 : 0));
    const pct = Math.round(percentage);

    const topicMastery = ((row.topic_mastery_json ?? []) as Array<{ topic: string; correct: number; total: number; percentage?: number }>)
      .filter((t) => t && t.topic)
      .map((t) => ({
        topic: t.topic,
        correct: Number(t.correct) || 0,
        total: Number(t.total) || 0,
        percentage: t.percentage != null ? Number(t.percentage) : (Number(t.total) ? Math.round((Number(t.correct) / Number(t.total)) * 100) : 0),
      }));

    const accum: Record<string, { correct: number; total: number }> = {};
    for (const t of topicMastery) accum[t.topic] = { correct: t.correct, total: t.total };

    const level = ((attempt?.level_determined ?? row.level_determined) || "beginner") as ReportData["level"];
    const rawName: string = student?.name || student?.email?.split("@")[0] || "A Square 1 student";
    const firstName = rawName.split(" ")[0];

    const report: ReportData = {
      reportId: row.id,
      level,
      score: Number(attempt?.score ?? row.estimated_score ?? 0),
      maxScore: Number(attempt?.max_score ?? row.max_score ?? 0),
      percentage: pct,
      topicMastery,
      domainMastery: rollUpDomains(course.slug, accum),
      roleReadiness: roleReadiness(course.slug, pct),
      cohortPercentile: null,
      recommendationsMd: "",   // personal action plan stays private
      questionResults: [],     // answers + AI feedback stay private
    };

    return { report, slug: course.slug, courseTitle: course.title, firstName, sharedAt: row.shared_at ?? null };
  } catch {
    return null;
  }
}
