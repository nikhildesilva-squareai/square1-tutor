import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/community/current-profile";

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * GET /api/members/suggestions — members for the "People to follow" rail.
 * Returns other members with their primary enrolled course and whether the
 * caller already follows them (the rail keeps a Follow ↔ Following toggle).
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const { data: profiles } = await supabase
      .from("community_profiles")
      .select("id, avatar_url, student_id")
      .neq("id", me.id)
      .limit(limit + 5); // over-fetch a little; some may lack a name

    const rows = profiles ?? [];
    const studentIds = [...new Set(rows.map((p: any) => p.student_id).filter(Boolean))];

    const nameByStudent: Record<string, string> = {};
    const courseByStudent: Record<string, string> = {};
    if (studentIds.length) {
      const { data: students } = await supabase
        .from("students")
        .select("id, name")
        .in("id", studentIds);
      for (const s of students ?? []) nameByStudent[s.id] = s.name;

      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id, course_id")
        .in("student_id", studentIds)
        .eq("status", "active");
      const courseIds = [...new Set((enrollments ?? []).map((e: any) => e.course_id))];
      const titleById: Record<string, string> = {};
      if (courseIds.length) {
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);
        for (const c of courses ?? []) titleById[c.id] = c.title;
      }
      for (const e of enrollments ?? []) {
        if (!courseByStudent[e.student_id] && titleById[e.course_id]) {
          courseByStudent[e.student_id] = titleById[e.course_id];
        }
      }
    }

    const profileIds = rows.map((p: any) => p.id);
    const followed = new Set<string>();
    if (profileIds.length) {
      const { data: follows } = await supabase
        .from("community_follows")
        .select("following_profile_id")
        .eq("follower_profile_id", me.id)
        .in("following_profile_id", profileIds);
      for (const f of follows ?? []) followed.add(f.following_profile_id);
    }

    const members = rows
      .filter((p: any) => nameByStudent[p.student_id])
      .slice(0, limit)
      .map((p: any) => {
        const name = nameByStudent[p.student_id];
        return {
          profileId: p.id,
          name,
          initials: initialsOf(name),
          role: courseByStudent[p.student_id] ?? "Member",
          avatarUrl: p.avatar_url ?? null,
          followsThem: followed.has(p.id),
        };
      });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
