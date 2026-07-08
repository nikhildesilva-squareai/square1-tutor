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
 * GET /api/community-profile/[profileId]
 * Public-facing profile for the feed's member slide-over. Reuses the
 * enrollment→courses lookup (Enrolled badge) from /api/community-profile,
 * derives skills from the student's portfolio tech stacks, and computes real
 * post/follower counts plus the notes they've shared to the feed.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const supabase = await createClient();
    const me = await getCurrentProfile(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profileId = (await params).profileId;

    const { data: profile } = await supabase
      .from("community_profiles")
      .select("id, avatar_url, bio, student_id")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("id", profile.student_id)
      .maybeSingle();

    // Enrolled courses → "Enrolled · <first course>" badge + role line.
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("course_id")
      .eq("student_id", profile.student_id)
      .eq("status", "active");
    const courseIds = [...new Set((enrollments ?? []).map((e: any) => e.course_id))];
    let courseTitles: string[] = [];
    if (courseIds.length) {
      const { data: courses } = await supabase.from("courses").select("title").in("id", courseIds);
      courseTitles = (courses ?? []).map((c: any) => c.title);
    }

    // Skills = aggregated tech_stack across the student's project submissions.
    // tech_stack lives on the project template (no skills table exists), so we
    // embed projects(tech_stack) and count occurrences.
    const { data: subsWithTech } = await supabase
      .from("project_submissions")
      .select("projects(tech_stack)")
      .eq("student_id", profile.student_id);
    const submissionCount = (subsWithTech ?? []).length;
    const skillCounts: Record<string, number> = {};
    for (const s of subsWithTech ?? []) {
      const stack: string[] = (s as any).projects?.tech_stack ?? [];
      for (const t of stack) skillCounts[t] = (skillCounts[t] ?? 0) + 1;
    }
    const skills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t);

    // Stats: post count + follower count.
    const { count: postCount } = await supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profileId)
      .is("deleted_at", null);
    const { count: followerCount } = await supabase
      .from("community_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_profile_id", profileId);

    // Shared notes = notes attachments on this member's posts.
    const { data: theirPosts } = await supabase
      .from("community_posts")
      .select("id")
      .eq("author_id", profileId)
      .is("deleted_at", null);
    const theirPostIds = (theirPosts ?? []).map((p: any) => p.id);
    let sharedNotes: { topic: string; course: string }[] = [];
    if (theirPostIds.length) {
      const { data: noteAtts } = await supabase
        .from("post_attachments")
        .select("payload")
        .in("post_id", theirPostIds)
        .eq("kind", "notes");
      sharedNotes = (noteAtts ?? []).map((a: any) => ({
        topic: a.payload?.topic ?? "Notes",
        course: a.payload?.course ?? "",
      }));
    }

    // Does the caller follow this member?
    let followsThem = false;
    if (profileId !== me.id) {
      const { data: follow } = await supabase
        .from("community_follows")
        .select("id")
        .eq("follower_profile_id", me.id)
        .eq("following_profile_id", profileId)
        .maybeSingle();
      followsThem = !!follow;
    }

    const name = student?.name ?? "Member";
    return NextResponse.json({
      profile: {
        profileId,
        name,
        initials: initialsOf(name),
        avatarUrl: profile.avatar_url ?? null,
        role: courseTitles[0] ?? "Member",
        enrolled: courseTitles[0] ? `Enrolled · ${courseTitles[0]}` : null,
        bio: profile.bio ?? "",
        skills,
        stats: { posts: postCount ?? 0, followers: followerCount ?? 0 },
        sharedNotes,
        followsThem,
        isSelf: profileId === me.id,
        submissionCount,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
