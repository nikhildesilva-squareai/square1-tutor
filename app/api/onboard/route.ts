// TODO: Add rate limiting with upstash/ratelimit
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const OnboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(100).optional(),
  experience: z.string().min(1).max(100).optional(),
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

    const { name, country, subject, experience } = parsed.data;

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

    // Send welcome email (non-blocking)
    if (!existing && user.email) {
      try {
        const { sendWelcomeEmail } = await import("@/lib/email/resend");
        await sendWelcomeEmail(user.email, name || user.email.split("@")[0]);
      } catch {
        // Non-blocking — don't fail onboarding if email fails
        console.warn("[onboard] Welcome email failed — RESEND_API_KEY may not be set");
      }
    }

    return NextResponse.json({ studentId });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
