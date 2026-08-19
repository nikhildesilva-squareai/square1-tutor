// Runnable with the repo's built-in runner: `npm run test:bootcamp`
// (node --test, no test framework dependency — matches __tests__/competitions/).
//
// Every expected value is hand-derived from the thresholds in lib/bootcamp/standing.ts
// and checked by calendar. The gate is due 2026-11-09, so:
//
//   at_risk   at >= 7 days past due  ->  2026-11-16
//   probation at >= 21 days past due ->  2026-11-30
//
// What these guard:
//   1. Boundaries. Off-by-one here means a student is flagged a week early
//      (instructors learn to ignore it) or a week late (too late to help).
//   2. ST-39 — the student-facing label is plain language, never a score.
//   3. AD-08 — seat counts are the real cap minus the real accepted count,
//      with nowhere to inflate scarcity.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  computeStanding,
  standingLabel,
  attendanceWeight,
  presenceStatus,
  weightedAttendancePct,
  seatsRemaining,
  isCohortFull,
  type StandingInputs,
} from "../../lib/bootcamp/standing.ts";

const HEALTHY: StandingInputs = {
  nextGateDueAt: "2026-11-09T00:00:00Z",
  nextGateTitle: "Gate 2",
  attendancePct: 85,
  daysSinceLastActivity: 1,
  missedOneToOnes: 0,
};

const at = (iso: string) => new Date(iso);

describe("computeStanding — pace boundaries", () => {
  test("on pace is good", () => {
    const r = computeStanding(HEALTHY, at("2026-10-26T00:00:00Z"));
    assert.equal(r.standing, "good");
    assert.equal(r.daysBehind, 0);
    assert.equal(r.label, "On track");
  });

  test("6 days behind is still good — one bad week must not flag someone", () => {
    const r = computeStanding(HEALTHY, at("2026-11-15T00:00:00Z"));
    assert.equal(r.daysBehind, 6);
    assert.equal(r.standing, "good");
  });

  test("exactly 7 days behind tips to at_risk", () => {
    const r = computeStanding(HEALTHY, at("2026-11-16T00:00:00Z"));
    assert.equal(r.daysBehind, 7);
    assert.equal(r.standing, "at_risk");
  });

  test("20 days behind is still at_risk", () => {
    const r = computeStanding(HEALTHY, at("2026-11-29T00:00:00Z"));
    assert.equal(r.daysBehind, 20);
    assert.equal(r.standing, "at_risk");
  });

  test("exactly 21 days behind tips to probation", () => {
    const r = computeStanding(HEALTHY, at("2026-11-30T00:00:00Z"));
    assert.equal(r.daysBehind, 21);
    assert.equal(r.standing, "probation");
  });

  test("no next gate means no pace penalty", () => {
    const r = computeStanding(
      { ...HEALTHY, nextGateDueAt: null, nextGateTitle: null },
      at("2027-06-01T00:00:00Z"),
    );
    assert.equal(r.daysBehind, 0);
    assert.equal(r.standing, "good");
  });

  test("a Date due-date behaves identically to an ISO string", () => {
    const a = computeStanding(HEALTHY, at("2026-11-16T00:00:00Z"));
    const b = computeStanding(
      { ...HEALTHY, nextGateDueAt: new Date("2026-11-09T00:00:00Z") },
      at("2026-11-16T00:00:00Z"),
    );
    assert.deepEqual(a.standing, b.standing);
    assert.equal(a.daysBehind, b.daysBehind);
  });
});

describe("computeStanding — attendance boundaries", () => {
  const now = at("2026-10-26T00:00:00Z"); // on pace, so attendance is the only driver

  test("60% attendance is acceptable", () => {
    assert.equal(computeStanding({ ...HEALTHY, attendancePct: 60 }, now).standing, "good");
  });

  test("just under 60% is at_risk", () => {
    assert.equal(computeStanding({ ...HEALTHY, attendancePct: 59 }, now).standing, "at_risk");
  });

  test("35% is at_risk, not yet probation", () => {
    assert.equal(computeStanding({ ...HEALTHY, attendancePct: 35 }, now).standing, "at_risk");
  });

  test("under 35% is probation — functionally not in the programme", () => {
    assert.equal(computeStanding({ ...HEALTHY, attendancePct: 34 }, now).standing, "probation");
  });
});

