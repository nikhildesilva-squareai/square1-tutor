// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// ─── WHAT THIS GUARDS ─────────────────────────────────────────────────────────
//
// The generated class calendar is the thing a student checks BEFORE paying and
// then plans six months of their life around. Four ways it can be wrong, all of
// them expensive, all of them pinned below:
//
//   1. CONTENT SILENTLY LOST. A holiday lands on week 11 and week 11 evaporates.
//      The student paid for 24 weeks of live instruction and received 23, and
//      gate 3 at week 14 assumes weeks 11–13 happened. The rule is PUSH, NEVER
//      DROP: a break week emits nothing and every later week slides seven days.
//      Session count is IDENTICAL with and without holidays — tested directly.
//
//   2. WEEK NUMBERS RENUMBERED AROUND A HOLIDAY. bootcamp_gates is keyed to
//      weeks 5/10/14/18/22/24 (migration 024). Renumbering would move every gate
//      deadline in the programme without anyone noticing. Week numbers are glued
//      to content; only dates float.
//
//   3. THE WRONG HOUR. Sessions are stored as timestamptz — an absolute instant —
//      but authored as "19:00 in the band's zone". Get the conversion backwards
//      and a Colombo cohort meets at 08:00. Every expected instant below is that
//      conversion done BY HAND from the zone's UTC offset.
//
//   4. DST DRIFT. The single most common timezone bug: a schedule generated in
//      October quietly slides an hour when the clocks change in November, and
//      nobody finds out until half a cohort misses a class. The wall clock is
//      what is fixed; the UTC instant is what must move.
//
// ─── THE ANCHOR ARITHMETIC, DONE BY HAND ──────────────────────────────────────
//
// Every band anchors at 19:00 local (BAND_ANCHOR_HOUR in localtime.ts).
//
//   Asia/Colombo       UTC+5:30, no DST ever   19:00 -> 13:30Z same day
//   Europe/London      GMT  UTC+0              19:00 -> 19:00Z same day
//                      BST  UTC+1              19:00 -> 18:00Z same day
//   America/New_York   EST  UTC-5              19:00 -> 00:00Z NEXT day
//                      EDT  UTC-4              19:00 -> 23:00Z same day
//
// DST boundaries used below, from the rules (not from the module):
//   Europe/London     BST ends   last Sunday of Oct 2026    = 2026-10-25
//                     BST starts last Sunday of Mar 2027    = 2027-03-28
//   America/New_York  EDT ends   first Sunday of Nov 2026   = 2026-11-01
//                     EDT starts second Sunday of Mar 2027  = 2027-03-14
//
// ─── THE WEEK TEMPLATE ────────────────────────────────────────────────────────
//
//   week 0        kickoff  (day +0)
//   weeks 1..N    class (+0), lab (+2), office_hours (+3)
//   week N-2      + viva     (+4)
//   week N        + demo_day (+4)
//
// Cohort 1 starts Monday 5 Oct 2026, so +0/+2/+3/+4 are Mon/Wed/Thu/Fri.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  generateSchedule,
  duplicateSlotKeys,
  BAND_ANCHOR_HOUR,
  type Holiday,
  type PlannedSession,
} from "../../lib/bootcamp/sessions.ts";

const BAND_A = "Asia/Colombo";
/** bootcamp_cohorts 'Cohort 1', migration 023. Monday. */
const COHORT_1_START = "2026-10-05";
const WEEKS = 24;

/** The hour rendered in a zone, straight from Intl — deliberately NOT the
 *  module's own conversion, so this cross-checks rather than echoes. */
function localHourIn(iso: string, tz: string): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", hour12: false,
  }).formatToParts(new Date(iso)).find((p) => p.type === "hour")?.value ?? "";
  return Number(h) % 24;
}

function localDayIn(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso));
}

const at = (s: PlannedSession[], week: number, kind: string) =>
  s.find((x) => x.week === week && x.kind === kind);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Shape — 24 weeks of content actually exist
// ═══════════════════════════════════════════════════════════════════════════════

