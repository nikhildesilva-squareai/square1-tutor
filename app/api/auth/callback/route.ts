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
  if (!isAllowed && !next.startsWith("/learn/") && !next.startsWith("/courses/") && !next.startsWith("/certificate/")) {
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
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
