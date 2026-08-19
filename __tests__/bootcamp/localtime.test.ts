// Runnable with the repo's built-in runner: `npm run test:bootcamp`
//
// The anchor instant throughout is Band A's slot:
//   Monday 5 Oct 2026, 19:00 Asia/Colombo (UTC+5:30) = 13:30 UTC
//
// Every expected local time below is that instant converted by hand:
//   Asia/Colombo   UTC+5:30  -> Mon 7:00 PM
//   Asia/Kolkata   UTC+5:30  -> Mon 7:00 PM
//   Asia/Karachi   UTC+5     -> Mon 6:30 PM
//   Asia/Dhaka     UTC+6     -> Mon 7:30 PM
//   Asia/Dubai     UTC+4     -> Mon 5:30 PM
//   Africa/Nairobi UTC+3     -> Mon 4:30 PM
//   Africa/Lagos   UTC+1     -> Mon 2:30 PM
//   Europe/London  UTC+1 BST -> Mon 2:30 PM
//   America/New_York UTC-4 EDT -> Mon 9:30 AM
//   America/Los_Angeles UTC-7 PDT -> Mon 6:30 AM
//   Pacific/Auckland UTC+13 NZDT -> Tue 2:30 AM   <- day shifts, unsociable
//
// What these guard: ST-01. Selling a seat to someone who cannot attend is the
// most expensive mistake in a cohort product, so the hour must be right in the
// BUYER's zone, day shifts must be visible, and unsociable hours must be called
// out before payment.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  localSessionTime,
  confirmationSentence,
  isValidTimeZone,
  resolveViewerTimeZone,
  zonedTimeToInstant,
  firstClassInstant,
} from "../../lib/bootcamp/localtime.ts";

const BAND_A = "Asia/Colombo";
/** Mon 5 Oct 2026, 19:00 Asia/Colombo. */
const SLOT = "2026-10-05T13:30:00Z";

const inZone = (tz: string) => localSessionTime(SLOT, tz, BAND_A);

describe("the band anchor renders as authored", () => {
  test("Colombo sees Monday 7:00 PM", () => {
    const t = inZone("Asia/Colombo");
    assert.equal(t.weekday, "Monday");
    assert.equal(t.time, "7:00 PM");
    assert.equal(t.hour24, 19);
    assert.equal(t.dayShift, 0);
    assert.equal(t.unsociable, false);
  });
});

describe("Band A serves South Asia, the Gulf and East Africa", () => {
  test("Delhi: Monday 7:00 PM", () => {
    const t = inZone("Asia/Kolkata");
    assert.equal(t.time, "7:00 PM");
    assert.equal(t.unsociable, false);
  });

  test("Karachi: Monday 6:30 PM", () => {
    assert.equal(inZone("Asia/Karachi").time, "6:30 PM");
  });

  test("Dhaka: Monday 7:30 PM", () => {
    assert.equal(inZone("Asia/Dhaka").time, "7:30 PM");
  });

  test("Dubai: Monday 5:30 PM", () => {
    assert.equal(inZone("Asia/Dubai").time, "5:30 PM");
  });

  test("Nairobi: Monday 4:30 PM", () => {
    const t = inZone("Africa/Nairobi");
    assert.equal(t.time, "4:30 PM");
    assert.equal(t.unsociable, false);
  });
});

describe("the edges of Band A — workable, but the buyer must see them", () => {
  test("Lagos gets a 2:30 PM workday class, flagged as sociable but mid-afternoon", () => {
    const t = inZone("Africa/Lagos");
    assert.equal(t.time, "2:30 PM");
    assert.equal(t.hour24, 14);
    assert.equal(t.unsociable, false, "2:30 PM is not unsociable — it is just inconvenient");
  });

  test("London gets 2:30 PM BST — daylight saving is handled by Intl, not by us", () => {
    assert.equal(inZone("Europe/London").time, "2:30 PM");
  });

  test("New York gets 9:30 AM EDT", () => {
    assert.equal(inZone("America/New_York").time, "9:30 AM");
  });

  test("Los Angeles gets 6:30 AM — just inside the sociable bound", () => {
    const t = inZone("America/Los_Angeles");
    assert.equal(t.time, "6:30 AM");
    assert.equal(t.hour24, 6);
    assert.equal(t.unsociable, false, "6am is the boundary and counts as sociable");
  });
});

describe("day shift — a Monday class is not Monday everywhere", () => {
  test("Auckland sees Tuesday 2:30 AM, one day forward", () => {
    const t = inZone("Pacific/Auckland");
    assert.equal(t.weekday, "Tuesday");
    assert.equal(t.dayShift, 1);
  });

  test("Auckland's 2:30 AM is flagged unsociable", () => {
    assert.equal(inZone("Pacific/Auckland").unsociable, true);
  });

  test("Honolulu sees Sunday — one day back, wrapping the week correctly", () => {
    // 13:30 UTC Mon = 03:30 HST Mon... check the wrap logic with a real backward case.
    const t = localSessionTime("2026-10-05T06:00:00Z", "Pacific/Honolulu", "Asia/Colombo");
    assert.equal(t.weekday, "Sunday");
    assert.equal(t.dayShift, -1, "Saturday->Sunday style wrap must not read as +6");
  });
});

