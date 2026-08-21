// ═══════════════════════════════════════════════════════════════════════════════
// Seed a cohort's 24-week class calendar into bootcamp_sessions.
//
//   DRY RUN (default — prints, writes nothing):
//     node --env-file=.env.local scripts/seed-bootcamp-sessions.ts \
//          --bootcamp ai-engineering --cohort "Cohort 1"
//
//   APPLY:
//     node --env-file=.env.local scripts/seed-bootcamp-sessions.ts \
//          --bootcamp ai-engineering --cohort "Cohort 1" --apply
//
// NOTHING IS WRITTEN WITHOUT --apply. This script decides fifty people's Monday
// nights for six months; it prints the whole calendar and waits.
//
// ─── IDEMPOTENT ON (cohort_id, week, kind) ────────────────────────────────────
//
// Existing rows are read first and matched on (week, kind). A row that already
// exists is SKIPPED, never re-inserted and never silently overwritten — a
// student may already hold a Zoom registrant link and a calendar entry for it.
//
// If a matched row's starts_at no longer agrees with what the generator produces
// — which happens whenever a holiday is corrected, and Eid is 'estimated' by
// construction — the drift is reported loudly and left alone. Moving it is a
// separate, explicit act: --reschedule.
//
// ─── ZOOM ─────────────────────────────────────────────────────────────────────
//
// TODO(S5-zoom): zoom_meeting_id, zoom_join_url and zoom_start_url are written
// NULL. There are no Zoom credentials in this project yet. Once Server-to-Server
// OAuth exists, lib/zoom/ creates a registration-enabled meeting per row and
// backfills those three columns plus bootcamp_session_registrants. Rows produced
// here are deliberately the input to that step, not a substitute for it.
// zoom_start_url must never leave the service role (migration 021).
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { generateSchedule, duplicateSlotKeys, type Holiday } from "../lib/bootcamp/sessions.ts";

// ─── args ────────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function die(msg: string): never {
  console.error(`\n  ERROR  ${msg}\n`);
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const RESCHEDULE = process.argv.includes("--reschedule");

const USAGE = `
  node --env-file=.env.local scripts/seed-bootcamp-sessions.ts \\
       --bootcamp <slug> --cohort <name> [--apply] [--reschedule]

    --bootcamp     bootcamps.slug, e.g. ai-engineering
    --cohort       bootcamp_cohorts.name, e.g. "Cohort 1"
    --cohort-id    alternatively, the cohort uuid directly (skips the two above)
    --apply        actually write. Without it this is a dry run.
    --reschedule   also UPDATE starts_at on existing rows whose date has drifted.
                   Students may already hold calendar entries for the old date.
`;

// ─── formatting ──────────────────────────────────────────────────────────────

const KIND_LABEL: Record<string, string> = {
  kickoff: "kickoff     ",
  class: "class       ",
  lab: "lab         ",
  office_hours: "office hours",
  viva: "viva block  ",
  demo_day: "demo day    ",
};

function weekdayIn(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" })
    .format(new Date(iso));
}

function localTimeIn(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));
}

