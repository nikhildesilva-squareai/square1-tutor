import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(160),
  courseSlug: z.string().max(100).optional(),
});

function getIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * POST /api/beta/waitlist — public. Captures overflow once the 100 spots are gone.
 * Returns the caller's position so the UI can show "you're #N".
 */
export async function POST(request: Request) {
  try {
    const burst = rateLimit(`beta-waitlist:${getIp(request)}`, 5, 10 * 60 * 1000);
    if (!burst.success) return burst.response;

    const { email, courseSlug } = schema.parse(await request.json());
    const supabase = createAdminClient();

    const { error } = await supabase.from("beta_waitlist").insert({
      email: email.toLowerCase(),
      course_slug: courseSlug ?? null,
    });
    if (error) {
      console.error("[beta/waitlist]", error);
      return NextResponse.json({ error: "Could not join the waitlist — try again" }, { status: 500 });
    }

    const { count } = await supabase
      .from("beta_waitlist")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({ ok: true, position: count ?? 1 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    console.error("[beta/waitlist]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
