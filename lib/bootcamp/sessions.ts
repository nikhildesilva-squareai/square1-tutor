// ═══════════════════════════════════════════════════════════════════════════════
// Bootcamp session generation — S5. Pure, no imports (Intl is a JS built-in).
//
// Turns "this cohort starts on 5 Oct 2026, runs 24 weeks, anchored to
// Asia/Colombo, and observes these holidays" into the exact list of
// bootcamp_sessions rows to create. No database, no Zoom, no clock — same input,
// same output, forever. scripts/seed-bootcamp-sessions.ts is the only thing that
// writes; this file only decides.
//
// ─── THE TWO DECISIONS THAT MATTER ────────────────────────────────────────────
//
// 1. A HOLIDAY PUSHES THE SCHEDULE OUT. IT NEVER DROPS A CLASS.
//
//    A student paid for 24 weeks of live instruction. If Unduvap Poya lands on
//    week 11's lab day and we "skip week 11", they paid for 24 and received 23.
//    That is a refund conversation, and it is also a content problem: gate 3 at
//    week 14 assumes weeks 11–13 happened. So a break week emits NO sessions and
//    every remaining week slides seven days later. The cohort finishes later.
//    Everything gets delivered.
//
//    The cost is honest and visible: `calendarWeeks` and `lastSessionOn` come
//    back in the result so whoever seeds the cohort sees the real end date before
//    anything is written, and can reconcile bootcamp_cohorts.ends_on against it.
//
// 2. THE WEEK NUMBER IS CONTENT, NOT A DATE.
//
//    bootcamp_gates rows are keyed to weeks 5/10/14/18/22/24 (migration 024).
//    bootcamp_gates.unlocks_module_ids is keyed to weeks. So `week` must stay
//    glued to the curriculum: week 11 pushed by seven days is still week 11.
//    Only the calendar date floats. Renumbering weeks around a holiday would
//    silently move every gate deadline in the programme.
//
// ─── WHAT A WEEK LOOKS LIKE ───────────────────────────────────────────────────
//
// From docs/bootcamp-live-architecture.md §"Session types" — the rule there is
// "never lecture live", because 736 recorded lessons already do that better.
// Live time buys the three things async cannot:
//
//   week 0        kickoff       60 min   Mon   meet the cohort, how gates work
//   weeks 1..N    class         90 min   Mon   live code review of REAL submissions
//                 lab           60 min   Wed   squad build, instructor rotates rooms
//                 office_hours  60 min   Thu   drop-in queue
//   week N-2      viva         180 min   Fri   gate 5 viva block (see below)
//   week N        demo_day     120 min   Fri   hiring surface, cohort + partners
//
// Mon/Wed/Thu are offsets from the cohort's START WEEKDAY, not literally Monday.
// If a cohort starts on a Tuesday, the class is Tuesdays. Nothing here assumes
// the week begins on any particular day.
//
// The `viva` row is a BLOCK, not one student's viva. A viva is 20 recorded
// minutes per student and 50 of those do not fit in a session row (duration_min
// caps at 480 by CHECK). This row is the calendar anchor and the parent Zoom
// meeting; S6 books individual slots against it.
//
// ─── WHAT THIS FILE DELIBERATELY DOES NOT DO ──────────────────────────────────
//
// No `one_to_one` rows. The weekly 1-1 is booked against mentor availability in
// S6, per student, at an hour that suits them — generating 50 × 24 of them here
// against a band anchor would be wrong for every student in the wrong timezone.
//
// No Zoom fields. TODO(S5-zoom): meeting creation lands in lib/zoom/ once
// Server-to-Server OAuth credentials exist; it fills zoom_meeting_id /
// zoom_join_url / zoom_start_url on rows this file produced.
//
// ─── IMPORT-FREE ──────────────────────────────────────────────────────────────
//
// `node --test` runs this with no bundler and no path aliases, so every
// lib/bootcamp/*.ts file must stand alone. BAND_ANCHOR_HOUR / _MINUTE and the
// zoned-time conversion below are DUPLICATED from lib/bootcamp/localtime.ts for
// that reason and no other. If you change the anchor hour, change it in both
// files — the tests in __tests__/bootcamp/sessions.test.ts pin 19:00 by hand and
// will catch a one-sided edit.
// ═══════════════════════════════════════════════════════════════════════════════

