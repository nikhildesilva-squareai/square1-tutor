import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allowed redirect paths after auth callback
const ALLOWED_REDIRECTS = ["/dashboard", "/courses", "/tutor", "/projects", "/progress", "/settings", "/notes", "/portfolio"];

function sanitizeRedirect(next: string | null): string {
  // No explicit destination → the smart post-auth router: fresh accounts land
  // in Lesson 1 of their track, accounts with history land on the dashboard.
  if (!next) return "/api/auth/landing";
  // Must start with / and not contain // (prevents protocol-relative redirects like //evil.com)
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return "/dashboard";
  // Only allow known paths or paths starting with known prefixes
  const isAllowed = ALLOWED_REDIRECTS.some(p => next === p || next.startsWith(p + "/"));
  if (!isAllowed && !next.startsWith("/learn/") && !next.startsWith("/courses/") && !next.startsWith("/certificate/") && !next.startsWith("/business")) {
    return "/dashboard";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirect(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Capture the visitor's country from Vercel's IP geolocation. Both Google
      // and email sign-ins pass through this callback, so this is the single
      // place to record it (the sign-in form / OAuth never provide a country).
      // Best-effort — country capture must NEVER block auth.
      try {
        const country = request.headers.get("x-vercel-ip-country");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (country && country !== "XX") {
            // Keep the first-seen country on the auth user.
            if (!user.user_metadata?.signup_country) {
              await supabase.auth.updateUser({ data: { signup_country: country } });
            }
            // Backfill an existing student row that has no country yet.
            await supabase.from("students").update({ country }).eq("user_id", user.id).is("country", null);
          }

          // ── Every signed-in user IS a student ────────────────────────────
          // Student rows used to be created lazily — at the /welcome country
          // step, or on first enrolment. Anyone who authenticated and then did
          // neither ended up in a state the app has no answer for: a valid
          // session, no student row, and every (app) route bouncing them.
          // 11 of 34 accounts were in that state, 2 of them having genuinely
          // signed in.
          //
          // This callback is the single choke point every sign-in passes
          // through — email OTP and OAuth alike — so the row is created here,
          // once, and the lazy paths become no-ops rather than the only hope.
          // ignoreDuplicates keeps it idempotent across repeat sign-ins.
          const { error: studentError } = await supabase.from("students").upsert(
            {
              user_id: user.id,
              email: user.email ?? "",
              country: (user.user_metadata?.signup_country as string | undefined) ?? (country && country !== "XX" ? country : null),
              subject_interest: (user.user_metadata?.signup_subject as string | undefined) ?? null,
            },
            { onConflict: "user_id", ignoreDuplicates: true },
          );
          // Logged, not thrown: a failure here must not strand someone who has
          // just authenticated successfully. The lazy paths still cover it.
          if (studentError) console.error("[auth/callback] student upsert:", studentError);
        }
      } catch (e) {
        /* never break sign-in over profile setup */
        console.error("[auth/callback] post-auth setup:", e);
      }

      // sanitizeRedirect only vets the shape of the path, not whether the course
      // exists. /courses/[slug] calls notFound() on an unknown slug, so a signup
      // arriving from a diagnostic track with no live course would land on a 404
      // straight after authenticating. Confirm it resolves, else use /dashboard.
      // When it DOES resolve, go one better: skip the course page and land them
      // in Lesson 1 itself — the activation moment (course page as fallback).
      let destination = next;
      const courseMatch = /^\/courses\/([^/?#]+)/.exec(next);
      if (courseMatch) {
        try {
          const { data: course } = await supabase
            .from("courses")
            .select("id, slug")
            .eq("slug", decodeURIComponent(courseMatch[1]))
            .eq("status", "active")
            .maybeSingle();
          if (!course) {
            destination = "/dashboard";
          } else {
            const { getFirstLessonId } = await import("@/lib/lessons");
            const firstLessonId = await getFirstLessonId(supabase, course.id);
            if (firstLessonId) destination = `/learn/${firstLessonId}`;
          }
        } catch {
          destination = "/dashboard";
        }
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
