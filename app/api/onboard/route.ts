// TODO: Add rate limiting with upstash/ratelimit
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const OnboardSchema = z.object({
  name: z.string().max(120).optional().default(""),
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

    const { name } = parsed.data;

    // Find or create student record for this user
    // Note: consent_given_at timestamptz should be added to the students table via migration:
    // ALTER TABLE students ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;
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
      // Update name if provided
      if (name) {
        const { error: updateError } = await supabase
          .from("students")
          .update({
            name: name || undefined,
            // consent_given_at: new Date().toISOString(), // Uncomment after migration
          })
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
          // consent_given_at: new Date().toISOString(), // Uncomment after migration
        })
        .select("id")
        .single();

      if (insertError || !created) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
      }
      studentId = created.id;
    }

    return NextResponse.json({ studentId });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
