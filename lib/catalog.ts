// ═══════════════════════════════════════════════════════════════════════════════
// Visible course catalog — the ONE definition of "courses a learner can pick".
//
// Rule: top-level (no parent) + active + not retired. The retired slugs are
// courses that still exist in the DB (enrollments reference them) but have no
// launch-grade content. The landing page, the B2B join picker, and the manager
// assign-dropdown must all use this — a hardcoded list in any of them WILL rot
// (that's how retired courses ended up offered to new team members).
//
// Works with any Supabase client (server, admin, or browser) since `courses`
// is publicly readable.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

export const RETIRED_COURSE_SLUGS = [
  "game-development",
  "drone-technology",
  "devops-engineering",
] as const;

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  color: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getVisibleCourses(supabase: SupabaseClient<any>): Promise<CatalogCourse[]> {
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, color")
    .is("parent_course_id", null)
    .eq("status", "active")
    .not("slug", "in", `(${RETIRED_COURSE_SLUGS.join(",")})`)
    .order("title");
  return (data ?? []) as CatalogCourse[];
}
