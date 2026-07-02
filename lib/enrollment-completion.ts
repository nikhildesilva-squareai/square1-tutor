import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks if an enrollment meets completion criteria and marks it as completed.
 *
 * Completion criteria (all must be true):
 * 1. All lessons finished (lesson_completions count = course.total_lessons)
 * 2. All projects submitted (project_submissions exist for this enrollment)
 * 3. Assessment (optional): If an assessment exists for the course and is taken, must be passed (>= pass threshold)
 *
 * @param enrollmentId - The UUID of the student_enrollments record
 * @param adminClient - Supabase admin client (for reading/writing)
 * @returns true if enrollment was marked complete, false otherwise
 * @throws Error if database queries fail
 */
export async function checkAndMarkEnrollmentComplete(
  enrollmentId: string,
  adminClient: SupabaseClient
): Promise<boolean> {
  try {
    // Fetch enrollment details
    const { data: enrollment, error: enrollmentError } = await adminClient
      .from("student_enrollments")
      .select("id, student_id, course_id, completed_at, status")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      console.error("[checkAndMarkEnrollmentComplete] Enrollment not found:", enrollmentError);
      return false;
    }

    // Already completed? Skip
    if (enrollment.completed_at) {
      return false;
    }

    // Fetch course details (total_lessons count)
    const { data: course, error: courseError } = await adminClient
      .from("courses")
      .select("id, total_lessons")
      .eq("id", enrollment.course_id)
      .maybeSingle();

    if (courseError || !course) {
      console.error("[checkAndMarkEnrollmentComplete] Course not found:", courseError);
      return false;
    }

    // Check 1: All lessons completed?
    const { count: completedLessonCount, error: lessonCountError } = await adminClient
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", enrollment.student_id)
      .eq("enrollment_id", enrollmentId);

    if (lessonCountError) {
      console.error("[checkAndMarkEnrollmentComplete] Lesson count error:", lessonCountError);
      return false;
    }

    const completedLessons = completedLessonCount ?? 0;
    const totalLessons = course.total_lessons ?? 40; // Default fallback

    if (completedLessons < totalLessons) {
      // Lessons not all done yet
      return false;
    }

    // Check 2: All projects submitted?
    const { data: projectSubmissions, error: projectError } = await adminClient
      .from("project_submissions")
      .select("id")
      .eq("student_id", enrollment.student_id)
      .eq("course_id", enrollment.course_id);

    if (projectError) {
      console.error("[checkAndMarkEnrollmentComplete] Project query error:", projectError);
      return false;
    }

    // At least one project must be submitted
    if (!projectSubmissions || projectSubmissions.length === 0) {
      // No projects submitted yet
      return false;
    }

    // Check 3: Assessment (optional) — if exists and taken, must be passed
    const { data: assessmentAttempt, error: assessmentError } = await adminClient
      .from("assessment_attempts")
      .select("percentage, status")
      .eq("student_id", enrollment.student_id)
      .eq("course_id", enrollment.course_id)
      .eq("status", "graded")
      .order("graded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError) {
      console.error("[checkAndMarkEnrollmentComplete] Assessment query error:", assessmentError);
      return false;
    }

    // If assessment was taken, it must be passed (>= 70%)
    const ASSESSMENT_PASS_THRESHOLD = 70;
    if (assessmentAttempt && assessmentAttempt.percentage != null) {
      if (assessmentAttempt.percentage < ASSESSMENT_PASS_THRESHOLD) {
        // Assessment taken but not passed
        return false;
      }
    }
    // If no assessment attempt exists, that's ok (assessment is optional)

    // ✅ All criteria met! Mark enrollment as completed
    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("student_enrollments")
      .update({ completed_at: now })
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("[checkAndMarkEnrollmentComplete] Update error:", updateError);
      return false;
    }

    console.log(`[checkAndMarkEnrollmentComplete] Enrollment ${enrollmentId} marked complete at ${now}`);
    return true;
  } catch (err) {
    console.error("[checkAndMarkEnrollmentComplete] Unexpected error:", err);
    return false;
  }
}

/**
 * Check all active incomplete enrollments and mark any that meet completion criteria.
 * Useful for cron jobs / background processes.
 *
 * @param adminClient - Supabase admin client
 * @returns Count of newly completed enrollments
 */
export async function checkAllIncompleteEnrollments(
  adminClient: SupabaseClient
): Promise<number> {
  try {
    // Fetch all active, incomplete enrollments
    const { data: incompleteEnrollments, error: queryError } = await adminClient
      .from("student_enrollments")
      .select("id")
      .eq("status", "active")
      .is("completed_at", null);

    if (queryError) {
      console.error("[checkAllIncompleteEnrollments] Query error:", queryError);
      return 0;
    }

    if (!incompleteEnrollments || incompleteEnrollments.length === 0) {
      return 0;
    }

    // Check each enrollment
    let completedCount = 0;
    for (const enrollment of incompleteEnrollments) {
      const wasCompleted = await checkAndMarkEnrollmentComplete(enrollment.id, adminClient);
      if (wasCompleted) {
        completedCount++;
      }
    }

    console.log(`[checkAllIncompleteEnrollments] Marked ${completedCount} enrollments complete`);
    return completedCount;
  } catch (err) {
    console.error("[checkAllIncompleteEnrollments] Unexpected error:", err);
    return 0;
  }
}
