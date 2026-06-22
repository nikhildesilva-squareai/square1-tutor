import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/org/assignment?code=JOINCODE — authed.
 * If the manager invited this user's email with a specific track assigned, returns
 * that course so the join page can skip the picker. Otherwise { assigned: false }.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = new URL(request.url).searchParams.get("code");
  if (!code || !user.email) return NextResponse.json({ assigned: false });

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("join_code", code).maybeSingle();
  if (!org) return NextResponse.json({ assigned: false });

  const { data: inv } = await admin
    .from("org_invites")
    .select("assigned_course_id")
    .eq("org_id", org.id).eq("status", "pending").ilike("email", user.email)
    .not("assigned_course_id", "is", null)
    .maybeSingle();

  if (!inv?.assigned_course_id) return NextResponse.json({ assigned: false });

  const { data: course } = await admin
    .from("courses").select("slug, title").eq("id", inv.assigned_course_id).maybeSingle();
  if (!course?.slug) return NextResponse.json({ assigned: false });

  return NextResponse.json({ assigned: true, courseSlug: course.slug, courseTitle: course.title });
}