export type SessionKind =
  | "kickoff"
  | "class"
  | "lab"
  | "office_hours"
  | "one_to_one"
  | "viva"
  | "demo_day";

/** A holiday the cohort observes. Already filtered to the cohort's band by the
 *  caller — this file has no opinion about who observes what. */
export interface Holiday {
  /** "YYYY-MM-DD", the first day of the observance. */
  date: string;
  name: string;
  /** Observance length INCLUSIVE of `date`. Eid is 3, a year-end shutdown ~12.
   *  Defaults to 1. */
  spansDays?: number;
  /** false = advisory only: show it on the calendar, move nothing.
   *  Defaults to true. */
  skipsWeek?: boolean;
}

export interface PlannedSession {
  /** 0..weeks. Glued to the curriculum, never renumbered by a holiday. */
  week: number;
  kind: SessionKind;
  title: string;
  /** The absolute instant, ISO-8601 UTC. Goes straight into starts_at. */
  startsAt: string;
  durationMin: number;
  /** "YYYY-MM-DD" in the COHORT's zone. Not stored — it is what a human reads
   *  when checking the generated calendar against a holiday list. */
  localDate: string;
}

export interface BreakWeek {
  /** The week that was pushed. Its sessions still happen, seven days later. */
  week: number;
  /** Where the week would have started had this holiday not existed. */
  wouldHaveStartedOn: string;
  holidayName: string;
  holidayOn: string;
}

export interface Schedule {
  sessions: PlannedSession[];
  /** Every push, in order. Empty when no holiday collided. */
  breakWeeks: BreakWeek[];
  /** "YYYY-MM-DD" of the first and last session, in the cohort's zone. */
  firstSessionOn: string;
  lastSessionOn: string;
  /** Calendar weeks actually consumed, INCLUDING pushes. Compare against
   *  `weeks + 1` (weeks 0..N) to see the slip a holiday calendar cost you. */
  calendarWeeks: number;
}

export interface ScheduleInput {
  /** bootcamp_cohorts.starts_on, "YYYY-MM-DD". */
  startsOn: string;
  /** bootcamps.weeks. Produces week numbers 0..weeks. */
  weeks: number;
  /** bootcamp_cohorts.timezone — the band anchor. */
  timezone: string;
  /** Already filtered to the cohort's band. */
  holidays: Holiday[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** DUPLICATED from lib/bootcamp/localtime.ts — see the import-free note above.
 *  Every band anchors its live hour at 19:00 local to its own zone. */
export const BAND_ANCHOR_HOUR = 19;
export const BAND_ANCHOR_MINUTE = 0;

/** Day offsets from the cohort's start weekday. If a cohort starts Monday these
 *  are Mon / Wed / Thu / Fri. Wed and Thu are two clear days apart so a student
 *  who is blocked on Monday night is not waiting until the following week. */
const DAY_CLASS = 0;
const DAY_LAB = 2;
const DAY_OFFICE_HOURS = 3;
const DAY_CEREMONY = 4;

const KICKOFF_MIN = 60;
const CLASS_MIN = 90;
const LAB_MIN = 60;
const OFFICE_HOURS_MIN = 60;
const VIVA_BLOCK_MIN = 180;
const DEMO_DAY_MIN = 120;

/** bootcamp_sessions_week_sane: CHECK (week BETWEEN 0 AND 52). Week 0 is the
 *  kickoff, so `weeks` itself may not exceed 52. */
const MAX_WEEK = 52;

/** How many consecutive seven-day pushes one week is allowed before we call the
 *  holiday data wrong rather than the schedule unlucky. Eight weeks of unbroken
 *  holiday is not a calendar, it is a spans_days typo. */
const MAX_CONSECUTIVE_PUSHES = 8;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ─── Date arithmetic (calendar dates, not instants) ──────────────────────────

/** Midnight UTC for a "YYYY-MM-DD". A pure calendar-date handle — never treat
 *  it as the instant the day begins anywhere. */
function dateToUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

const DAY_MS = 86_400_000;

function addDays(iso: string, n: number): string {
  return utcMsToDate(dateToUtcMs(iso) + n * DAY_MS);
}

// ─── Zoned time (DUPLICATED from localtime.ts — see the note above) ──────────

/** The wall-clock an instant shows in `tz`, expressed as a UTC timestamp so two
 *  wall-clocks can be subtracted. Not a real instant — an intermediate. */
function wallClockAsUtcMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const hour = n("hour") % 24; // some locales render midnight as 24
  return Date.UTC(n("year"), n("month") - 1, n("day"), hour, n("minute"), n("second"));
}

/**
 * Turn a wall-clock time in a zone into the absolute instant it refers to.
 *
 * Measured with Intl rather than assumed, so DST is handled rather than
 * hard-coded. This is why a class authored as "19:00 Asia/Colombo" stays at
 * 19:00 through a DST transition in any band instead of drifting an hour — the
 * stored instant moves, the local wall-clock does not.
 *
 * Two passes: the first corrects the bulk offset, the second settles the case
 * where that correction crossed a DST boundary.
 */
function zonedTimeToInstant(
  dateISO: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d, hour, minute, 0);
  let utc = target;
  for (let i = 0; i < 2; i++) {
    utc += target - wallClockAsUtcMs(new Date(utc), timeZone);
  }
  return new Date(utc);
}

