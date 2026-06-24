import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(4000),
  score: z.number().int().min(1).max(5).optional(),
  category: z.enum(["praise", "idea", "bug", "confusing", "other"]).optional(),
  page: z.string().max(300).optional(),
});

/**
 * POST /api/feedback — capture in-app feedback during the trial.
 * Ties to the signed-in student when available; the message is the only
 * required field. Read back in the internal dashboard's feedback inbox.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = schema.parse(await request.json());

    let studentId: string | null = null;
    let email: string | null = null;
    if (user) {
      const { data: student } = await supabase
        .from("students").select("id, email").eq("user_id", user.id).maybeSingle();
      studentId = student?.id ?? null;
      email = student?.email ?? user.email ?? null;
    }

    const { error } = await supabase.from("feedback").insert({
      student_id: studentId,
      email,
      message: body.message,
      score: body.score ?? null,
      category: body.category ?? null,
      page: body.page ?? null,
    });

    if (error) {
      console.error("[feedback] insert", error);
      return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
