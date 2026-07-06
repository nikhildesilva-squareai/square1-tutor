import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";

const schema = z.object({ reportId: z.string().uuid() });

/**
 * POST /api/report/share — authed, owner-only. Mints (or returns) the public
 * share token for one of the caller's own skill reports. Sharing is opt-in;
 * nothing is public until this is called.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reportId } = schema.parse(await request.json());

    const { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: "No account" }, { status: 403 });

    const admin = createAdminClient();
    const { data: report } = await admin
      .from("skill_reports")
      .select("id, student_id, share_token")
      .eq("id", reportId)
      .maybeSingle();
    if (!report || report.student_id !== student.id) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let token = report.share_token as string | null;
    if (!token) {
      token = randomBytes(12).toString("hex"); // 24 hex chars
      const { error } = await admin
        .from("skill_reports")
        .update({ share_token: token, shared_at: new Date().toISOString() })
        .eq("id", report.id);
      if (error) {
        console.error("[report/share]", error);
        return NextResponse.json({ error: "Could not create share link" }, { status: 500 });
      }
    }

    const host = request.headers.get("host") ?? "square1-tutor.vercel.app";
    const proto = host.includes("localhost") ? "http" : "https";
    return NextResponse.json({ ok: true, token, url: `${proto}://${host}/report/${token}` });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    console.error("[report/share]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