// ─── The week template ───────────────────────────────────────────────────────

interface SlotSpec {
  kind: SessionKind;
  dayOffset: number;
  durationMin: number;
  title: string;
}

/**
 * What sessions week `week` contains, before any date is assigned.
 *
 * Week 0 is kickoff ONLY — orientation, not teaching. Weeks 1..N carry the
 * three-session rhythm. The viva block hangs off week N-2 (gate 5, "Capstone and
 * viva", sits at week 22 of 24 in migration 024) and demo day off week N.
 */
function weekSlots(week: number, weeks: number): SlotSpec[] {
  if (week === 0) {
    return [{
      kind: "kickoff",
      dayOffset: DAY_CLASS,
      durationMin: KICKOFF_MIN,
      title: "Kickoff — meet your cohort",
    }];
  }

  const slots: SlotSpec[] = [
    { kind: "class",        dayOffset: DAY_CLASS,        durationMin: CLASS_MIN,        title: `Week ${week} — live code review` },
    { kind: "lab",          dayOffset: DAY_LAB,          durationMin: LAB_MIN,          title: `Week ${week} — squad lab` },
    { kind: "office_hours", dayOffset: DAY_OFFICE_HOURS, durationMin: OFFICE_HOURS_MIN, title: `Week ${week} — office hours` },
  ];

  // Gate 5 is "Capstone and viva" at week 22 of a 24-week programme. Expressed
  // relative to the end so it stays correct for a bootcamp of any length.
  if (weeks >= 3 && week === weeks - 2) {
    slots.push({
      kind: "viva",
      dayOffset: DAY_CEREMONY,
      durationMin: VIVA_BLOCK_MIN,
      title: `Week ${week} — gate 5 viva block`,
    });
  }

  if (week === weeks) {
    slots.push({
      kind: "demo_day",
      dayOffset: DAY_CEREMONY,
      durationMin: DEMO_DAY_MIN,
      title: "Demo day",
    });
  }

  return slots;
}

// ─── Holiday collision ───────────────────────────────────────────────────────

interface HolidayRange {
  startMs: number;
  /** Exclusive. */
  endMs: number;
  name: string;
  date: string;
}

function toRanges(holidays: Holiday[]): HolidayRange[] {
  const out: HolidayRange[] = [];
  for (const h of holidays) {
    if (h.skipsWeek === false) continue; // advisory only: shown, but moves nothing
    if (!ISO_DATE.test(h.date)) {
      throw new Error(`bootcamp holiday "${h.name}" has a malformed date: ${h.date}`);
    }
    const span = h.spansDays ?? 1;
    if (!Number.isInteger(span) || span < 1) {
      throw new Error(`bootcamp holiday "${h.name}" (${h.date}) has spansDays ${span}; must be a positive integer`);
    }
    const startMs = dateToUtcMs(h.date);
    out.push({ startMs, endMs: startMs + span * DAY_MS, name: h.name, date: h.date });
  }
  return out;
}

/** The first holiday hitting any of this week's session days, or null.
 *  Only SESSION days are checked. A Poya on the Saturday of a teaching week
 *  costs nobody a class, so it costs nobody a week either. */