describe("computeStanding — inactivity and missed 1-1s", () => {
  const now = at("2026-10-26T00:00:00Z");

  test("6 days quiet is fine", () => {
    assert.equal(computeStanding({ ...HEALTHY, daysSinceLastActivity: 6 }, now).standing, "good");
  });

  test("7 days quiet is at_risk", () => {
    assert.equal(computeStanding({ ...HEALTHY, daysSinceLastActivity: 7 }, now).standing, "at_risk");
  });

  test("14 days quiet is probation", () => {
    assert.equal(computeStanding({ ...HEALTHY, daysSinceLastActivity: 14 }, now).standing, "probation");
  });

  test("one missed 1-1 is not a flag; two is", () => {
    assert.equal(computeStanding({ ...HEALTHY, missedOneToOnes: 1 }, now).standing, "good");
    assert.equal(computeStanding({ ...HEALTHY, missedOneToOnes: 2 }, now).standing, "at_risk");
  });
});

describe("computeStanding — escalation never downgrades", () => {
  test("an at_risk signal cannot pull a probation student back up", () => {
    // 21 days behind (probation) AND 8 days quiet (at_risk). Worst wins.
    const r = computeStanding(
      { ...HEALTHY, daysSinceLastActivity: 8 },
      at("2026-11-30T00:00:00Z"),
    );
    assert.equal(r.standing, "probation");
    assert.ok(r.reasons.length >= 2, "both drivers should be reported to the desk");
  });

  test("every contributing driver is listed for the call list", () => {
    const r = computeStanding(
      { ...HEALTHY, attendancePct: 30, daysSinceLastActivity: 15, missedOneToOnes: 3 },
      at("2026-11-30T00:00:00Z"),
    );
    assert.equal(r.reasons.length, 4, `expected pace + attendance + inactivity + 1-1s, got ${JSON.stringify(r.reasons)}`);
  });
});

describe("riskScore — desk-only ranking", () => {
  const now = at("2026-10-26T00:00:00Z");

  test("a healthy student scores low", () => {
    assert.ok(computeStanding(HEALTHY, now).riskScore < 25);
  });

  test("worse inputs never produce a lower score", () => {
    const mild = computeStanding({ ...HEALTHY, daysSinceLastActivity: 3 }, now).riskScore;
    const bad = computeStanding({ ...HEALTHY, daysSinceLastActivity: 12 }, now).riskScore;
    const worse = computeStanding(
      { ...HEALTHY, daysSinceLastActivity: 20, attendancePct: 20, missedOneToOnes: 3 },
      now,
    ).riskScore;
    assert.ok(mild < bad, `${mild} !< ${bad}`);
    assert.ok(bad < worse, `${bad} !< ${worse}`);
  });

  test("the score is clamped to 0..100", () => {
    const worst = computeStanding(
      { ...HEALTHY, attendancePct: 0, daysSinceLastActivity: 999, missedOneToOnes: 99 },
      at("2027-06-01T00:00:00Z"),
    );
    assert.ok(worst.riskScore >= 0 && worst.riskScore <= 100, `out of range: ${worst.riskScore}`);
  });
});

