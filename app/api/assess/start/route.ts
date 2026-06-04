import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  courseSlug: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseSlug } = schema.parse(body);

    // Find course
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id, title")
      .eq("slug", courseSlug)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find or create student record
    let { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      const { data: newStudent, error: studentErr } = await supabase
        .from("students")
        .insert({
          user_id: user.id,
          email: user.email ?? "",
        })
        .select("id")
        .single();

      if (studentErr || !newStudent) {
        return NextResponse.json({ error: "Failed to create student record" }, { status: 500 });
      }
      student = newStudent;
    }

    // Find assessment paper for course
    const { data: paper, error: paperErr } = await supabase
      .from("assessment_papers")
      .select("id")
      .eq("course_id", course.id)
      .maybeSingle();

    if (paperErr || !paper) {
      return NextResponse.json({ error: "No assessment found for this course" }, { status: 404 });
    }

    // Get questions
    const { data: questions, error: questionsErr } = await supabase
      .from("assessment_questions")
      .select("id, paper_id, number, type, stem_md, options, correct_answer, mark_scheme_md, marks, topic_tags, bloom_level, language, starter_code")
      .eq("paper_id", paper.id)
      .order("number", { ascending: true });

    if (questionsErr || !questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this assessment" }, { status: 404 });
    }

    // Create attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from("assessment_attempts")
      .insert({
        student_id: student.id,
        paper_id: paper.id,
        course_id: course.id,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (attemptErr || !attempt) {
      return NextResponse.json({ error: "Failed to create assessment attempt" }, { status: 500 });
    }

    // Strip correct_answer and mark_scheme from response (don't leak answers)
    const safeQuestions = questions.map(({ correct_answer: _ca, mark_scheme_md: _ms, ...q }) => q);

    return NextResponse.json({
      attemptId: attempt.id,
      questions: safeQuestions,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    console.error("[assess/start]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
