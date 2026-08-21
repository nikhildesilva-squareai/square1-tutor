// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// Cohort 1 as seeded: starts 2026-10-05. Instalments 2 and 3 fall at weeks 4 and
// 8, so 2026-11-02 and 2026-11-30.
//
// WHAT THIS GUARDS. Payment is one-off checkout — no card is stored, nothing is
// charged while the student is away — so instalments 2 and 3 do not collect
// themselves. Somebody has to be asked, and then eventually cut off. Both of
// those are decisions about a person halfway through a six-month course they
// have already part-paid for, which is why the grace period is generous and why
// suspension keys off a MISSED INSTALMENT rather than off "has a balance".
//
// Getting the second part wrong is the dangerous one: every three-part student
// carries a balance from the moment they enrol, so a naive "outstanding > 0"
// rule would suspend the entire cohort on day one.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  INSTALMENT_GRACE_DAYS,
  instalmentDueDate,
  instalmentState,
  nextDueInstalment,
  shouldSuspendForNonPayment,
} from "../../lib/bootcamp/enrolment.ts";

const GLOBAL = { full: 79900, threePart: [15000, 37000, 37000] as const };
const START = "2026-10-05";
const at = (iso: string) => new Date(iso);

describe("instalmentDueDate — weeks counted from the cohort start", () => {
  test("week 4 and week 8", () => {
    assert.equal(instalmentDueDate(START, 4).toISOString(), "2026-11-02T00:00:00.000Z");
    assert.equal(instalmentDueDate(START, 8).toISOString(), "2026-11-30T00:00:00.000Z");
  });

  test("everything is collected inside the first half of the programme", () => {
    // Deliberate: money is collected before dropout risk materialises, so we are
    // never chasing someone who has already disengaged.
    const start = at(`${START}T00:00:00Z`).getTime();
    const week12 = start + 12 * 7 * 86_400_000;
    assert.ok(instalmentDueDate(START, 8).getTime() < week12);
  });
});

describe("instalmentState", () => {
  const due = instalmentDueDate(START, 4); // 2026-11-02

  test("upcoming before the date", () => {
    assert.equal(instalmentState(due, at("2026-11-01T12:00:00Z")), "upcoming");
  });

  test("due on the day", () => {
    assert.equal(instalmentState(due, at("2026-11-02T00:00:00Z")), "due");
  });

  test("still due on the last day of grace", () => {
    assert.equal(INSTALMENT_GRACE_DAYS, 10);
    assert.equal(instalmentState(due, at("2026-11-12T00:00:00Z")), "due");
  });

  test("overdue once grace runs out", () => {
    assert.equal(instalmentState(due, at("2026-11-12T00:00:01Z")), "overdue");
    assert.equal(instalmentState(due, at("2026-11-20T00:00:00Z")), "overdue");
  });
});

describe("nextDueInstalment", () => {
  test("instalment 1 is never returned — the offer governs it, not the calendar", () => {
    // Payment 1 is due on acceptance and has no week. Treating it as a cohort
    // instalment would have the reminder cron chasing people who have not
    // enrolled and hold no seat.
    assert.equal(nextDueInstalment(GLOBAL, "three_part", [], START, at("2026-10-06T00:00:00Z")), null);
  });

  test("pay-in-full never has a later instalment", () => {
    assert.equal(nextDueInstalment(GLOBAL, "full", [1], START, at("2026-11-05T00:00:00Z")), null);
    assert.equal(nextDueInstalment(GLOBAL, "full", [], START, at("2026-11-05T00:00:00Z")), null);
  });

  test("after instalment 1, number 2 at week 4", () => {
    const d = nextDueInstalment(GLOBAL, "three_part", [1], START, at("2026-10-10T00:00:00Z"));
    assert.equal(d?.number, 2);
    assert.equal(d?.amountCents, 37000);
    assert.equal(d?.state, "upcoming");
    assert.equal(d?.daysLate, 0);
  });

  test("on the due date it reads due, with no days late", () => {
    const d = nextDueInstalment(GLOBAL, "three_part", [1], START, at("2026-11-02T06:00:00Z"));
    assert.equal(d?.state, "due");
    assert.equal(d?.daysLate, 0);
  });

  test("days late counts from the due date, not from the grace end", () => {
    const d = nextDueInstalment(GLOBAL, "three_part", [1], START, at("2026-11-09T00:00:00Z"));
    assert.equal(d?.daysLate, 7);
    assert.equal(d?.state, "due", "still inside the 10-day grace");
  });

  test("past grace it reads overdue", () => {
    const d = nextDueInstalment(GLOBAL, "three_part", [1], START, at("2026-11-15T00:00:00Z"));
    assert.equal(d?.state, "overdue");
    assert.equal(d?.daysLate, 13);
  });

  test("once 2 is paid it moves to 3 at week 8", () => {
    const d = nextDueInstalment(GLOBAL, "three_part", [1, 2], START, at("2026-11-15T00:00:00Z"));
    assert.equal(d?.number, 3);
    assert.equal(d?.state, "upcoming");
  });

  test("fully paid returns nothing", () => {
    assert.equal(nextDueInstalment(GLOBAL, "three_part", [1, 2, 3], START, at("2027-01-01T00:00:00Z")), null);
  });
});

describe("shouldSuspendForNonPayment — the rule that must not overreach", () => {
  test("a three-part student who just enrolled is NOT suspended", () => {
    // They owe $740 and are entirely up to date. A rule keyed on "outstanding
    // balance" instead of "missed instalment" would suspend the whole cohort on
    // day one.
    assert.equal(
      shouldSuspendForNonPayment(GLOBAL, "three_part", [1], START, at("2026-10-06T00:00:00Z")),
      false,
    );
  });

  test("not suspended while inside the grace period", () => {
    assert.equal(
      shouldSuspendForNonPayment(GLOBAL, "three_part", [1], START, at("2026-11-10T00:00:00Z")),
      false,
    );
  });

  test("suspended once grace has run out", () => {
    assert.equal(
      shouldSuspendForNonPayment(GLOBAL, "three_part", [1], START, at("2026-11-20T00:00:00Z")),
      true,
    );
  });

  test("a paid-in-full student is never suspended for non-payment", () => {
    for (const when of ["2026-10-06", "2026-11-20", "2027-03-01"]) {
      assert.equal(
        shouldSuspendForNonPayment(GLOBAL, "full", [1], START, at(`${when}T00:00:00Z`)),
        false,
        when,
      );
    }
  });

  test("keeping up with instalments never triggers suspension", () => {
    assert.equal(
      shouldSuspendForNonPayment(GLOBAL, "three_part", [1, 2], START, at("2026-11-20T00:00:00Z")),
      false,
    );
    assert.equal(
      shouldSuspendForNonPayment(GLOBAL, "three_part", [1, 2, 3], START, at("2027-02-01T00:00:00Z")),
      false,
    );
  });
});
