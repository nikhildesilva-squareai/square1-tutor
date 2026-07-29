import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allowed redirect paths after auth callback
const ALLOWED_REDIRECTS = ["/dashboard", "/courses", "/tutor", "/projects", "/progress", "/settings", "/notes", "/portfolio"];

function sanitizeRedirect(next: string | null): string {
  if (!next) return "/dashboard";
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
        if (country && country !== "XX") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Persist on the auth user so it's available when the student row is
            // created (student rows are created lazily on first enrolment).
            // Keep the first-seen country.
            if (!user.user_metadata?.signup_country) {
              await supabase.auth.updateUser({ data: { signup_country: country } });
            }
            // Backfill an existing student row that has no country yet.
            await supabase.from("students").update({ country }).eq("user_id", user.id).is("country", null);
          }
        }
      } catch {
        /* ignore — never break sign-in over geolocation */
      }

      // sanitizeRedirect only vets the shape of the path, not whether the course
      // exists. /courses/[slug] calls notFound() on an unknown slug, so a signup
      // arriving from a diagnostic track with no live course would land on a 404
      // straight after authenticating. Confirm it resolves, else use /dashboard.
      let destination = next;
      const courseMatch = /^\/courses\/([^/?#]+)/.exec(next);
      if (courseMatch) {
        try {
          const { data: course } = await supabase
            .from("courses")
            .select("slug")
            .eq("slug", decodeURIComponent(courseMatch[1]))
            .eq("status", "active")
            .maybeSingle();
          if (!course) destination = "/dashboard";
        } catch {
          destination = "/dashboard";
        }
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
