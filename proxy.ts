import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { S1_REGION_COOKIE, parseRegion, regionForCountry } from "@/lib/pricing";
import { BOOTCAMP_ENABLED } from "@/lib/flags";

// Signed-in-only surfaces. This is a DENYLIST on purpose: anything not named
// here falls through to the app, so an unknown path renders a real 404 instead
// of redirecting to /login. The old allowlist soft-404'd every unrecognised
// URL, which told crawlers (and answer engines) the whole site was gated, and
// silently broke public /portfolio/{id} shares.
//
// Safe because the proxy is defence-in-depth, not the gate: every surface below
// re-checks the session server-side — (app)/layout.tsx, (admin)/layout.tsx,
// desk/newsroom/page.tsx, inbox/page.tsx and welcome/page.tsx each redirect to
// /login on their own. Add a route here only for the faster edge bounce.
const PROTECTED_PREFIXES = [
  // The (app) route group — the signed-in product.
  "/dashboard",
  "/learn",
  // NOTE: /courses is deliberately absent. /courses and /courses/{slug} are
  // public (the catalogue answer engines need to see); everything deeper is
  // still gated, but by (app)/layout.tsx rather than here — a prefix match at
  // the edge cannot express "two segments public, three segments private".
  "/tutor",
  "/notes",
  "/progress",
  "/projects",
  "/settings",
  "/certificate",
  "/community",
  "/messages",
  // The signed-in Bootcamp surfaces. Each page re-checks the session and
  // redirects on its own, but under force-dynamic the shell flushes before
  // redirect() can set a status, so the bounce lands as a 200 instead of a 307.
  // Handling it at the edge gets the status code right.
  //
  // Listed individually BY NECESSITY: bare "/bootcamp" and "/bootcamp/{slug}"
  // are the public catalogue and must stay reachable signed-out, so a single
  // "/bootcamp" prefix would gate the marketing site. Any NEW signed-in route
  // under /bootcamp has to be added here too — verify with a signed-out curl
  // that it answers 307, not 200.
  "/bootcamp/application",
  "/bootcamp/home",
  "/bootcamp/standing",
  "/bootcamp/contract",
  "/bootcamp/gates",
  // Post-signup onboarding, staff surfaces.
  "/welcome",
  "/inbox",
  "/desk",
  "/admin",
];

// /portfolio is the signed-in builder; /portfolio/{studentId} is the public
// share a student sends to an employer. Exact match only — never the children.
const PROTECTED_EXACT = ["/portfolio"];

