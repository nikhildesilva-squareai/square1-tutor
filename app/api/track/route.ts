import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Beacon sink for landing-page engagement events (section attention time +
 * scroll depth). Called via navigator.sendBeacon from <LandingEngagement>, so
 * it must be tiny, unauthenticated, and never block. Writes to the same
 * `events` table as first-party analytics, using the service role (beacons
 * can't set the auth headers browser inserts rely on).
 *
 * Accepted event types: "section_time" (label=section, value=seconds),
 * "scroll_depth" (value=max % reached). Anything else is dropped.
 */

const ALLOWED = new Set(["section_time", "scroll_depth"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Incoming = {
  anonymous_id?: unknown;
  session_id?: unknown;
  type?: unknown;
  path?: unknown;
  label?: unknown;
  value?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const raw: Incoming[] = Array.isArray(body?.events) ? body.events.slice(0, 40) : [];

    const rows = raw
      .filter((e) => typeof e.type === "string" && ALLOWED.has(e.type))
      .filter((e) => typeof e.anonymous_id === "string" && UUID.test(e.anonymous_id))
      .filter((e) => typeof e.session_id === "string" && UUID.test(e.session_id))
      .map((e) => ({
        anonymous_id: e.anonymous_id as string,
        session_id: e.session_id as string,
        type: e.type as string,
        path: typeof e.path === "string" ? (e.path as string).slice(0, 200) : "/",
        label: typeof e.label === "string" ? (e.label as string).slice(0, 60) : null,
        value: Number.isFinite(Number(e.value)) ? Math.max(0, Math.min(100000, Math.round(Number(e.value)))) : null,
      }));

    if (rows.length > 0) {
      await createAdminClient().from("events").insert(rows);
    }
    // 204 keeps the beacon happy with no body.
    return new NextResponse(null, { status: 204 });
  } catch {
    // Analytics must never surface an error to the page.
    return new NextResponse(null, { status: 204 });
  }
}
