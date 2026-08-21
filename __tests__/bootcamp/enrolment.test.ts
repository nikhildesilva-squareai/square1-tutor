// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// Cohort 1 as seeded: applications close 2026-10-01, cohort starts 2026-10-05.
// Founding prices: global $890 ($799 in full), South Asia $490 ($441 in full).
// Every expected value below is typed from the PRD table by hand, not read back
// out of the module.
//
// WHAT THESE GUARD. Payment happens on acceptance and there is no deposit, so
// ACCEPTANCE ITSELF HOLDS THE SEAT. An offer with no deadline — or one that
// outlives the cohort start — is a slow leak in the only scarce resource the
// product has. Most of this file is about that.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  OFFER_WINDOW_DAYS,
  offerExpiry,
  isOfferLive,
  daysLeftOnOffer,
  dueOnAcceptanceCents,
  planTotalCents,
  outstandingCents,
  isFullyPaid,
  enrolmentStep,
} from "../../lib/bootcamp/enrolment.ts";

// Hand-typed from the PRD pricing table. Deliberately literals rather than an
// import of BOOTCAMP_PRICING: pricing.test.ts already asserts the real table
// matches these, so if the two ever diverge that test fails, not this one.
const GLOBAL = { full: 79900 };
const SOUTH_ASIA = { full: 44100 };

const CLOSE = "2026-10-01";
const START = "2026-10-05";
const at = (iso: string) => new Date(iso);

describe("offerExpiry — a seat is never held past the point it can be used", () => {
  test("normally seven days out", () => {
    assert.equal(OFFER_WINDOW_DAYS, 7);
    const e = offerExpiry(at("2026-09-16T10:00:00Z"), CLOSE, START);
    assert.equal(e.toISOString(), "2026-09-23T10:00:00.000Z");
  });

  test("clamped by the application close date", () => {
    // Accepted 28 Sep: seven days would be 5 Oct, but applications close on the 1st.
    const e = offerExpiry(at("2026-09-28T10:00:00Z"), CLOSE, START);
    assert.equal(e.toISOString(), "2026-10-01T23:59:59.000Z");
  });

  test("clamped by the cohort start, never past it", () => {
    // A late acceptance after the close date must not outlive the start.
    const e = offerExpiry(at("2026-10-03T10:00:00Z"), "2026-10-10", START);
    assert.equal(e.toISOString(), "2026-10-05T00:00:00.000Z");
    assert.ok(e.getTime() <= at("2026-10-05T00:00:00Z").getTime());
  });

  test("the tightest of the three constraints always wins", () => {
    for (const now of ["2026-09-01", "2026-09-25", "2026-09-30", "2026-10-04"]) {
      const e = offerExpiry(at(`${now}T12:00:00Z`), CLOSE, START);
      assert.ok(e.getTime() <= at(`${START}T00:00:00Z`).getTime(), `${now} outlived the start`);
    }
  });
});

describe("offer liveness", () => {
  const exp = "2026-09-23T10:00:00Z";

  test("live a minute before expiry", () => {
    assert.equal(isOfferLive(exp, at("2026-09-23T09:59:00Z")), true);
  });

  test("dead a minute after", () => {
    assert.equal(isOfferLive(exp, at("2026-09-23T10:01:00Z")), false);
  });

  test("a missing expiry is never live — no deadline means no hold", () => {
    assert.equal(isOfferLive(null, at("2026-09-01T00:00:00Z")), false);
  });

  test("days left rounds up, so the last partial day still counts", () => {
    assert.equal(daysLeftOnOffer(exp, at("2026-09-21T10:00:00Z")), 2);
    assert.equal(daysLeftOnOffer(exp, at("2026-09-22T22:00:00Z")), 1);
  });

  test("an expired offer reports zero days, never negative", () => {
    assert.equal(daysLeftOnOffer(exp, at("2026-10-10T00:00:00Z")), 0);
  });
});

describe("what is due on acceptance", () => {
  test("tuition is one charge — the price, and nothing after it", () => {
    assert.equal(dueOnAcceptanceCents(GLOBAL, "full"), 79900);
    assert.equal(dueOnAcceptanceCents(SOUTH_ASIA, "full"), 44100);
  });

  test("what is due and what the plan totals are the same number", () => {
    // With instalments gone these cannot diverge, and a test that says so is
    // what will fail loudly if a plan is ever reintroduced without care.
    for (const p of [GLOBAL, SOUTH_ASIA]) {
      assert.equal(dueOnAcceptanceCents(p, "full"), planTotalCents(p, "full"));
    }
  });
});

