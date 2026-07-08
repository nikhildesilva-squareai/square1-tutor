import { NextResponse } from "next/server";

/**
 * First-party client-error sink. The app's error boundaries POST here so
 * uncaught client render errors (which otherwise only hit the browser console)
 * land in the server logs where we can actually see them. Best-effort; never
 * throws. This is the minimal stand-in for the Sentry TODO.
 */
export async function POST(request: Request) {
  try {
    const b = await request.json().catch(() => ({}));
    const path = typeof b?.path === "string" ? b.path.slice(0, 200) : "?";
    const message = typeof b?.message === "string" ? b.message.slice(0, 1000) : "?";
    const stack = typeof b?.stack === "string" ? b.stack.slice(0, 4000) : "";
    const digest = typeof b?.digest === "string" ? b.digest.slice(0, 100) : "";
    // Single line, distinctive prefix so it's greppable in runtime logs.
    console.error(`[CLIENT_ERROR] path=${path} digest=${digest} message=${message}\n${stack}`);
  } catch {
    /* swallow */
  }
  return new NextResponse(null, { status: 204 });
}