function rule(char = "─"): string {
  return char.repeat(78);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local");
  }

  const cohortId = arg("cohort-id");
  const bootcampSlug = arg("bootcamp");
  const cohortName = arg("cohort");
  if (!cohortId && !(bootcampSlug && cohortName)) {
    console.error(USAGE);
    die("Give either --cohort-id, or both --bootcamp and --cohort.");
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // ── 1. the cohort ──────────────────────────────────────────────────────────

  let q = db
    .from("bootcamp_cohorts")
    .select("id, name, band, timezone, starts_on, ends_on, status, bootcamp_id, bootcamps!inner(slug, title, weeks)");

  q = cohortId ? q.eq("id", cohortId) : q.eq("name", cohortName!).eq("bootcamps.slug", bootcampSlug!);

  const { data: cohorts, error: cohortErr } = await q;
  if (cohortErr) die(`reading bootcamp_cohorts: ${cohortErr.message}`);
  if (!cohorts?.length) die(`No cohort matched. (bootcamp=${bootcampSlug} cohort=${cohortName} id=${cohortId})`);
  if (cohorts.length > 1) {
    die(`${cohorts.length} cohorts matched — pass --cohort-id to disambiguate:\n` +
        cohorts.map((c: any) => `    ${c.id}  ${c.bootcamps.slug}  ${c.name}`).join("\n"));
  }

  const cohort = cohorts[0] as any;
  const bootcamp = cohort.bootcamps;
  const weeks: number = bootcamp.weeks;

  // ── 2. the holidays this BAND observes ─────────────────────────────────────
  //
  // Filtered in SQL by band, and windowed generously: the schedule can slip well
  // past ends_on, so a holiday two months after the nominal end can still be the
  // one that pushes the final week.

  const windowStart = cohort.starts_on;
  const windowEnd = new Date(
    Date.parse(`${cohort.starts_on}T00:00:00Z`) + (weeks * 7 + 180) * 86_400_000,
  ).toISOString().slice(0, 10);

  const { data: holidayRows, error: holErr } = await db
    .from("bootcamp_holidays")
    .select("holiday_on, name, spans_days, skips_week, confidence, source")
    .contains("applies_to_bands", [cohort.band])
    .gte("holiday_on", windowStart)
    .lte("holiday_on", windowEnd)
    .order("holiday_on");

  if (holErr) {
    die(`reading bootcamp_holidays: ${holErr.message}\n` +
        `         Has migrations/029_bootcamp_holidays.sql been applied?`);
  }

  const holidays: Holiday[] = (holidayRows ?? []).map((h: any) => ({
    date: h.holiday_on,
    name: h.name,
    spansDays: h.spans_days,
    skipsWeek: h.skips_week,
  }));

  // ── 3. generate ────────────────────────────────────────────────────────────

  const plan = generateSchedule({
    startsOn: cohort.starts_on,
    weeks,
    timezone: cohort.timezone,
    holidays,
  });

  const dupes = duplicateSlotKeys(plan.sessions);
  if (dupes.length) {
    die(`the generated schedule has duplicate (week, kind) keys: ${dupes.join(", ")}\n` +
        `         The idempotency key below would silently skip them. Fix weekSlots() in lib/bootcamp/sessions.ts.`);
  }

  // ── 4. what already exists ─────────────────────────────────────────────────

  const { data: existingRows, error: exErr } = await db
    .from("bootcamp_sessions")
    .select("id, week, kind, title, starts_at, duration_min, status, zoom_meeting_id")
    .eq("cohort_id", cohort.id);
  if (exErr) die(`reading bootcamp_sessions: ${exErr.message}`);

  const existing = new Map<string, any>();
  for (const r of existingRows ?? []) existing.set(`${r.week}:${r.kind}`, r);

  const toInsert = [];
  const drifted = [];
  let unchanged = 0;

  for (const s of plan.sessions) {
    const key = `${s.week}:${s.kind}`;
    const prior = existing.get(key);
    if (!prior) {
      toInsert.push(s);
      continue;
    }
    if (new Date(prior.starts_at).toISOString() !== s.startsAt) {
      drifted.push({ prior, planned: s });
    } else {
      unchanged++;
    }
  }

  const orphans = (existingRows ?? []).filter(
    (r: any) => !plan.sessions.some((s) => s.week === r.week && s.kind === r.kind),
  );

  // ── 5. report ──────────────────────────────────────────────────────────────

  const tz = cohort.timezone;
  console.log(`\n${rule("═")}`);
  console.log(`  ${bootcamp.title} — ${cohort.name}   [${cohort.status}]`);
  console.log(`  cohort_id  ${cohort.id}`);
  console.log(`  band ${cohort.band}  ·  ${tz}  ·  ${weeks} weeks  ·  starts ${cohort.starts_on}`);
  console.log(rule("═"));

  console.log(`\n  HOLIDAYS OBSERVED BY BAND ${cohort.band} (${holidays.length} rows in window)`);
  if (!holidayRows?.length) {
    console.log("    none — is migration 029 applied and seeded?");
  } else {
    for (const h of holidayRows as any[]) {
      const flag = h.confidence === "estimated" ? " ESTIMATED" : "";
      const adv = h.skips_week ? "" : " (advisory only)";
      const span = h.spans_days > 1 ? ` +${h.spans_days - 1}d` : "";
      console.log(`    ${h.holiday_on}${span.padEnd(5)} ${h.name}${adv}${flag}`);
    }
    const est = (holidayRows as any[]).filter((h) => h.confidence === "estimated").length;
    if (est) {
      console.log(`\n    ${est} of these are ESTIMATED (lunar / not yet gazetted). Re-check them`);
      console.log(`    before publishing this calendar, and re-run with --reschedule if any move.`);
    }
  }

  console.log(`\n  BREAK WEEKS — ${plan.breakWeeks.length} push${plan.breakWeeks.length === 1 ? "" : "es"}, nothing dropped`);
  if (!plan.breakWeeks.length) {
    console.log("    none");
  } else {
    for (const b of plan.breakWeeks) {
      console.log(`    week ${String(b.week).padStart(2)} would have started ${b.wouldHaveStartedOn} — ${b.holidayName} (${b.holidayOn})`);
    }
  }

  console.log(`\n  SCHEDULE — ${plan.sessions.length} sessions   (+ = to insert, ~ = date drifted)`);
  let lastWeek = -1;
  for (const s of plan.sessions) {
    if (s.week !== lastWeek) {
      console.log(`    ${rule("┈")}`);
      lastWeek = s.week;
    }
    const key = `${s.week}:${s.kind}`;
    const mark = !existing.has(key) ? "+" : drifted.some((d) => d.planned === s) ? "~" : " ";
    console.log(
      `    ${mark} w${String(s.week).padStart(2)}  ${KIND_LABEL[s.kind] ?? s.kind}  ` +
      `${weekdayIn(s.startsAt, tz)} ${s.localDate}  ${localTimeIn(s.startsAt, tz)} ${tz}  ` +
      `${String(s.durationMin).padStart(3)}m`,
    );
  }

  console.log(`\n  END DATE`);
  console.log(`    first session          ${plan.firstSessionOn}`);
  console.log(`    last session           ${plan.lastSessionOn}`);
  console.log(`    calendar weeks used    ${plan.calendarWeeks}  (nominal ${weeks + 1}, slip ${plan.calendarWeeks - weeks - 1})`);
  console.log(`    bootcamp_cohorts.ends_on  ${cohort.ends_on}`);
  if (cohort.ends_on < plan.lastSessionOn) {
    console.log(`\n    ends_on is EARLIER than the last session. Holiday slip moved the`);
    console.log(`    real end date. This script does NOT touch ends_on — update it in the`);
    console.log(`    desk so the sales page and the calendar agree.`);
  }

  console.log(`\n  DIFF`);
  console.log(`    insert     ${toInsert.length}`);
  console.log(`    unchanged  ${unchanged}`);
  console.log(`    drifted    ${drifted.length}`);
  console.log(`    orphaned   ${orphans.length}`);

  for (const d of drifted) {
    console.log(`    ~ w${String(d.planned.week).padStart(2)} ${d.planned.kind}: ` +
                `${new Date(d.prior.starts_at).toISOString()} -> ${d.planned.startsAt}` +
                (d.prior.zoom_meeting_id ? "   HAS A ZOOM MEETING — moving it needs a Zoom update too" : ""));
  }
  for (const o of orphans as any[]) {
    console.log(`    ! w${String(o.week).padStart(2)} ${o.kind} exists in the DB but not in the plan — left alone, delete by hand if wrong`);
  }

  // ── 6. write, or don't ─────────────────────────────────────────────────────

  if (!APPLY) {
    console.log(`\n${rule("═")}`);
    console.log(`  DRY RUN — nothing was written.`);
    console.log(`  Re-run with --apply to insert the ${toInsert.length} new session${toInsert.length === 1 ? "" : "s"}.`);
    console.log(`${rule("═")}\n`);
    return;
  }

  if (!toInsert.length && !(RESCHEDULE && drifted.length)) {
    console.log(`\n  Nothing to do — the cohort's calendar already matches.\n`);
    return;
  }

  if (toInsert.length) {
    // TODO(S5-zoom): zoom_meeting_id / zoom_join_url / zoom_start_url stay NULL.
    // lib/zoom/ fills them once Server-to-Server OAuth credentials exist.
    const rows = toInsert.map((s) => ({
      cohort_id: cohort.id,
      week: s.week,
      kind: s.kind,
      title: s.title,
      starts_at: s.startsAt,
      duration_min: s.durationMin,
      status: "scheduled",
      zoom_meeting_id: null,
      zoom_join_url: null,
      zoom_start_url: null,
    }));

    const { error } = await db.from("bootcamp_sessions").insert(rows);
    if (error) die(`inserting sessions: ${error.message}`);
    console.log(`\n  Inserted ${rows.length} sessions.`);
  }

  if (drifted.length) {
    if (!RESCHEDULE) {
      console.log(`\n  ${drifted.length} row${drifted.length === 1 ? "" : "s"} drifted and were LEFT ALONE.`);
      console.log(`  Students may already hold calendar entries for those dates. To move them:`);
      console.log(`    ...same command... --apply --reschedule\n`);
    } else {
      for (const d of drifted) {
        const { error } = await db
          .from("bootcamp_sessions")
          .update({ starts_at: d.planned.startsAt, title: d.planned.title })
          .eq("id", d.prior.id);
        if (error) die(`rescheduling session ${d.prior.id}: ${error.message}`);
      }
      console.log(`  Rescheduled ${drifted.length} sessions.`);
      console.log(`  Any of these with a Zoom meeting still need the meeting moved in Zoom.`);
      console.log(`  Students holding the old date have NOT been notified — that is a separate step.`);
    }
  }

  console.log(`\n  Done.\n`);
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
