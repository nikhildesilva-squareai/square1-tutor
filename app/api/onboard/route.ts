import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getFirstLessonId } from "@/lib/lessons";
import { DIAG_SUBJECTS } from "@/lib/diagnostic";

const OnboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(100).optional(),
  experience: z.string().min(1).max(100).optional(),
  // Course slug the visitor was skill-tested on (?subject= on the diagnostic
  // CTA). Echoed back only if it resolves to a live course, so the caller can
  // land them on it — see the courseSlug note in the response below.
  courseSlug: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify auth before any DB query
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Throttle per user — onboarding triggers a welcome email on first call,
    // so we cap repeat hits to deter abuse. 10 requests / minute is generous
    // for legitimate profile edits.
    const rl = rateLimit(`onboard:${user.id}`, 10, 60_000);
    if (!rl.success) return rl.response;

    // Validate input with Zod
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = OnboardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, country, subject, experience, courseSlug } = parsed.data;

    // Find or create student record for this user
    //
    // Migration required — run these if the columns don't exist yet:
    //   ALTER TABLE students ADD COLUMN IF NOT EXISTS country text;
    //   ALTER TABLE students ADD COLUMN IF NOT EXISTS subject_interest text;
    //   ALTER TABLE students ADD COLUMN IF NOT EXISTS experience_level text;
    //   ALTER TABLE students ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;
    const { data: existing, error: fetchError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    let studentId: string;

    if (existing) {
      // Update name and/or country if provided
      const updates: Record<string, string> = {};
      if (name) updates.name = name;
      if (country) updates.country = country;
      if (subject) updates.subject_interest = subject;
      if (experience) updates.experience_level = experience;
      // updates.consent_given_at = new Date().toISOString(); // Uncomment after migration

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("students")
          .update(updates)
          .eq("user_id", user.id);

        if (updateError) {
          return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
        }
      }
      studentId = existing.id;
    } else {
      // Create new student record
      const { data: created, error: insertError } = await supabase
        .from("students")
        .insert({
          user_id: user.id,
          email: user.email ?? "",
          name: name || null,
          country: country || null,
          subject_interest: subject || null,
          experience_level: experience || null,
          // consent_given_at: new Date().toISOString(), // Uncomment after migration
        })
        .select("id")
        .single();

      if (insertError || !created) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
      }
      studentId = created.id;
    }

    // Resolve where to send them next. The diagnostic's subject list includes a
    // few tracks with no live course, and /courses/[slug] calls notFound() on an
    // unknown slug - so validate here rather than bouncing a brand-new signup
    // onto a 404. Null means "no live course for that track": land on /dashboard.
    //
    // The track can arrive three ways: an explicit courseSlug (OTP signups from
    // the diagnostic), the subject TITLE (mapped back to a slug via
    // DIAG_SUBJECTS), or — for Google signups whose first onboard call is the
    // country step — the signup_subject stashed on the auth user's metadata.
    const metaSubject = (user.user_metadata?.signup_subject as string | undefined) ?? undefined;
    const titleToSlug = (title?: string) =>
      title ? DIAG_SUBJECTS.find((s) => s.title.toLowerCase() === title.toLowerCase())?.slug ?? null : null;
    const candidateSlug = courseSlug ?? titleToSlug(subject) ?? titleToSlug(metaSubject);

    let resolvedCourseSlug: string | null = null;
    let resolvedCourseTitle: string | null = null;
    let firstLessonId: string | null = null;
    if (candidateSlug) {
      const { data: course } = await supabase
        .from("courses")
        .select("id, slug, title")
        .eq("slug", candidateSlug)
        .eq("status", "active")
        .maybeSingle();
      if (course) {
        resolvedCourseSlug = course.slug;
        resolvedCourseTitle = course.title;
        firstLessonId = await getFirstLessonId(supabase, course.id);
      }
    }

    // Send welcome email (non-blocking). When we know their track, the CTA
    // deep-links into Lesson 1 — day-0 activation — instead of the dashboard.
    if (!existing && user.email) {
      try {
        const { sendWelcomeEmail } = await import("@/lib/email/resend");
        await sendWelcomeEmail(user.email, name || user.email.split("@")[0], {
          courseTitle: resolvedCourseTitle ?? undefined,
          lessonUrl: firstLessonId ? `https://www.square1ai.com/learn/${firstLessonId}` : undefined,
        });
      } catch {
        // Non-blocking — don't fail onboarding if email fails
        console.warn("[onboard] Welcome email failed — RESEND_API_KEY may not be set");
      }
    }

    return NextResponse.json({ studentId, courseSlug: resolvedCourseSlug, firstLessonId });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