describe("standingLabel — ST-39, plain language only", () => {
  test("good standing reads as encouragement, not a metric", () => {
    assert.equal(standingLabel("good", []), "On track");
  });

  test("at_risk leads with the concrete reason", () => {
    assert.equal(standingLabel("at_risk", ["9 days behind on Gate 2"]), "9 days behind on Gate 2");
  });

  test("probation is flagged without being punitive", () => {
    const l = standingLabel("probation", ["26 days past the Gate 2 deadline"]);
    assert.ok(l.startsWith("Needs attention"));
  });

  test("no student-facing label ever contains the risk score", () => {
    const r = computeStanding(
      { ...HEALTHY, attendancePct: 20, daysSinceLastActivity: 18 },
      at("2026-11-30T00:00:00Z"),
    );
    assert.ok(!r.label.includes(String(r.riskScore)), `score leaked into label: "${r.label}"`);
    assert.ok(!/risk|score/i.test(r.label), `judgement language in label: "${r.label}"`);
  });

  test("a degraded standing with no reasons still says something useful", () => {
    assert.equal(standingLabel("at_risk", []), "Behind schedule");
  });
});

describe("attendance weighting", () => {
  test("present counts fully, absent counts nothing", () => {
    assert.equal(attendanceWeight("present"), 1);
    assert.equal(attendanceWeight("absent"), 0);
  });

  test("watching the recording counts half — the timezone-band lifeline (ST-24)", () => {
    assert.equal(attendanceWeight("watched_recording"), 0.5);
  });

  test("excused counts fully — being ill is not a penalty", () => {
    assert.equal(attendanceWeight("excused"), 1);
  });

  test("late is partial, between watched and present", () => {
    assert.equal(attendanceWeight("late"), 0.75);
    assert.ok(attendanceWeight("watched_recording") < attendanceWeight("late"));
    assert.ok(attendanceWeight("late") < attendanceWeight("present"));
  });
});

describe("presenceStatus — from webhook minutes", () => {
  // 90-minute class: 70% = 63 min, 30% = 27 min.
  test("63 of 90 minutes is present", () => {
    assert.equal(presenceStatus(63, 90), "present");
  });

  test("62 of 90 is late, not present", () => {
    assert.equal(presenceStatus(62, 90), "late");
  });

  test("27 of 90 is late", () => {
    assert.equal(presenceStatus(27, 90), "late");
  });

  test("26 of 90 is absent", () => {
    assert.equal(presenceStatus(26, 90), "absent");
  });

  test("a zero-length session cannot mark anyone present", () => {
    assert.equal(presenceStatus(0, 0), "absent");
  });

  test("over-attending (rejoins inflating minutes) is still present, never an error", () => {
    assert.equal(presenceStatus(200, 90), "present");
  });
});

describe("weightedAttendancePct", () => {
  test("nothing scheduled yet is 100%, not 0% — a new student is not failing", () => {
    assert.equal(weightedAttendancePct([]), 100);
  });

  test("one live + one watched = 75%", () => {
    assert.equal(
      weightedAttendancePct([{ status: "present" }, { status: "watched_recording" }]),
      75,
    );
  });

  test("all absent = 0%", () => {
    assert.equal(weightedAttendancePct([{ status: "absent" }, { status: "absent" }]), 0);
  });

  test("present + late = 87.5%", () => {
    assert.equal(weightedAttendancePct([{ status: "present" }, { status: "late" }]), 87.5);
  });
});

describe("seats — AD-08, honest numbers", () => {
  test("remaining is the real cap minus the real accepted count", () => {
    assert.equal(seatsRemaining(50, 31), 19);
  });

  test("a full cohort reports zero, never a negative", () => {
    assert.equal(seatsRemaining(50, 50), 0);
    assert.equal(seatsRemaining(50, 63), 0);
  });

  test("an empty cohort reports the full cap", () => {
    assert.equal(seatsRemaining(50, 0), 50);
  });

  test("isCohortFull agrees with seatsRemaining at the boundary", () => {
    assert.equal(isCohortFull(50, 49), false);
    assert.equal(isCohortFull(50, 50), true);
    assert.equal(isCohortFull(50, 51), true);
  });

  test("the signature admits no scarcity offset — only cap and accepted", () => {
    assert.equal(seatsRemaining.length, 2, "a third parameter would be somewhere to inflate scarcity");
  });
});
