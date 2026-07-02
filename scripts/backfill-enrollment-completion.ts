#!/usr/bin/env npx ts-node

/**
 * Backfill script: Mark historically-completed enrollments
 *
 * This script identifies enrollments that are already complete but don't have
 * a completed_at timestamp, and marks them with the appropriate completion date.
 *
 * Usage:
 *   npm run backfill:enrollment-completion
 *   OR
 *   npx ts-node scripts/backfill-enrollment-completion.ts
 *
 * The script:
 * 1. Finds all active enrollments with completed_at IS NULL
 * 2. For each, checks if all criteria are met (all lessons, all projects, assessment if required)
 * 3. If met, sets completed_at = MAX(lesson_completions.completed_at) for that enrollment
 * 4. Logs results and counts
 *
 * Safety:
 * - Read-only queries first (no writes until verified)
 * - Logs every completion before writing
 * - Can be re-run safely (idempotent — only updates NULL completed_at)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface IncompleteEnrollment {
  id: string;
  student_id: string;
  course_id: string;
}

interface EnrollmentStats {
  enrollmentId: string;
  lessonCount: number;
  totalLessons: number;
  projectCount: number;
  assessmentPassed: boolean;
  lastLessonCompletedAt: string | null;
}

async function getIncompleteEnrollments(): Promise<IncompleteEnrollment[]> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .select("id, student_id, course_id")
    .eq("status", "active")
    .is("completed_at", null);

  if (error) {
    throw new Error(`Failed to fetch incomplete enrollments: ${error.message}`);
  }

  return data || [];
}

async function checkEnrollmentCompletion(enrollment: IncompleteEnrollment): Promise<EnrollmentStats | null> {
  try {
    // Get course info
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("total_lessons")
      .eq("id", enrollment.course_id)
      .maybeSingle();

    if (courseError || !course) {
      console.warn(`  ⚠️ Course not found for enrollment ${enrollment.id}`);
      return null;
    }

    const totalLessons = course.total_lessons ?? 40;

    // Check 1: Lessons completed
    const { count: lessonCount, error: lessonError } = await supabase
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", enrollment.student_id)
      .eq("enrollment_id", enrollment.id);

    if (lessonError) {
      console.warn(`  ⚠️ Error checking lessons for ${enrollment.id}: ${lessonError.message}`);
      return null;
    }

    // Check 2: Projects submitted
    const { data: projects, error: projectError } = await supabase
      .from("project_submissions")
      .select("id")
      .eq("student_id", enrollment.student_id)
      .eq("course_id", enrollment.course_id);

    if (projectError) {
      console.warn(`  ⚠️ Error checking projects for ${enrollment.id}: ${projectError.message}`);
      return null;
    }

    // Check 3: Assessment (optional)
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessment_attempts")
      .select("percentage")
      .eq("student_id", enrollment.student_id)
      .eq("course_id", enrollment.course_id)
      .eq("status", "graded")
      .order("graded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError) {
      console.warn(`  ⚠️ Error checking assessment for ${enrollment.id}: ${assessmentError.message}`);
      return null;
    }

    // Get last lesson completion date
    const { data: lastLesson, error: lastLessonError } = await supabase
      .from("lesson_completions")
      .select("completed_at")
      .eq("student_id", enrollment.student_id)
      .eq("enrollment_id", enrollment.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastLessonError) {
      console.warn(`  ⚠️ Error getting last lesson date for ${enrollment.id}`);
      return null;
    }

    const projectCount = projects?.length ?? 0;
    const assessmentPassed =
      !assessment || (assessment.percentage != null && assessment.percentage >= 70);
    const lastLessonCompletedAt = lastLesson?.completed_at ?? null;

    return {
      enrollmentId: enrollment.id,
      lessonCount: lessonCount ?? 0,
      totalLessons,
      projectCount,
      assessmentPassed,
      lastLessonCompletedAt,
    };
  } catch (err) {
    console.warn(`  ⚠️ Unexpected error for enrollment ${enrollment.id}: ${err}`);
    return null;
  }
}

async function isCompleted(stats: EnrollmentStats): Promise<boolean> {
  return (
    stats.lessonCount >= stats.totalLessons &&
    stats.projectCount > 0 &&
    stats.assessmentPassed
  );
}

async function markEnrollmentComplete(
  enrollmentId: string,
  completedAt: string
): Promise<boolean> {
  const { error } = await supabase
    .from("student_enrollments")
    .update({ completed_at: completedAt })
    .eq("id", enrollmentId)
    .is("completed_at", null); // Safety: only update if still NULL

  if (error) {
    console.error(`    ERROR marking ${enrollmentId} complete: ${error.message}`);
    return false;
  }

  return true;
}

async function main() {
  console.log("🔄 Starting enrollment completion backfill...\n");

  try {
    // Step 1: Get all incomplete enrollments
    console.log("📋 Fetching incomplete enrollments...");
    const incomplete = await getIncompleteEnrollments();
    console.log(`  Found ${incomplete.length} incomplete enrollments\n`);

    if (incomplete.length === 0) {
      console.log("✅ No incomplete enrollments to process");
      return;
    }

    // Step 2: Check each for completion
    console.log("🔍 Checking each enrollment for completion criteria...\n");
    let completedCount = 0;
    const toBackfill: Array<{ enrollmentId: string; completedAt: string }> = [];

    for (const enrollment of incomplete) {
      const stats = await checkEnrollmentCompletion(enrollment);
      if (!stats) continue;

      const isEnrollmentComplete = await isCompleted(stats);
      if (isEnrollmentComplete && stats.lastLessonCompletedAt) {
        console.log(`  ✅ ${enrollment.id}: ${stats.lessonCount}/${stats.totalLessons} lessons, ${stats.projectCount} projects, assessment ${stats.assessmentPassed ? "passed" : "n/a"}`);
        toBackfill.push({
          enrollmentId: enrollment.id,
          completedAt: stats.lastLessonCompletedAt,
        });
        completedCount++;
      }
    }

    console.log(`\n📊 Found ${completedCount} enrollments to backfill\n`);

    if (completedCount === 0) {
      console.log("✅ No enrollments need backfilling");
      return;
    }

    // Step 3: Confirm before writing
    console.log(`⚠️  About to mark ${completedCount} enrollments as complete.`);
    console.log("   Confirm with: BACKFILL_CONFIRM=1 npm run backfill:enrollment-completion\n");

    if (process.env.BACKFILL_CONFIRM !== "1") {
      console.log("❌ Backfill cancelled (set BACKFILL_CONFIRM=1 to proceed)");
      process.exit(0);
    }

    // Step 4: Write backfill
    console.log("💾 Marking enrollments as complete...\n");
    let successCount = 0;
    for (const item of toBackfill) {
      const success = await markEnrollmentComplete(item.enrollmentId, item.completedAt);
      if (success) {
        console.log(`    ✅ ${item.enrollmentId}`);
        successCount++;
      }
    }

    console.log(`\n🎉 Backfill complete: ${successCount}/${completedCount} successful`);

    if (successCount < completedCount) {
      console.log(`⚠️  ${completedCount - successCount} enrollments failed to update`);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  }
}

main();
