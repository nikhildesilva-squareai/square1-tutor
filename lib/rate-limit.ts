import { NextResponse } from "next/server";

// ─── Simple in-memory rate limiter ─────────────────────────────────────────
// Uses a sliding window counter per IP/user.
// For production scale, swap with @upstash/ratelimit + Redis.
// This provides protection without requiring an external service.

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