function collisionFor(
  weekStart: string,
  slots: SlotSpec[],
  ranges: HolidayRange[],
): HolidayRange | null {
  const offsets = [...new Set(slots.map((s) => s.dayOffset))].sort((a, b) => a - b);
  for (const offset of offsets) {
    const dayMs = dateToUtcMs(weekStart) + offset * DAY_MS;
    for (const r of ranges) {
      if (dayMs >= r.startMs && dayMs < r.endMs) return r;
    }
  }
  return null;
}

// ─── The generator ───────────────────────────────────────────────────────────

/**
 * The whole of S5's scheduling half: cohort facts in, bootcamp_sessions rows out.
 *
 * Throws rather than returning something plausible-but-wrong. A schedule that is
 * quietly off by a week is worse than one that refuses to generate — the first
 * gets published to 50 people, the second gets fixed in five minutes.
 */
export function generateSchedule(input: ScheduleInput): Schedule {
  const { startsOn, weeks, timezone, holidays } = input;

  if (!ISO_DATE.test(startsOn)) {
    throw new Error(`startsOn must be YYYY-MM-DD, got: ${startsOn}`);
  }
  if (!Number.isInteger(weeks) || weeks < 1) {
    throw new Error(`weeks must be a positive integer, got: ${weeks}`);
  }
  // Week 0 exists, so week numbers run 0..weeks and the CHECK ceiling is on `weeks`.
  if (weeks > MAX_WEEK) {
    throw new Error(
      `weeks is ${weeks}; bootcamp_sessions_week_sane caps week at ${MAX_WEEK}`,
    );
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new Error(`timezone "${timezone}" is not a valid IANA zone`);
  }

  const ranges = toRanges(holidays);

  const sessions: PlannedSession[] = [];
  const breakWeeks: BreakWeek[] = [];

  // Cumulative, and it persists ACROSS weeks — that is what "push out" means.
  // Reset it per week and you would silently drop the break week instead.
  let pushDays = 0;

  for (let week = 0; week <= weeks; week++) {
    const slots = weekSlots(week, weeks);

    let weekStart = addDays(startsOn, week * 7 + pushDays);
    let pushes = 0;

    for (;;) {
      const hit = collisionFor(weekStart, slots, ranges);
      if (!hit) break;

      breakWeeks.push({
        week,
        wouldHaveStartedOn: weekStart,
        holidayName: hit.name,
        holidayOn: hit.date,
      });

      pushDays += 7;
      weekStart = addDays(weekStart, 7);

      if (++pushes > MAX_CONSECUTIVE_PUSHES) {
        throw new Error(
          `week ${week} was pushed ${pushes} times running from ${startsOn}; ` +
          `check bootcamp_holidays for a bad spans_days rather than accepting this schedule`,
        );
      }
    }

    for (const slot of slots) {
      const localDate = addDays(weekStart, slot.dayOffset);
      sessions.push({
        week,
        kind: slot.kind,
        title: slot.title,
        startsAt: zonedTimeToInstant(
          localDate,
          BAND_ANCHOR_HOUR,
          BAND_ANCHOR_MINUTE,
          timezone,
        ).toISOString(),
        durationMin: slot.durationMin,
        localDate,
      });
    }
  }

  sessions.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0));

  const firstSessionOn = sessions[0].localDate;
  const lastSessionOn = sessions[sessions.length - 1].localDate;
  const spanDays = (dateToUtcMs(lastSessionOn) - dateToUtcMs(startsOn)) / DAY_MS;

  return {
    sessions,
    breakWeeks,
    firstSessionOn,
    lastSessionOn,
    calendarWeeks: Math.floor(spanDays / 7) + 1,
  };
}

/**
 * (week, kind) is the idempotency key the seeding script writes against, so it
 * has to be unique inside one cohort's schedule. It is today — week 22 holds a
 * lab AND a viva, week 24 a class AND a demo day, but never two of a kind.
 *
 * Exported because a future week template is exactly the kind of change that
 * breaks this quietly: add a second lab to a week and the seed script starts
 * skipping it as a duplicate instead of failing.
 */
export function duplicateSlotKeys(sessions: PlannedSession[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const s of sessions) {
    const key = `${s.week}:${s.kind}`;
    if (seen.has(key)) dupes.push(key);
    seen.add(key);
  }
  return dupes;
}
