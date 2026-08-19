// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// Every expected value is the price we publish in docs/bootcamp-prd.md, typed in
// by hand from the PRD table — NOT read back out of the module. The whole point
// is to catch the module drifting away from what marketing says.
//
// What these guard:
//   1. The 3-part instalments SUM to the founding price. Three numbers on a
//      pricing page that quietly add up to more than the headline is a dark
//      pattern, and it is a one-character typo away at all times.
//   2. Pay-in-full is genuinely cheaper. A "save 10%" badge on a plan that costs
//      the same is a false claim.
//   3. The regional ratio is ~0.55, not the ⅓ used for software. At ⅓ a seat
//      sells below the ~$655 instructor cost.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  BOOTCAMP_PRICING,
  depositCents,
  threePartTotal,
  payInFullSavingCents,
  payInFullSavingPct,
  amountDueCents,
  formatUsd,
  regionForCountry,
} from "../../lib/bootcamp/pricing.ts";

describe("published prices match the PRD", () => {
  test("global founding is $890, list is $1,490", () => {
    assert.equal(BOOTCAMP_PRICING.global.founding, 89000);
    assert.equal(BOOTCAMP_PRICING.global.list, 149000);
  });

  test("south asia founding is $490, list is $790", () => {
    assert.equal(BOOTCAMP_PRICING.south_asia.founding, 49000);
    assert.equal(BOOTCAMP_PRICING.south_asia.list, 79000);
  });

  test("pay-in-full is $799 global, $441 regional", () => {
    assert.equal(BOOTCAMP_PRICING.global.plans.full, 79900);
    assert.equal(BOOTCAMP_PRICING.south_asia.plans.full, 44100);
  });

  test("every amount is a whole number of cents", () => {
    for (const r of ["global", "south_asia"] as const) {
      const p = BOOTCAMP_PRICING[r];
      for (const v of [p.list, p.founding, p.plans.full, ...p.plans.threePart]) {
        assert.ok(Number.isInteger(v), `${r}: ${v} is not an integer`);
      }
    }
  });
});

describe("the 3-part plan is honest", () => {
  test("global instalments sum to the founding price, not more", () => {
    assert.equal(threePartTotal("global"), BOOTCAMP_PRICING.global.founding);
  });

  test("regional instalments sum to the founding price, not more", () => {
    assert.equal(threePartTotal("south_asia"), BOOTCAMP_PRICING.south_asia.founding);
  });

  test("the deposit is the first instalment, not an extra charge", () => {
    assert.equal(depositCents("global"), 15000);
    assert.equal(depositCents("south_asia"), 7500);
    assert.equal(depositCents("global"), BOOTCAMP_PRICING.global.plans.threePart[0]);
  });

  test("paying in three parts never costs less than paying up front", () => {
    for (const r of ["global", "south_asia"] as const) {
      assert.ok(threePartTotal(r) > BOOTCAMP_PRICING[r].plans.full, `${r} inverted`);
    }
  });
});

describe("the discount claim is true", () => {
  test("pay-in-full saves ~10% in both regions", () => {
    assert.equal(payInFullSavingPct("global"), 10);
    assert.equal(payInFullSavingPct("south_asia"), 10);
  });

  test("the saving is a positive amount of real money", () => {
    assert.equal(payInFullSavingCents("global"), 9100);   // $890 - $799
    assert.equal(payInFullSavingCents("south_asia"), 4900); // $490 - $441
  });
});

describe("amountDueCents", () => {
  test("full charges the discounted price", () => {
    assert.equal(amountDueCents("global", "full"), 79900);
  });

  test("three_part charges the founding price across instalments", () => {
    assert.equal(amountDueCents("global", "three_part"), 89000);
    assert.equal(amountDueCents("south_asia", "three_part"), 49000);
  });
});

describe("regional pricing is not the software ⅓ ratio", () => {
  test("the ratio is ~0.55 — a ⅓ seat would sell below instructor cost", () => {
    const ratio = BOOTCAMP_PRICING.south_asia.founding / BOOTCAMP_PRICING.global.founding;
    assert.ok(ratio > 0.5 && ratio < 0.6, `ratio was ${ratio.toFixed(2)}`);
  });

  test("the regional price still clears the ~$655 global instructor cost only when staffed regionally", () => {
    // Documents the constraint rather than asserting a policy: $490 is below the
    // $655/student cost of a $35/h instructor, and only works at ~$15/h (~$280).
    assert.ok(BOOTCAMP_PRICING.south_asia.founding < 65500);
  });
});

describe("regionForCountry — display only", () => {
  test("south asian countries get the regional rate", () => {
    for (const c of ["IN", "LK", "PK", "BD", "NP"]) {
      assert.equal(regionForCountry(c), "south_asia", c);
    }
  });

  test("lowercase input still resolves", () => {
    assert.equal(regionForCountry("lk"), "south_asia");
  });

  test("everywhere else is global", () => {
    for (const c of ["US", "GB", "AU", "NG", "BR", "SG"]) {
      assert.equal(regionForCountry(c), "global", c);
    }
  });

  test("unknown or missing country falls back to global, never the cheaper rate", () => {
    // Failing open to the DISCOUNT would be a revenue leak on every bot and proxy.
    assert.equal(regionForCountry(null), "global");
    assert.equal(regionForCountry(undefined), "global");
    assert.equal(regionForCountry(""), "global");
    assert.equal(regionForCountry("ZZ"), "global");
  });
});

describe("formatUsd", () => {
  test("whole dollars carry no decimals", () => {
    assert.equal(formatUsd(89000), "$890");
    assert.equal(formatUsd(79900), "$799");
  });

  test("thousands are comma-grouped", () => {
    assert.equal(formatUsd(149000), "$1,490");
  });

  test("part-dollars keep two decimals", () => {
    assert.equal(formatUsd(49950), "$499.50");
  });

  test("zero renders as $0, not an empty string", () => {
    assert.equal(formatUsd(0), "$0");
  });
});
