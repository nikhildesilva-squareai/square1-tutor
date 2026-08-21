// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// WHAT THIS GUARDS. The regional rate is a ~$400 gap ($890 global vs $490 South
// Asia founding), which is comfortably enough to be worth editing a profile
// field. The country on a student record is self-declared; the country on a card
// is not. verifyRegionAtCheckout() is the rule that says only the second one may
// decide what someone pays, and until the Stripe webhook landed it had no
// callers at all.
//
// These tests are about the COMPOSITION the webhook performs: verify the region
// at settlement, then record the ledger at the ENTITLED rate while the amount
// stays whatever actually arrived. The consequence — and the reason it is done
// this way rather than by refusing the payment — is that a mismatched payer ends
// up with an outstanding balance instead of a silent discount, and nobody has
// money taken and then gets turned away.
//
// Since tuition became a SINGLE payment, this is the only way an enrolled
// student can carry a balance at all, which makes a non-zero one a signal rather
// than routine bookkeeping.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { verifyRegionAtCheckout } from "../../lib/pricing.ts";
import { planTotalCents, outstandingCents } from "../../lib/bootcamp/enrolment.ts";

// Hand-typed from the PRD pricing table, as in enrolment.test.ts.
const GLOBAL = { full: 79900 };
const SOUTH_ASIA = { full: 44100 };

describe("verifyRegionAtCheckout — only the card decides the rate", () => {
  test("a South Asian card keeps the South Asia rate", () => {
    assert.equal(verifyRegionAtCheckout("south_asia", "LK"), "south_asia");
    assert.equal(verifyRegionAtCheckout("south_asia", "IN"), "south_asia");
  });

  test("claiming South Asia on a non-South-Asian card is downgraded", () => {
    assert.equal(verifyRegionAtCheckout("south_asia", "US"), "global");
    assert.equal(verifyRegionAtCheckout("south_asia", "GB"), "global");
    assert.equal(verifyRegionAtCheckout("south_asia", "AE"), "global");
  });

  test("a missing billing country is never treated as entitlement", () => {
    // Stripe returns no address if we forget to ask for one. Failing open here
    // would hand the discount to anyone whose address collection broke.
    assert.equal(verifyRegionAtCheckout("south_asia", null), "global");
    assert.equal(verifyRegionAtCheckout("south_asia", undefined), "global");
    assert.equal(verifyRegionAtCheckout("south_asia", ""), "global");
  });

  test("it never UPGRADES anyone to a cheaper rate they did not ask for", () => {
    // A global claim stays global even from a South Asian card. The browsed
    // region is what they were shown and agreed to; this guard exists to stop
    // under-payment, not to hand out discounts nobody requested.
    assert.equal(verifyRegionAtCheckout("global", "LK"), "global");
  });

  test("case does not decide entitlement", () => {
    assert.equal(verifyRegionAtCheckout("south_asia", "lk"), "south_asia");
  });
});

describe("settlement — a mismatch becomes a balance, not a free discount", () => {
  test("honest South Asian payer owes nothing", () => {
    const entitled = verifyRegionAtCheckout("south_asia", "LK");
    assert.equal(entitled, "south_asia");
    assert.equal(outstandingCents(SOUTH_ASIA, "full", 44100), 0);
  });

  test("US card that paid the South Asia price carries the difference", () => {
    const entitled = verifyRegionAtCheckout("south_asia", "US");
    assert.equal(entitled, "global");
    // They paid $441; the rate they are entitled to is $799.
    const owed = outstandingCents(GLOBAL, "full", 44100);
    assert.equal(owed, 35800);
    assert.ok(owed > 0, "a mismatch must never settle to zero outstanding");
  });

  test("the shortfall is exactly the gap between the two rates", () => {
    assert.equal(
      planTotalCents(GLOBAL, "full") - planTotalCents(SOUTH_ASIA, "full"),
      outstandingCents(GLOBAL, "full", planTotalCents(SOUTH_ASIA, "full")),
    );
  });

  test("the shortfall is the only way a balance can exist", () => {
    // Tuition is a single payment, so an enrolled student owes nothing unless
    // the settlement check downgraded their region. That makes any non-zero
    // balance a signal worth acting on rather than routine bookkeeping.
    assert.equal(outstandingCents(GLOBAL, "full", 79900), 0);
    assert.equal(outstandingCents(SOUTH_ASIA, "full", 44100), 0);
    assert.ok(outstandingCents(GLOBAL, "full", 44100) > 0);
  });

  test("an honest payer is never left with a phantom balance", () => {
    for (const [prices, plan, paid] of [
      [GLOBAL, "full", 79900],
      [SOUTH_ASIA, "full", 44100],
    ] as const) {
      assert.equal(outstandingCents(prices, plan, paid), 0, `${plan}`);
    }
  });
});
