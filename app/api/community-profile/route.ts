import { createClient } from "@/lib/supabase/server";
import { CommunityProfile } from "@/types/database";
import { NextResponse } from "next/server";

/**
 * GET /api/community-profile
 * Returns the logged-in user's community profile
 * Includes: avatar, bio, pronouns, location, website, courses, skills
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch community profile
    const { data: profile, error } = await supabase
      .from("community_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching community profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch student record for linked data
    const { data: student } = await supabase
      .from("students")
      .select("name, email")
      .eq("id", profile.student_id)
      .maybeSingle();

    // Fetch enrolled courses
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("course_id")
      .eq("student_id", profile.student_id)
      .eq("status", "active");

    const courseIds = enrollments?.map(e => e.course_id) ?? [];
    let courses = [];
    if (courseIds.length > 0) {
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, icon, color")
        .in("id", courseIds);
      courses = courseData ?? [];
    }

    return NextResponse.json({
      profile: {
        ...profile,
        name: student?.name,
        email: student?.email,
        courses,
      } as CommunityProfile & { name?: string | null; email?: string | null; courses: any[] }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/community-profile
 * Update the logged-in user's community profile
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { bio, pronouns, location, website_url, avatar_url } = body;

    // Validate input lengths
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Update profile
    const { data: updated, error } = await supabase
      .from("community_profiles")
      .update({
        bio: bio ?? undefined,
        pronouns: pronouns ?? undefined,
        location: location ?? undefined,
        website_url: website_url ?? undefined,
        avatar_url: avatar_url ?? undefined,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
