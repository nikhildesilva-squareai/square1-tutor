import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  emails: z.array(z.string().email()).min(1).max(100),
  // Optional: manager assigns everyone in this batch a specific track.
  // Omit / empty → invitee chooses their own course on join.
  courseSlug: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/org/invite — authed, manager-only. Bulk-invites staff by email.
 * Each pending invite reserves a seat; we never over-invite past the seat count.
 * Invite emails are sent best-effort (they deliver once the sending domain is
 * verified). The shareable join link is the always-on fallback.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { emails, courseSlug } = schema.parse(await request.json());

    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: "No account" }, { status: 403 });

    const admin = createAdminClient();
    const { data: mgr } = await admin
      .from("org_members").select("org_id").eq("student_id", student.id).eq("role", "manager").maybeSingle();
    if (!mgr) return NextResponse.json({ error: "Only a team manager can invite" }, { status: 403 });

    // Optional course assignment for this batch (manager picks the track).
    let assignedCourseId: string | null = null;
    if (courseSlug) {
      const { data: course } = await admin.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
      assignedCourseId = course?.id ?? null;
    }

    const { data: org } = await admin
      .from("organizations").select("id, name, seats, join_code").eq("id", mgr.org_id).maybeSingle();
    if (!org) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Normalise + dedupe the requested emails
    const clean = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)));

    // Seats already consumed = active members + still-pending invites
    const [{ count: memberCount }, { data: existingInvites }] = await Promise.all([
      admin.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("role", "member"),
      admin.from("org_invites").select("email, status").eq("org_id", org.id).neq("status", "revoked"),
    ]);
    const pendingCount = (existingInvites ?? []).filter((i) => i.status === "pending").length;
    const alreadyEmails = new Set((existingInvites ?? []).map((i) => i.email.toLowerCase()));
    let seatsLeft = Math.max(0, org.seats - (memberCount ?? 0) - pendingCount);

    const invited: string[] = [];
    let skipped = 0;
    for (const email of clean) {
      if (alreadyEmails.has(email)) { skipped++; continue; }   // already invited or joined
      if (seatsLeft <= 0) { skipped++; continue; }             // out of seats
      const { error } = await admin
        .from("org_invites").insert({ org_id: org.id, email, status: "pending", invited_by: student.id, assigned_course_id: assignedCourseId });
      if (error) { skipped++; continue; }
      invited.push(email);
      seatsLeft--;
    }

    // Best-effort invite emails (deliver once the domain is verified)
    if (invited.length > 0) {
      try {
        const host = request.headers.get("host") ?? "square1-tutor.vercel.app";
        const proto = host.includes("localhost") ? "http" : "https";
        const inviteUrl = `${proto}://${host}/business/join?code=${org.join_code}`;
        const { sendTeamInvite } = await import("@/lib/email/resend");
        await Promise.allSettled(invited.map((email) => sendTeamInvite(email, org.name, inviteUrl)));
      } catch (e) {
        console.error("[org/invite] email", e);
      }
    }

    return NextResponse.json({ invited: invited.length, skipped, seatsLeft });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Enter valid email addresses" }, { status: 400 });
    console.error("[org/invite]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
