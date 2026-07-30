import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { S1_REGION_COOKIE, parseRegion, regionForCountry } from "@/lib/pricing";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/about",
  "/diagnostic",
  "/tools", // curated AI-tools directory (public discovery surface)
  "/try",
  "/business",
  "/careers",
  "/contact",
  "/research",
  "/newsroom", // daily tech news — public + crawlable (SEO surface like /research)
  "/report", // tokenized public skill reports (opt-in shares)
  "/api/auth/callback",
  "/api/onboard",
  "/portfolio/",
  "/verify",
];

export async function proxy(request: NextRequest) {
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

  const isPublic =
    PUBLIC_PATHS.some((p) =>
      p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
    ) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    // SEO / metadata routes (must be reachable by crawlers + social scrapers)
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("opengraph-image") ||
    pathname.includes("twitter-image") ||
    // Static media in /public — videos, images, audio
    pathname.startsWith("/videos") ||
    pathname.startsWith("/images") ||
    // Allow API routes (each route protects itself)
    pathname.startsWith("/api") ||
    // Dev-only fixture previews (the pages themselves 404 in production)
    (process.env.NODE_ENV !== "production" && pathname.startsWith("/dev/"));

  if (!user && !isPublic) {
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