export async function proxy(request: NextRequest) {
  // ── Unreleased product: /bootcamp is a real 404 until the flag flips ─────
  //
  // notFound() inside the pages is NOT enough, and this was verified against a
  // production build rather than assumed. Those routes are `force-dynamic`, so
  // Next streams the shell before the component throws: the body is the 404
  // page but the status was already committed as 200. Every /bootcamp URL
  // answered 200 in `next start`.
  //
  // A 200 on a page that reads "404" is an indexable page. An unreleased $890
  // product becoming crawlable is exactly what the flag exists to prevent, and
  // a soft-404 also teaches answer engines the wrong thing about the site (the
  // same failure the PROTECTED_PREFIXES denylist below was written to undo).
  //
  // The proxy runs BEFORE filesystem routes, so the status here is authoritative
  // and nothing renders at all. Delete this block when the product ships — the
  // pages keep their own notFound() as defence in depth.
  // /api/bootcamp is covered too. The pages were dark but the API was not, and
  // /api/bootcamp/waitlist is unauthenticated by design (it captures an email),
  // so anyone who guessed the URL could write to the waitlist table before the
  // product existed publicly. A feature that is off should be off at every
  // entrance, not just the ones with a UI.
  const path = request.nextUrl.pathname;
  if (!BOOTCAMP_ENABLED && (path.startsWith("/bootcamp") || path.startsWith("/api/bootcamp"))) {
    return new NextResponse(null, { status: 404 });
  }

  // ── Canonical host: apex → www ──────────────────────────────────────────
  // Auth cookies (session AND the PKCE code-verifier) are host-only, so a
  // Google sign-in that starts on one host and returns on the other can never
  // complete — the verifier is missing and the exchange fails. Serve the app
  // on ONE host (www, the canonical since 2026-07-30) so the OAuth loop always
  // closes where it started. GET/HEAD only — the first page load lands on www
  // and everything after originates there.
  if (
    request.nextUrl.hostname === "square1ai.com" &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const url = request.nextUrl.clone();
    url.hostname = "www.square1ai.com";
    return NextResponse.redirect(url, 308);
  }

  // ── OAuth code catcher ──────────────────────────────────────────────────
  // When Supabase can't match the OAuth return against its Redirect-URLs
  // allow-list it falls back to the Site URL — the landing page — with the
  // one-time ?code= in the query and nothing there to consume it. The user
  // sees "Google bounced me back to the landing page", still signed out.
  // Rescue it: forward the code to the real callback on this host. Supabase
  // auth codes are UUIDs; the format guard keeps unrelated ?code= links alone.
  const authCode = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  if (
    !request.nextUrl.pathname.startsWith("/api/") &&
    ((authCode && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authCode)) ||
      // A REFUSED sign-in lands the same way — ?error=access_denied on the Site
      // URL. Previously only ?code= was rescued, so a refusal dropped the
      // visitor on the landing page with an error in the address bar, no
      // message, and no idea sign-in had failed at all.
      (providerError && /^[a-z_]{3,40}$/i.test(providerError)))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/callback";
    // Carry `next` through. Rebuilding the query as ?code=… alone silently
    // discarded the intended destination, so anyone rescued here lost the
    // lesson they were heading for and landed on the default router instead.
    const next = request.nextUrl.searchParams.get("next");
    const params = new URLSearchParams();
    if (authCode) params.set("code", authCode);
    if (providerError) params.set("error", providerError);
    if (next && next.startsWith("/") && !next.startsWith("//")) params.set("next", next);
    url.search = `?${params.toString()}`;
    return NextResponse.redirect(url);
  }

  // Expose the request path to server layouts (they can't read the URL), so
  // the (app) layout's /welcome gate can send the user BACK to where they were
  // heading (e.g. a post-signup Lesson 1 deep link) instead of /dashboard.
  request.headers.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Regional pricing: resolve the visitor's region once, at the edge ───────
  // Vercel's IP geolocation header is only available here and in route
  // handlers, so we translate it to a region cookie that every server
  // component can read cheaply. An EXISTING cookie is never overwritten — a
  // manual override (or a stale-but-chosen region) must always beat IP geo.
  // Set on request.cookies too, so the very first render already sees it.
  const existingRegion = parseRegion(request.cookies.get(S1_REGION_COOKIE)?.value);
  if (!existingRegion) {
    const region = regionForCountry(request.headers.get("x-vercel-ip-country"));
    request.cookies.set(S1_REGION_COOKIE, region);
    supabaseResponse.cookies.set(S1_REGION_COOKIE, region, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      // Readable by the client region selector; carries no personal data.
      httpOnly: false,
    });
  }

  const { pathname } = request.nextUrl;

  // /courses and /courses/{slug} are public; anything DEEPER (assess, checkout,
  // plan, reassess, report, schedule) is private. Enforced here as well as in
  // (app)/layout.tsx because only the edge can still set a real 307 — once the
  // layout renders, the root loading.tsx has begun streaming and a redirect()
  // there can only be delivered as a client-side hop inside a 200 body.
  const segments = pathname.split("/").filter(Boolean);
  const isDeepCourseRoute = segments[0] === "courses" && segments.length >= 3;

  const isProtected =
    isDeepCourseRoute ||
    PROTECTED_EXACT.includes(pathname) ||
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next internals, favicon, all images/videos/audio in /public
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|m4a|mp3|wav|ogg|woff|woff2|ttf|otf|pdf)$).*)",
  ],
};
