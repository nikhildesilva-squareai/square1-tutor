// ═══════════════════════════════════════════════════════════════════════════════
// Bootcamp catalogue — server-side reads for the PUBLIC product surface.
//
// WHY createAdminClient AND NOT createClient
//
// migration 021 grants SELECT on `bootcamps` / `bootcamp_cohorts` to
// `authenticated` only; `anon` has no grant at all. A logged-out visitor reading
// through the cookie client therefore sees an empty catalogue — the marketing
// pages would render blank for exactly the people they exist for.
//
// The service-role client bypasses RLS, so the status filter is enforced HERE
// instead. Every query in this file must carry `status <> 'draft'`; a draft
// bootcamp is unlisted by product decision, and there is no second line of
// defence once RLS is out of the picture.
//
// This also sidesteps the documented Next 16 trap: a cookie-reading Supabase
// client forces dynamic rendering and silently kills generateStaticParams. The
// admin client reads no cookies, so these pages stay statically analysable —
// though the sales page still opts into dynamic rendering, because a cached seat
// count is a dishonest seat count (AD-08).
// ═══════════════════════════════════════════════════════════════════════════════

import { createAdminClient } from "@/lib/supabase/admin";
import { cohortAvailability, isJoinable, type Availability } from "./availability";
import type {
  Bootcamp,
  BootcampCohort,
  BootcampStatus,
  CohortStatus,
} from "@/types/database";

export interface CatalogueCourse {
  slug: string;
  title: string;
  total_lessons: number | null;
  total_projects: number | null;
}

export interface CatalogueEntry {
  bootcamp: Bootcamp;
  course: CatalogueCourse;
  /** The cohort a visitor could actually join, if any. */
  cohort: BootcampCohort | null;
  /** Five-state answer to "can someone join?" — never collapsed to a boolean by
   *  the caller, so the page can distinguish "not open yet" from "full". */
  availability: Availability;
  /** Convenience mirror of availability.state === "open". */
  joinable: boolean;
}

const LISTABLE: BootcampStatus[] = ["waitlist", "open"];
const SELLABLE: CohortStatus[] = ["open"];

/** Accepted applications for a cohort. The ONLY input to the seat counter
 *  besides the cap — see seatsRemaining(), which takes no offset. */
async function acceptedCount(cohortIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (cohortIds.length === 0) return out;

  const admin = createAdminClient();
  const { data } = await admin
    .from("bootcamp_applications")
    .select("cohort_id")
    .in("cohort_id", cohortIds)
    .eq("status", "accepted");

  for (const row of data ?? []) {
    const id = (row as { cohort_id: string }).cohort_id;
    out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
}

/** Every listable track, each with its joinable cohort if one exists. */
export async function listBootcamps(now: Date = new Date()): Promise<CatalogueEntry[]> {
  const admin = createAdminClient();

  const { data: bootcamps } = await admin
    .from("bootcamps")
    .select("*, course:courses(slug, title, total_lessons, total_projects)")
    .in("status", LISTABLE)
    .order("status", { ascending: false }) // 'waitlist' < 'open' alphabetically → open first
    .order("title");

  const rows = (bootcamps ?? []) as (Bootcamp & { course: CatalogueCourse })[];
  if (rows.length === 0) return [];

  const { data: cohorts } = await admin
    .from("bootcamp_cohorts")
    .select("*")
    .in("bootcamp_id", rows.map((b) => b.id))
    .in("status", SELLABLE)
    .order("starts_on", { ascending: true });

  const byBootcamp = new Map<string, BootcampCohort>();
  for (const c of (cohorts ?? []) as BootcampCohort[]) {
    if (!byBootcamp.has(c.bootcamp_id)) byBootcamp.set(c.bootcamp_id, c); // soonest wins
  }

  const taken = await acceptedCount([...byBootcamp.values()].map((c) => c.id));

  return rows.map((b) => {
    const cohort = byBootcamp.get(b.id) ?? null;
    const availability = cohortAvailability(cohort, cohort ? taken.get(cohort.id) ?? 0 : 0, now);
    return { bootcamp: b, course: b.course, cohort, availability, joinable: isJoinable(availability) };
  });
}

/** One track by slug. Returns null for unknown or draft — the page 404s on null,
 *  so a draft bootcamp is genuinely unreachable rather than merely unlinked. */
export async function getBootcamp(
  slug: string,
  now: Date = new Date(),
): Promise<CatalogueEntry | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("bootcamps")
    .select("*, course:courses(slug, title, total_lessons, total_projects)")
    .eq("slug", slug)
    .in("status", LISTABLE)
    .maybeSingle();

  if (!data) return null;
  const bootcamp = data as Bootcamp & { course: CatalogueCourse };

  const { data: cohortRow } = await admin
    .from("bootcamp_cohorts")
    .select("*")
    .eq("bootcamp_id", bootcamp.id)
    .in("status", SELLABLE)
    .order("starts_on", { ascending: true })
    .limit(1)
    .maybeSingle();

  const cohort = (cohortRow as BootcampCohort | null) ?? null;
  const taken = cohort ? await acceptedCount([cohort.id]) : new Map<string, number>();
  const availability = cohortAvailability(cohort, cohort ? taken.get(cohort.id) ?? 0 : 0, now);

  return { bootcamp, course: bootcamp.course, cohort, availability, joinable: isJoinable(availability) };
}

/** The six gates for a track, in order. `requires` is not selected — it is
 *  service-role-read-only by design and has no business on a marketing page. */
export async function getGates(bootcampId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bootcamp_gates")
    .select("id, order_index, week, title, summary_md")
    .eq("bootcamp_id", bootcampId)
    .order("order_index");
  return (data ?? []) as {
    id: string; order_index: number; week: number; title: string; summary_md: string;
  }[];
}

/** Long-form date for marketing copy: "5 October 2026". */
export function formatCohortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
