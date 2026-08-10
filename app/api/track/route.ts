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
 * "scroll_depth" (value=max % reached), "cta_click" (label=which CTA/section),
 * "quiz_step" (label=step through the skill check), "gate_shown" /
 * "gate_submitted" (the report-unlock on the results page). Anything else is
 * dropped.
 */

const ALLOWED = new Set([
  "section_time",
  "scroll_depth",
  "cta_click",
  "quiz_step",
  "gate_shown",
  "gate_submitted",
]);
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
      // The insert result MUST be inspected. This route returns 204 no matter
      // what, so an ignored error is invisible: on 2026-08-10 the events_type_check
      // constraint rejected every new funnel event type for a full day and the
      // beacons kept returning 204, so the funnel read recorded nothing while
      // looking healthy. A dropped analytics row must never break a page — but it
      // must leave a trace somewhere.
      const { error } = await createAdminClient().from("events").insert(rows);
      if (error) console.error("[track] insert failed", { code: error.code, message: error.message, types: [...new Set(rows.map((r) => r.type))] });
    }
    // 204 keeps the beacon happy with no body.
    return new NextResponse(null, { status: 204 });
  } catch {
    // Analytics must never surface an error to the page.
    return new NextResponse(null, { status: 204 });
  }
}