describe("unsociable bounds", () => {
  test("5:59 AM local is unsociable, 6:00 AM is not", () => {
    // 00:29 UTC -> 05:59 Asia/Colombo ; 00:30 UTC -> 06:00
    assert.equal(localSessionTime("2026-10-05T00:29:00Z", BAND_A, BAND_A).unsociable, true);
    assert.equal(localSessionTime("2026-10-05T00:30:00Z", BAND_A, BAND_A).unsociable, false);
  });

  test("10:59 PM is fine, 11:00 PM is not", () => {
    // 17:29 UTC -> 22:59 Colombo ; 17:30 UTC -> 23:00
    assert.equal(localSessionTime("2026-10-05T17:29:00Z", BAND_A, BAND_A).unsociable, false);
    assert.equal(localSessionTime("2026-10-05T17:30:00Z", BAND_A, BAND_A).unsociable, true);
  });

  test("midnight reports hour 0, not 24", () => {
    // 18:30 UTC -> 00:00 Colombo next day
    const t = localSessionTime("2026-10-05T18:30:00Z", BAND_A, BAND_A);
    assert.equal(t.hour24, 0);
    assert.equal(t.unsociable, true);
  });
});

describe("confirmationSentence — what the buyer ticks", () => {
  test("names the weekday, the time AND the zone we assumed", () => {
    const s = confirmationSentence(inZone("Asia/Kolkata"));
    assert.ok(s.includes("Mondays"), s);
    assert.ok(s.includes("7:00 PM"), s);
    assert.ok(s.includes("Asia/Kolkata"), "the assumed zone must be visible");
  });

  test("an unsociable hour gets an explicit 24-week warning", () => {
    const s = confirmationSentence(inZone("Pacific/Auckland"));
    assert.ok(/unusual hour/i.test(s), s);
    assert.ok(/24 weeks/.test(s), "the commitment length is the point");
  });

  test("a sociable hour is not padded with a scary warning", () => {
    assert.ok(!/unusual hour/i.test(confirmationSentence(inZone("Asia/Colombo"))));
  });
});

describe("timezone input is untrusted", () => {
  test("real zones validate", () => {
    for (const tz of ["Asia/Colombo", "America/New_York", "UTC"]) {
      assert.equal(isValidTimeZone(tz), true, tz);
    }
  });

  test("junk does not validate and never throws", () => {
    for (const tz of ["", "Mars/Olympus", "not-a-zone", "'; DROP TABLE"]) {
      assert.equal(isValidTimeZone(tz), false, tz);
    }
  });

  test("an invalid supplied zone falls back to the cohort zone rather than crashing render", () => {
    assert.equal(resolveViewerTimeZone("Mars/Olympus", BAND_A), BAND_A);
    assert.equal(resolveViewerTimeZone(null, BAND_A), BAND_A);
    assert.equal(resolveViewerTimeZone(undefined, BAND_A), BAND_A);
  });

  test("a valid supplied zone wins over the fallback", () => {
    assert.equal(resolveViewerTimeZone("Africa/Lagos", BAND_A), "Africa/Lagos");
  });
});

describe("input shape", () => {
  test("a Date and an ISO string give the same answer", () => {
    const a = localSessionTime(SLOT, "Asia/Dubai", BAND_A);
    const b = localSessionTime(new Date(SLOT), "Asia/Dubai", BAND_A);
    assert.deepEqual(a, b);
  });

  test("the zone used is echoed back for the UI to display", () => {
    assert.equal(inZone("Africa/Nairobi").timeZone, "Africa/Nairobi");
  });
});

describe("zonedTimeToInstant — wall clock to absolute instant", () => {
  test("19:00 Asia/Colombo on 5 Oct 2026 is 13:30 UTC", () => {
    // Colombo is UTC+5:30 year-round. 19:00 - 5:30 = 13:30 UTC.
    assert.equal(
      zonedTimeToInstant("2026-10-05", 19, 0, "Asia/Colombo").toISOString(),
      "2026-10-05T13:30:00.000Z",
    );
  });

  test("19:00 Europe/London in October is 18:00 UTC (BST, +1)", () => {
    assert.equal(
      zonedTimeToInstant("2026-10-05", 19, 0, "Europe/London").toISOString(),
      "2026-10-05T18:00:00.000Z",
    );
  });

  test("19:00 Europe/London in December is 19:00 UTC (GMT, +0)", () => {
    // The same wall clock is a DIFFERENT instant after the clocks change. This is
    // the case hard-coded offsets get wrong.
    assert.equal(
      zonedTimeToInstant("2026-12-07", 19, 0, "Europe/London").toISOString(),
      "2026-12-07T19:00:00.000Z",
    );
  });

  test("19:00 America/New_York in October is 23:00 UTC (EDT, -4)", () => {
    assert.equal(
      zonedTimeToInstant("2026-10-05", 19, 0, "America/New_York").toISOString(),
      "2026-10-05T23:00:00.000Z",
    );
  });

  test("19:00 America/New_York in December is 00:00 UTC next day (EST, -5)", () => {
    assert.equal(
      zonedTimeToInstant("2026-12-07", 19, 0, "America/New_York").toISOString(),
      "2026-12-08T00:00:00.000Z",
    );
  });

  test("round trip: the instant renders back as the wall clock we asked for", () => {
    for (const tz of ["Asia/Colombo", "Europe/London", "America/New_York", "Pacific/Auckland"]) {
      const inst = zonedTimeToInstant("2026-10-05", 19, 0, tz);
      const back = localSessionTime(inst, tz, tz);
      assert.equal(back.hour24, 19, `${tz} did not round trip`);
    }
  });
});

describe("firstClassInstant", () => {
  test("Cohort 1 Band A first class is Mon 5 Oct 2026, 13:30 UTC", () => {
    assert.equal(
      firstClassInstant("2026-10-05", "Asia/Colombo").toISOString(),
      "2026-10-05T13:30:00.000Z",
    );
  });

  test("which is the SLOT anchor every other test in this file uses", () => {
    assert.equal(firstClassInstant("2026-10-05", "Asia/Colombo").toISOString(), new Date(SLOT).toISOString());
  });
});
