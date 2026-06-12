import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  courseSlug: z.string().min(1).max(100),
  planMonths: z.number().int().min(1).max(24),
  billing: z.enum(["monthly", "upfront"]),
});

/**
 * POST /api/enroll-interest
 *
 * Pre-Stripe founding-spot reservation. Records which course/plan/billing a
 * student wants so we can email them (at their locked founding price) the
 * moment real checkout goes live. One reservation per student per course.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.parse(await request.json());

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { error } = await supabase.from("enrollment_interest").upsert(
      {
        student_id: student.id,
        course_slug: body.courseSlug,
        plan_months: body.planMonths,
        billing: body.billing,
      },
      { onConflict: "student_id,course_slug" },
    );

    if (error) {
      console.error("[enroll-interest]", error);
      return NextResponse.json({ error: "Could not save reservation" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[enroll-interest]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