describe("outstanding balance", () => {
  test("nothing paid means the whole fee is owed", () => {
    assert.equal(outstandingCents(GLOBAL, "full", 0), 79900);
  });

  test("paid in full is zero and reports as such", () => {
    assert.equal(outstandingCents(GLOBAL, "full", 79900), 0);
    assert.equal(isFullyPaid(GLOBAL, "full", 79900), true);
  });

  test("an overpayment never shows a negative balance", () => {
    // A refund conversation, not a minus number on someone's screen.
    assert.equal(outstandingCents(SOUTH_ASIA, "full", 99999), 0);
    assert.equal(isFullyPaid(SOUTH_ASIA, "full", 99999), true);
  });

  test("one cent short is not fully paid", () => {
    assert.equal(isFullyPaid(GLOBAL, "full", 79899), false);
  });

  test("a partial payment leaves exactly the shortfall", () => {
    // The one way a balance can now exist: the settlement region check found
    // the card entitled a different rate than the session was priced at.
    assert.equal(outstandingCents(GLOBAL, "full", 44100), 35800);
  });
});


describe("enrolmentStep — one source of truth for what happens next", () => {
  const base = {
    offerExpiresAt: "2026-09-23T10:00:00Z",
    assessmentRecorded: false,
    enrolled: false,
    prices: GLOBAL,
    plan: "full" as const,
    paidCents: 0,
  };
  const now = at("2026-09-20T10:00:00Z");

  test("submitted without an assessment asks for the assessment", () => {
    assert.equal(
      enrolmentStep({ ...base, applicationStatus: "submitted" }, now).step,
      "awaiting_assessment",
    );
  });

  test("submitted WITH an assessment is waiting on a human", () => {
    assert.equal(
      enrolmentStep({ ...base, applicationStatus: "submitted", assessmentRecorded: true }, now).step,
      "awaiting_decision",
    );
  });

  test("assessed is waiting on a human", () => {
    assert.equal(
      enrolmentStep({ ...base, applicationStatus: "assessed" }, now).step,
      "awaiting_decision",
    );
  });

  test("accepted with a live offer is the ONLY state that shows a pay button", () => {
    const s = enrolmentStep({ ...base, applicationStatus: "accepted" }, now);
    assert.equal(s.step, "pay");
    assert.equal(s.step === "pay" && s.dueCents, 79900);
    assert.equal(s.step === "pay" && s.daysLeft, 3); // 20 Sep 10:00 -> 23 Sep 10:00 is exactly 3 days
  });

  test("accepted with a lapsed offer never shows a pay button", () => {
    // The seat has gone back to the pool. Inviting payment for it would be
    // taking money for something we no longer have.
    const s = enrolmentStep({ ...base, applicationStatus: "accepted" }, at("2026-09-30T00:00:00Z"));
    assert.equal(s.step, "offer_expired");
  });

  test("accepted with NO expiry is treated as expired, not as an open offer", () => {
    const s = enrolmentStep({ ...base, applicationStatus: "accepted", offerExpiresAt: null }, now);
    assert.equal(s.step, "offer_expired");
  });

  test("enrolled outranks everything, including a lapsed offer", () => {
    const s = enrolmentStep(
      { ...base, applicationStatus: "accepted", offerExpiresAt: null, enrolled: true, paidCents: 79900 },
      now,
    );
    assert.equal(s.step, "enrolled");
    assert.equal(s.step === "enrolled" && s.outstandingCents, 0);
  });

  test("an enrolled student who underpaid still shows the shortfall", () => {
    const s2 = enrolmentStep(
      { ...base, applicationStatus: "accepted", enrolled: true, paidCents: 44100 },
      now,
    );
    assert.equal(s2.step === "enrolled" && s2.outstandingCents, 35800);
  });

  test("every terminal status closes the page rather than offering an action", () => {
    for (const status of ["waitlisted", "rejected", "withdrawn", "deferred", "expired"]) {
      const s = enrolmentStep({ ...base, applicationStatus: status }, now);
      assert.equal(s.step, "closed", status);
    }
  });
});
