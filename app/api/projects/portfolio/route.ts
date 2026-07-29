import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════════
// Publish / unpublish one graded project to the student's public portfolio.
//
// /portfolio/[studentId] needs no login and shows the student's name alongside
// their project scores, so it is opt-in: submit/route.ts writes in_portfolio
// false and only this route flips it, on an explicit action by the owner.
// Unpublishing must keep working forever — consent that can't be withdrawn
// isn't consent.
// ═══════════════════════════════════════════════════════════════════════════════

const schema = z.object({
  submissionId: z.string().uuid(),
  publish: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId, publish } = schema.parse(await request.json());

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Ownership comes from the session, never the request body. A submission
    // belonging to someone else simply isn't found.
    const { data: submission } = await supabase
      .from("project_submissions")
      .select("id, score")
      .eq("id", submissionId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // Publishing an ungraded submission would put an empty card on a public
    // page. Withdrawing one is always allowed.
    if (publish && submission.score === null) {
      return NextResponse.json({ error: "This project hasn't been graded yet" }, { status: 400 });
    }

    // Service role: students hold no write privilege on project_submissions
    // (see the grade-table revocation), so this route is the only way in.
    const { error } = await createAdminClient()
      .from("project_submissions")
      .update({ in_portfolio: publish })
      .eq("id", submissionId)
      .eq("student_id", student.id);

    if (error) {
      console.error("[projects/portfolio]", error);
      return NextResponse.json({ error: "Could not update your portfolio" }, { status: 500 });
    }

    return NextResponse.json({ in_portfolio: publish });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[projects/portfolio] unexpected:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
