import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/about",
  "/diagnostic",
  "/try",
  "/business",
  "/careers",
  "/contact",
  "/research",
  "/api/auth/callback",
  "/api/onboard",
  "/portfolio/",
  "/verify",
];

export async function proxy(request: NextRequest) {
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
