import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// POST /api/bootcamp/gates/reply
//
// The student's turn in the private feedback thread (ST-32 / IN-20). Grading on
// the self-paced side is a one-shot AI verdict with no reply path; on a paid
// programme with a human instructor, this conversation IS the product.
//
// WRITTEN AS THE STUDENT, ON PURPOSE. Every other bootcamp write in this
// codebase uses the service role; this one must not. Two protections in
// migration 021 only fire on the authenticated path:
//
//   • the RLS policy submission_comments_insert_own, which is
//     s1_owns_submission(submission_id) — Postgres, not this handler, decides
//     whether the caller owns the thread they are posting into;
//   • the trigger s1_submission_comment_guard, which forcibly stamps
//     author_kind='student' and author_id=<their student id>. That is what stops
//     someone posting as the instructor and manufacturing their own sign-off.
//
// Going through the service role here would bypass both and put the burden of
// getting authorship right on code instead of on the database.
//
// The grant is likewise narrow: INSERT (submission_id, body_md) only. Sending
// author_kind would be refused at the privilege level, which is why this handler
// does not send it.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  submissionId: z.string().regex(UUID),
  // Matches the DB CHECK submission_comments_body_len (1..20000) so a rejection
  // is a readable message rather than a Postgres constraint error.
  body: z.string().trim().min(1).max(20000),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Write something before sending." }, { status: 400 });
    }
    const { submissionId, body } = parsed.data;

    const { data, error } = await supabase
      .from("submission_comments")
      .insert({ submission_id: submissionId, body_md: body })
      .select("id, author_kind, body_md, created_at")
      .single();

    if (error) {
      // The realistic cause is the RLS policy refusing a thread the caller does
      // not own. That is a 403 and not a 500: the database is working.
      console.error("[bootcamp/gates/reply]", error.message);
      return NextResponse.json(
        { error: "You cannot post to this thread." },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, comment: data });
  } catch (err) {
    console.error("[bootcamp/gates/reply]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
