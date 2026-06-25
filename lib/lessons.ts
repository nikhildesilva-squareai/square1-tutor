import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The true FIRST lesson of a course = first module (by module.order_index) →
 * its first lesson (by lesson.order_index).
 *
 * NB: lessons.order_index is per-MODULE (it resets to 1 in every module), so
 * ordering lessons alone (`order by order_index limit 1`) returns an arbitrary
 * module's lesson 1 — which is why enrolment used to drop learners on the wrong
 * lesson. Always go through the module order first.
 */
export async function getFirstLessonId(
  supabase: SupabaseClient,
  courseId: string,
): Promise<string | null> {
  const { data: firstModule } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!firstModule) return null;

  const { data: firstLesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", (firstModule as { id: string }).id)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (firstLesson as { id: string } | null)?.id ?? null;
}
