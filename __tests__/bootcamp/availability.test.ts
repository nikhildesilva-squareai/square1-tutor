// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// Cohort 1 as seeded (migration 023):
//   applications 2026-09-15 -> 2026-10-01 (inclusive), 50 seats, starts 2026-10-05
//
// WHY THIS FILE EXISTS. The first cut of the sales page collapsed availability to
// one boolean, so a cohort with all 50 seats free but applications not open until
// 15 September rendered as "This cohort is full". Telling a buyer the thing is
// gone when it has not started selling is the worst possible wrong answer. These
// tests pin all five states and the order they are resolved in.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  cohortAvailability,
  isJoinable,
  isWindowOpen,
  seatsLeftFor,
  displaySeatsLeft,
  toDayString,
  type CohortWindow,
} from "../../lib/bootcamp/availability.ts";

const COHORT_1: CohortWindow = {
  seats: 50,
  applications_open_on: "2026-09-15",
  applications_close_on: "2026-10-01",
};

const on = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("the bug this module exists to prevent", () => {
  test("an empty cohort before its window is NOT full", () => {
    const a = cohortAvailability(COHORT_1, 0, on("2026-08-19"));
    assert.notEqual(a.state, "full", "50 free seats must never report as full");
    assert.equal(a.state, "not_open_yet");
  });

  test("and it tells the buyer when it opens, so the page can say something useful", () => {
    const a = cohortAvailability(COHORT_1, 0, on("2026-08-19"));
    assert.equal(a.state === "not_open_yet" && a.opensOn, "2026-09-15");
  });
});

describe("window boundaries — inclusive at both ends", () => {
  test("the day before opening is not_open_yet", () => {
    assert.equal(cohortAvailability(COHORT_1, 0, on("2026-09-14")).state, "not_open_yet");
  });

  test("the opening day itself is open", () => {
    assert.equal(cohortAvailability(COHORT_1, 0, on("2026-09-15")).state, "open");
  });

  test("the closing day is still open — applying on the deadline is in time", () => {
    assert.equal(cohortAvailability(COHORT_1, 0, on("2026-10-01")).state, "open");
  });

  test("the day after closing is closed, not full", () => {
    const a = cohortAvailability(COHORT_1, 0, on("2026-10-02"));
    assert.equal(a.state, "closed");
    assert.equal(a.state === "closed" && a.seatsLeft, 50);
  });

  test("isWindowOpen agrees with the state machine at every boundary", () => {
    assert.equal(isWindowOpen(COHORT_1, on("2026-09-14")), false);
    assert.equal(isWindowOpen(COHORT_1, on("2026-09-15")), true);
    assert.equal(isWindowOpen(COHORT_1, on("2026-10-01")), true);
    assert.equal(isWindowOpen(COHORT_1, on("2026-10-02")), false);
  });
});

describe("full is terminal and outranks the window", () => {
  test("all seats taken inside the window is full", () => {
    assert.equal(cohortAvailability(COHORT_1, 50, on("2026-09-20")).state, "full");
  });

  test("all seats taken BEFORE the window is still full, not not_open_yet", () => {
    // Documents the resolution order: full is irreversible, so it wins over a
    // temporal state that would imply waiting could help.
    assert.equal(cohortAvailability(COHORT_1, 50, on("2026-08-19")).state, "full");
  });

  test("over-accepting does not produce a negative or a joinable state", () => {
    const a = cohortAvailability(COHORT_1, 63, on("2026-09-20"));
    assert.equal(a.state, "full");
    assert.equal(displaySeatsLeft(a), 0);
  });

  test("49 of 50 taken is still open", () => {
    const a = cohortAvailability(COHORT_1, 49, on("2026-09-20"));
    assert.equal(a.state, "open");
    assert.equal(a.state === "open" && a.seatsLeft, 1);
  });
});

describe("no cohort at all", () => {
  test("a waitlist track resolves to no_cohort", () => {
    assert.equal(cohortAvailability(null, 0, on("2026-09-20")).state, "no_cohort");
  });

  test("no_cohort has no seat number to show", () => {
    assert.equal(displaySeatsLeft(cohortAvailability(null, 0, on("2026-09-20"))), null);
  });
});

describe("isJoinable — the CTA gate", () => {
  test("only `open` is joinable", () => {
    assert.equal(isJoinable(cohortAvailability(COHORT_1, 0, on("2026-09-20"))), true);
  });

  test("every other state is not", () => {
    const notJoinable = [
      cohortAvailability(COHORT_1, 0, on("2026-08-19")),  // not_open_yet
      cohortAvailability(COHORT_1, 0, on("2026-10-02")),  // closed
      cohortAvailability(COHORT_1, 50, on("2026-09-20")), // full
      cohortAvailability(null, 0, on("2026-09-20")),      // no_cohort
    ];
    for (const a of notJoinable) {
      assert.equal(isJoinable(a), false, a.state);
    }
  });
});

describe("seatsLeftFor — AD-08, honest numbers", () => {
  test("cap minus accepted", () => {
    assert.equal(seatsLeftFor(50, 31), 19);
  });

  test("never negative", () => {
    assert.equal(seatsLeftFor(50, 60), 0);
  });

  test("takes exactly two arguments — a third would be somewhere to inflate scarcity", () => {
    assert.equal(seatsLeftFor.length, 2);
  });
});

describe("toDayString — UTC, not local", () => {
  test("uses the UTC calendar day", () => {
    assert.equal(toDayString(new Date("2026-09-15T00:30:00Z")), "2026-09-15");
  });

  test("late-UTC instants do not roll forward a day", () => {
    // A viewer in Auckland is already on the 16th here, but the DB `date` column
    // has no zone, so comparisons must be made in UTC or the boundary shifts.
    assert.equal(toDayString(new Date("2026-09-15T23:59:00Z")), "2026-09-15");
  });

  test("the first instant of a day is that day", () => {
    assert.equal(toDayString(new Date("2026-10-01T00:00:00Z")), "2026-10-01");
  });
});

describe("as seeded, today", () => {
  test("Cohort 1 is not_open_yet on 19 Aug 2026 — matching what the DB reports", () => {
    // Guards against the seed and the code drifting apart: the live query returns
    // window_open = false for this date, and the module must agree.
    const a = cohortAvailability(COHORT_1, 0, on("2026-08-19"));
    assert.equal(a.state, "not_open_yet");
    assert.equal(isJoinable(a), false);
    assert.equal(displaySeatsLeft(a), 50);
  });
});
