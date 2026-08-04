import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendLessonLink } from "@/lib/email/resend";

// "Email me this lesson" — the phone → computer bridge in the lesson player.
// Signed-in students tap it on mobile (code exercises are painful on a phone
// keyboard) and get the deep link in their inbox to continue on a computer.

const schema = z.object({ lessonId: z.string().min(1).max(100) });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit(`lessonlink:${user.id}`, 5, 60_000);
    if (!rl.success) return rl.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title, course_id")
      .eq("id", parsed.data.lessonId)
      .maybeSingle();
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", lesson.course_id)
      .maybeSingle();

    await sendLessonLink(user.email, {
      lessonTitle: lesson.title,
      courseTitle: course?.title ?? "your course",
      url: `https://www.square1ai.com/learn/${lesson.id}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not send the email" }, { status: 500 });
  }
}
