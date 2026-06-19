import { NextResponse } from "next/server";

// ─── Rate limiter ───────────────────────────────────────────────────────────
// Default: in-memory fixed-window counter per IP/user. Zero dependencies, works
// on a single instance. Good enough for current traffic.
//
// CAVEAT: the in-memory store is PER SERVERLESS INSTANCE. On Vercel, concurrent
// instances each keep their own counter, so the effective limit scales with the
// instance count. For a hard global limit, move to Upstash Redis:
//
//   1. Create an Upstash Redis DB → copy its REST URL + token.
//   2. Set env vars  UPSTASH_REDIS_REST_URL  and  UPSTASH_REDIS_REST_TOKEN.
//   3. `npm i @upstash/ratelimit @upstash/redis`
//   4. Replace the body of `rateLimit` with an `@upstash/ratelimit` call.
//      NOTE: that API is async, so callers must `await rateLimit(...)`.
//
// Until those env vars are present we stay in-memory. If they ARE present but
// the package hasn't been wired yet, we warn once so the gap is visible.
const UPSTASH_CONFIGURED = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
let warnedUpstash = false;
function noteUpstashGap() {
  if (UPSTASH_CONFIGURED && !warnedUpstash) {
    warnedUpstash = true;
    console.warn(
      "[rate-limit] Upstash env vars detected but distributed limiting isn't wired yet — " +
        "still using the per-instance in-memory limiter. See lib/rate-limit.ts to activate Redis."
    );
  }
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60000); // every minute

/**
 * Rate limit by key (e.g. user ID or IP).
 * @param key - unique identifier (user ID, IP, etc.)
 * @param limit - max requests per window
 * @param windowMs - window duration in milliseconds
 * @returns { success: boolean, remaining: number } or a NextResponse if blocked
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000, // 1 minute
): { success: true; remaining: number } | { success: false; response: NextResponse } {
  noteUpstashGap();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      ),
    };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

// ─── Preset rate limiters ──────────────────────────────────────────────────

/** AI endpoints: 15 requests per minute */
export function rateLimitAI(userId: string) {
  return rateLimit(`ai:${userId}`, 15, 60000);
}

/** Auth endpoints: 5 requests per minute */
export function rateLimitAuth(ip: string) {
  return rateLimit(`auth:${ip}`, 5, 60000);
}

/** General API: 60 requests per minute */
export function rateLimitGeneral(userId: string) {
  return rateLimit(`api:${userId}`, 60, 60000);
}