describe("a 24-week cohort generates 24 weeks of content", () => {
  const plan = generateSchedule({
    startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: [],
  });

  test("week numbers run 0..24 with no gaps", () => {
    const weeks = [...new Set(plan.sessions.map((s) => s.week))].sort((a, b) => a - b);
    assert.equal(weeks.length, 25, "expected weeks 0 through 24 inclusive");
    assert.equal(weeks[0], 0);
    assert.equal(weeks[24], 24);
    for (let w = 0; w <= 24; w++) assert.equal(weeks[w], w, `week ${w} is missing`);
  });

  test("week 0 is a kickoff and nothing else — orientation is not a teaching week", () => {
    const w0 = plan.sessions.filter((s) => s.week === 0);
    assert.equal(w0.length, 1);
    assert.equal(w0[0].kind, "kickoff");
    assert.equal(w0[0].durationMin, 60);
    assert.equal(w0[0].localDate, "2026-10-05");
  });

  test("every teaching week has exactly one class, one lab and one office hours", () => {
    for (let w = 1; w <= 24; w++) {
      const kinds = plan.sessions.filter((s) => s.week === w).map((s) => s.kind);
      assert.ok(kinds.includes("class"), `week ${w} has no class`);
      assert.ok(kinds.includes("lab"), `week ${w} has no lab`);
      assert.ok(kinds.includes("office_hours"), `week ${w} has no office hours`);
      assert.equal(kinds.filter((k) => k === "class").length, 1, `week ${w} has two classes`);
    }
  });

  test("75 sessions: 1 kickoff + 24x3 + 1 viva + 1 demo day", () => {
    // Hand count: 1 + 72 + 1 + 1.
    assert.equal(plan.sessions.length, 75);
  });

  test("the flagship class is 90 minutes; lab and office hours are 60", () => {
    assert.equal(at(plan.sessions, 7, "class")!.durationMin, 90);
    assert.equal(at(plan.sessions, 7, "lab")!.durationMin, 60);
    assert.equal(at(plan.sessions, 7, "office_hours")!.durationMin, 60);
  });

  test("Mon / Wed / Thu — a student blocked on Monday night is not stuck for a week", () => {
    // Week 7 with no holidays: 5 Oct + 49 days = Mon 23 Nov 2026.
    assert.equal(at(plan.sessions, 7, "class")!.localDate, "2026-11-23");
    assert.equal(at(plan.sessions, 7, "lab")!.localDate, "2026-11-25");
    assert.equal(at(plan.sessions, 7, "office_hours")!.localDate, "2026-11-26");
  });

  test("the viva block sits at week 22 — gate 5 'Capstone and viva' (migration 024)", () => {
    const viva = plan.sessions.filter((s) => s.kind === "viva");
    assert.equal(viva.length, 1);
    assert.equal(viva[0].week, 22);
    // 5 Oct + 154 days = Mon 8 Mar 2027; +4 = Fri 12 Mar.
    assert.equal(viva[0].localDate, "2027-03-12");
  });

  test("demo day closes the final week", () => {
    const demo = plan.sessions.filter((s) => s.kind === "demo_day");
    assert.equal(demo.length, 1);
    assert.equal(demo[0].week, 24);
    // 5 Oct + 168 = Mon 22 Mar 2027 (= bootcamp_cohorts.ends_on); +4 = Fri 26 Mar.
    assert.equal(demo[0].localDate, "2027-03-26");
  });

  test("no one_to_one rows — the weekly 1-1 is booked per student in S6, not band-anchored", () => {
    assert.equal(plan.sessions.filter((s) => s.kind === "one_to_one").length, 0);
  });

  test("Zoom fields are absent — a later task fills them once credentials exist", () => {
    for (const s of plan.sessions) {
      assert.ok(!("zoomJoinUrl" in s), "the generator must not invent Zoom state");
    }
  });

  test("(week, kind) is unique, so the seed script's idempotency key holds", () => {
    assert.deepEqual(duplicateSlotKeys(plan.sessions), []);
  });

  test("with no holidays there is no slip: 25 calendar weeks for weeks 0..24", () => {
    assert.deepEqual(plan.breakWeeks, []);
    assert.equal(plan.firstSessionOn, "2026-10-05");
    assert.equal(plan.lastSessionOn, "2027-03-26");
    assert.equal(plan.calendarWeeks, 25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. The class lands at 19:00 in the COHORT's own zone
// ═══════════════════════════════════════════════════════════════════════════════

describe("the band anchor: 19:00 local, converted by hand", () => {
  test("BAND_ANCHOR_HOUR is 19 — this file's arithmetic assumes it", () => {
    assert.equal(BAND_ANCHOR_HOUR, 19);
  });

  test("Colombo (UTC+5:30, no DST): Mon 5 Oct 2026 19:00 = 13:30Z", () => {
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: [],
    });
    assert.equal(at(plan.sessions, 0, "kickoff")!.startsAt, "2026-10-05T13:30:00.000Z");
    // Week 1 class: Mon 12 Oct.
    assert.equal(at(plan.sessions, 1, "class")!.startsAt, "2026-10-12T13:30:00.000Z");
    // Week 1 lab: Wed 14 Oct.
    assert.equal(at(plan.sessions, 1, "lab")!.startsAt, "2026-10-14T13:30:00.000Z");
  });

  test("every session in every band renders 19:00 in the cohort's zone", () => {
    for (const tz of ["Asia/Colombo", "Europe/London", "America/New_York", "Pacific/Auckland"]) {
      const plan = generateSchedule({
        startsOn: COHORT_1_START, weeks: WEEKS, timezone: tz, holidays: [],
      });
      for (const s of plan.sessions) {
        assert.equal(localHourIn(s.startsAt, tz), 19, `${tz} week ${s.week} ${s.kind} is not 19:00`);
      }
    }
  });

  test("localDate is the date in the COHORT's zone, not UTC", () => {
    // 19:00 New York in November is 00:00 UTC the NEXT day. localDate must still
    // say Monday, or the calendar a student reads is off by a day.
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: "America/New_York", holidays: [],
    });
    const wk4 = at(plan.sessions, 4, "class")!;
    assert.equal(wk4.localDate, "2026-11-02");
    assert.equal(wk4.startsAt, "2026-11-03T00:00:00.000Z"); // EST, UTC-5
    assert.equal(localDayIn(wk4.startsAt, "America/New_York"), "2026-11-02");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DST — the wall clock is fixed, the instant moves
// ═══════════════════════════════════════════════════════════════════════════════

describe("DST does not shift the local wall-clock time", () => {
  test("America/New_York across the 1 Nov 2026 EDT->EST fallback", () => {
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: "America/New_York", holidays: [],
    });
    // Week 0, Mon 5 Oct 2026 — still EDT (UTC-4): 19:00 -> 23:00Z same day.
    assert.equal(at(plan.sessions, 0, "kickoff")!.startsAt, "2026-10-05T23:00:00.000Z");
    // Week 4, Mon 2 Nov 2026 — EST (UTC-5): 19:00 -> 00:00Z the next day.
    assert.equal(at(plan.sessions, 4, "class")!.startsAt, "2026-11-03T00:00:00.000Z");
    // The UTC instant moved an hour. The local hour did not.
    assert.equal(localHourIn(at(plan.sessions, 0, "kickoff")!.startsAt, "America/New_York"), 19);
    assert.equal(localHourIn(at(plan.sessions, 4, "class")!.startsAt, "America/New_York"), 19);
  });

  test("America/New_York across the 14 Mar 2027 EST->EDT spring-forward", () => {
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: "America/New_York", holidays: [],
    });
    // Week 22, Mon 8 Mar 2027 — still EST: 19:00 -> 00:00Z on 9 Mar.
    assert.equal(at(plan.sessions, 22, "class")!.startsAt, "2027-03-09T00:00:00.000Z");
    // Week 23, Mon 15 Mar 2027 — EDT: 19:00 -> 23:00Z same day.
    assert.equal(at(plan.sessions, 23, "class")!.startsAt, "2027-03-15T23:00:00.000Z");
  });

  test("Europe/London across the 25 Oct 2026 BST->GMT fallback", () => {
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: "Europe/London", holidays: [],
    });
    // Week 0, Mon 5 Oct 2026 — BST (UTC+1): 19:00 -> 18:00Z.
    assert.equal(at(plan.sessions, 0, "kickoff")!.startsAt, "2026-10-05T18:00:00.000Z");
    // Week 3, Mon 26 Oct 2026 — the day after the change, GMT: 19:00 -> 19:00Z.
    assert.equal(at(plan.sessions, 3, "class")!.startsAt, "2026-10-26T19:00:00.000Z");
  });

  test("Europe/London across the 28 Mar 2027 GMT->BST spring-forward", () => {
    // Short cohort straddling the change: week 0 = Mon 22 Mar (GMT),
    // week 1 = Mon 29 Mar (BST, the day after).
    const plan = generateSchedule({
      startsOn: "2027-03-22", weeks: 4, timezone: "Europe/London", holidays: [],
    });
    assert.equal(at(plan.sessions, 0, "kickoff")!.startsAt, "2027-03-22T19:00:00.000Z");
    assert.equal(at(plan.sessions, 1, "class")!.startsAt, "2027-03-29T18:00:00.000Z");
    for (const s of plan.sessions) {
      assert.equal(localHourIn(s.startsAt, "Europe/London"), 19);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Holidays PUSH. They never drop.
// ═══════════════════════════════════════════════════════════════════════════════

describe("a holiday week pushes the schedule out instead of dropping a class", () => {
  // Mon 12 Oct 2026 is week 1's class day. Land a holiday exactly on it.
  const onWeekOneClass: Holiday[] = [{ date: "2026-10-12", name: "Test holiday" }];

  const clean = generateSchedule({
    startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: [],
  });
  const pushed = generateSchedule({
    startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: onWeekOneClass,
  });

  test("NOTHING is dropped — same session count, same week numbers, same kinds", () => {
    assert.equal(pushed.sessions.length, clean.sessions.length);
    assert.deepEqual(
      pushed.sessions.map((s) => `${s.week}:${s.kind}`).sort(),
      clean.sessions.map((s) => `${s.week}:${s.kind}`).sort(),
    );
  });

  test("week 1 is not renumbered — it is still week 1, seven days later", () => {
    assert.equal(at(clean.sessions, 1, "class")!.localDate, "2026-10-12");
    assert.equal(at(pushed.sessions, 1, "class")!.localDate, "2026-10-19");
  });

  test("the push is CUMULATIVE — every later week moves too, not just the broken one", () => {
    assert.equal(at(clean.sessions, 24, "class")!.localDate, "2027-03-22");
    assert.equal(at(pushed.sessions, 24, "class")!.localDate, "2027-03-29");
  });

  test("the break is reported, so the cost is visible before anything is written", () => {
    assert.equal(pushed.breakWeeks.length, 1);
    assert.deepEqual(pushed.breakWeeks[0], {
      week: 1,
      wouldHaveStartedOn: "2026-10-12",
      holidayName: "Test holiday",
      holidayOn: "2026-10-12",
    });
    assert.equal(pushed.calendarWeeks, 26); // 25 + one week of slip
  });

  test("a holiday on a NON-session day costs nothing — Sat/Sun move no one", () => {
    // Sat 17 and Sun 18 Oct 2026 are inside week 1 but are not session days.
    const weekend = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A,
      holidays: [{ date: "2026-10-17", name: "Saturday holiday" },
                 { date: "2026-10-18", name: "Sunday holiday" }],
    });
    assert.deepEqual(weekend.breakWeeks, []);
    assert.equal(at(weekend.sessions, 1, "class")!.localDate, "2026-10-12");
  });

  test("a holiday on the LAB day pushes the whole week — the week is the unit", () => {
    // Wed 14 Oct 2026 is week 1's lab.
    const lab = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A,
      holidays: [{ date: "2026-10-14", name: "Wednesday holiday" }],
    });
    assert.equal(lab.breakWeeks.length, 1);
    assert.equal(at(lab.sessions, 1, "class")!.localDate, "2026-10-19");
  });

  test("skipsWeek: false is advisory — it appears nowhere and moves nothing", () => {
    const advisory = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A,
      holidays: [{ date: "2026-10-12", name: "Noted, not observed", skipsWeek: false }],
    });
    assert.deepEqual(advisory.breakWeeks, []);
    assert.equal(at(advisory.sessions, 1, "class")!.localDate, "2026-10-12");
  });

  test("spansDays covers a multi-day festival from one row", () => {
    // Sat 10 Oct + 3 days = 10, 11, 12 Oct. Only the 12th (Monday) is a session day.
    const eid = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A,
      holidays: [{ date: "2026-10-10", name: "Three-day festival", spansDays: 3 }],
    });
    assert.equal(eid.breakWeeks.length, 1);
    assert.equal(eid.breakWeeks[0].holidayOn, "2026-10-10");
    assert.equal(at(eid.sessions, 1, "class")!.localDate, "2026-10-19");
  });

  test("consecutive holidays push a week more than once", () => {
    // Mon 12, Mon 19 and Mon 26 Oct 2026 all blocked -> week 1 lands 2 Nov.
    const triple = generateSchedule({
      startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A,
      holidays: [
        { date: "2026-10-12", name: "A" },
        { date: "2026-10-19", name: "B" },
        { date: "2026-10-26", name: "C" },
      ],
    });
    assert.equal(triple.breakWeeks.length, 3);
    assert.deepEqual(triple.breakWeeks.map((b) => b.holidayName), ["A", "B", "C"]);
    assert.equal(at(triple.sessions, 1, "class")!.localDate, "2026-11-02");
    // And week 2 follows immediately after, not back at its original slot.
    assert.equal(at(triple.sessions, 2, "class")!.localDate, "2026-11-09");
  });

  test("a run of holidays long enough to be a data error refuses to generate", () => {
    // Nine consecutive Mondays blocked. That is a spans_days typo, not a calendar.
    const mondays: Holiday[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(2026, 9, 12) + i * 7 * 86_400_000);
      mondays.push({ date: d.toISOString().slice(0, 10), name: `Block ${i}` });
    }
    assert.throws(
      () => generateSchedule({ startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: mondays }),
      /pushed 9 times running/,
    );
  });

  test("the pushed class is still 19:00 local — a push is a date change, not a time change", () => {
    assert.equal(at(pushed.sessions, 1, "class")!.startsAt, "2026-10-19T13:30:00.000Z");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Cohort 1 against the real seeded Band A calendar (migration 029)
//
// The Band A rows from 029 that fall in or near Cohort 1's window. Poya dates
// are the 2026 Sri Lankan gazette; 2027 rows are projections and 029 marks them
// as such. Every collision below was worked out by hand from the weekday.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Cohort 1 (Band A, 5 Oct 2026, 24 weeks) against the seeded holidays", () => {
  const bandA: Holiday[] = [
    { date: "2026-10-25", name: "Vap Full Moon Poya Day" },        // Sunday  — no session
    { date: "2026-11-08", name: "Deepavali", spansDays: 2 },       // Sun+Mon — hits a class
    { date: "2026-11-24", name: "Ill Full Moon Poya Day" },        // Tuesday — no session
    { date: "2026-12-23", name: "Unduvap Full Moon Poya Day" },    // Wednesday — hits a lab
    { date: "2026-12-24", name: "Year-end break", spansDays: 9 },  // 24 Dec – 1 Jan
    { date: "2027-01-22", name: "Duruthu Full Moon Poya Day" },    // Friday  — no session
    { date: "2027-02-20", name: "Navam Full Moon Poya Day" },      // Saturday — no session
    { date: "2027-03-10", name: "Eid al-Fitr", spansDays: 3 },     // Wed–Fri — hits a lab
    { date: "2027-03-21", name: "Madin Full Moon Poya Day" },      // Sunday  — no session
    { date: "2027-04-13", name: "Sinhala & Tamil New Year", spansDays: 2 }, // Tue+Wed — hits a lab
    { date: "2027-04-20", name: "Bak Full Moon Poya Day" },        // Tuesday — no session
    { date: "2027-05-20", name: "Vesak Full Moon Poya Day", spansDays: 2 },
  ];

  const plan = generateSchedule({
    startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: bandA,
  });

  test("all 75 sessions survive — five holidays, zero lost classes", () => {
    assert.equal(plan.sessions.length, 75);
    assert.deepEqual(duplicateSlotKeys(plan.sessions), []);
    const weeks = [...new Set(plan.sessions.map((s) => s.week))];
    assert.equal(weeks.length, 25);
  });

  test("exactly the five collisions worked out by hand, in order", () => {
    assert.deepEqual(plan.breakWeeks, [
      // Deepavali day 2 is Mon 9 Nov = week 5's class.
      { week: 5,  wouldHaveStartedOn: "2026-11-09", holidayName: "Deepavali", holidayOn: "2026-11-08" },
      // Unduvap Poya is Wed 23 Dec = week 10's lab.
      { week: 10, wouldHaveStartedOn: "2026-12-21", holidayName: "Unduvap Full Moon Poya Day", holidayOn: "2026-12-23" },
      // Pushed into the year-end shutdown, which swallows Mon 28 Dec too.
      { week: 10, wouldHaveStartedOn: "2026-12-28", holidayName: "Year-end break", holidayOn: "2026-12-24" },
      // Eid al-Fitr day 1 is Wed 10 Mar = week 19's lab.
      { week: 19, wouldHaveStartedOn: "2027-03-08", holidayName: "Eid al-Fitr", holidayOn: "2027-03-10" },
      // Avurudu day 2 is Wed 14 Apr = week 23's lab.
      { week: 23, wouldHaveStartedOn: "2027-04-12", holidayName: "Sinhala & Tamil New Year", holidayOn: "2027-04-13" },
    ]);
  });

  test("Poya days that fall at the weekend cost nothing", () => {
    // Vap Poya, Sun 25 Oct 2026: week 2 (Mon 19 Oct) is untouched.
    assert.equal(at(plan.sessions, 2, "class")!.localDate, "2026-10-19");
    // Ill Poya, Tue 24 Nov 2026: week 6 runs its normal Mon/Wed/Thu around it.
    assert.equal(at(plan.sessions, 6, "class")!.localDate, "2026-11-23");
    assert.equal(at(plan.sessions, 6, "lab")!.localDate, "2026-11-25");
  });

  test("week 5 resumes the week after Deepavali", () => {
    assert.equal(at(plan.sessions, 4, "class")!.localDate, "2026-11-02");
    assert.equal(at(plan.sessions, 5, "class")!.localDate, "2026-11-16");
  });

  test("teaching resumes on Mon 4 Jan 2027, the first clear Monday after the shutdown", () => {
    assert.equal(at(plan.sessions, 9,  "class")!.localDate, "2026-12-14");
    assert.equal(at(plan.sessions, 10, "class")!.localDate, "2027-01-04");
  });

  test("24 weeks of content lands over 30 calendar weeks — five weeks of published slip", () => {
    assert.equal(plan.firstSessionOn, "2026-10-05");
    assert.equal(plan.lastSessionOn, "2027-04-30");
    assert.equal(plan.calendarWeeks, 30);
    // bootcamp_cohorts.ends_on is 2027-03-22 (migration 023). It is now wrong by
    // exactly the slip, which is why the seed script prints this comparison.
    assert.equal(plan.breakWeeks.length, 5);
  });

  test("the whole cohort is still 19:00 Asia/Colombo = 13:30Z, holidays or not", () => {
    for (const s of plan.sessions) {
      assert.ok(s.startsAt.endsWith("T13:30:00.000Z"), `${s.week}:${s.kind} at ${s.startsAt}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Week numbering stays inside the CHECK constraint
// ═══════════════════════════════════════════════════════════════════════════════

describe("week numbering respects bootcamp_sessions_week_sane (0..52)", () => {
  test("no generated week is below 0 or above 52, even at the maximum length", () => {
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: 52, timezone: BAND_A, holidays: [],
    });
    for (const s of plan.sessions) {
      assert.ok(s.week >= 0 && s.week <= 52, `week ${s.week} violates the CHECK`);
      assert.ok(Number.isInteger(s.week));
    }
    assert.equal(Math.max(...plan.sessions.map((s) => s.week)), 52);
  });

  test("holidays push DATES, never week numbers past 52", () => {
    // Twenty blocked Mondays: the calendar stretches, the numbering does not.
    const blocked: Holiday[] = [];
    for (let i = 0; i < 40; i += 2) {
      const d = new Date(Date.UTC(2026, 9, 12) + i * 7 * 86_400_000);
      blocked.push({ date: d.toISOString().slice(0, 10), name: `Block ${i}` });
    }
    const plan = generateSchedule({
      startsOn: COHORT_1_START, weeks: 52, timezone: BAND_A, holidays: blocked,
    });
    assert.equal(Math.max(...plan.sessions.map((s) => s.week)), 52);
    assert.ok(plan.breakWeeks.length > 0);
    assert.ok(plan.calendarWeeks > 53, "the calendar must stretch when weeks are lost");
  });

  test("a bootcamp longer than 52 weeks refuses rather than writing an unsavable row", () => {
    assert.throws(
      () => generateSchedule({ startsOn: COHORT_1_START, weeks: 53, timezone: BAND_A, holidays: [] }),
      /caps week at 52/,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Refuse bad input rather than generating a plausible wrong calendar
// ═══════════════════════════════════════════════════════════════════════════════

describe("bad input is refused, not absorbed", () => {
  const base = { startsOn: COHORT_1_START, weeks: WEEKS, timezone: BAND_A, holidays: [] };

  test("a malformed start date", () => {
    assert.throws(() => generateSchedule({ ...base, startsOn: "5 Oct 2026" }), /YYYY-MM-DD/);
  });

  test("a non-integer or zero week count", () => {
    assert.throws(() => generateSchedule({ ...base, weeks: 0 }), /positive integer/);
    assert.throws(() => generateSchedule({ ...base, weeks: 24.5 }), /positive integer/);
  });

  test("a timezone Intl cannot resolve", () => {
    assert.throws(() => generateSchedule({ ...base, timezone: "Asia/Colomboo" }), /not a valid IANA zone/);
  });

  test("a malformed holiday date", () => {
    assert.throws(
      () => generateSchedule({ ...base, holidays: [{ date: "2026/12/23", name: "Bad" }] }),
      /malformed date/,
    );
  });

  test("a nonsensical spansDays", () => {
    assert.throws(
      () => generateSchedule({ ...base, holidays: [{ date: "2026-12-23", name: "Bad", spansDays: 0 }] }),
      /must be a positive integer/,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. The cohort start weekday is not assumed to be Monday
// ═══════════════════════════════════════════════════════════════════════════════

describe("nothing assumes the week starts on a Monday", () => {
  test("a Wednesday-start cohort meets on Wed / Fri / Sat", () => {
    // Wed 7 Oct 2026.
    const plan = generateSchedule({
      startsOn: "2026-10-07", weeks: 4, timezone: BAND_A, holidays: [],
    });
    assert.equal(at(plan.sessions, 1, "class")!.localDate, "2026-10-14");        // Wed
    assert.equal(at(plan.sessions, 1, "lab")!.localDate, "2026-10-16");          // Fri
    assert.equal(at(plan.sessions, 1, "office_hours")!.localDate, "2026-10-17"); // Sat
  });
});
