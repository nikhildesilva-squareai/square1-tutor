// ═══════════════════════════════════════════════════════════════════════════════
// Local session time — ST-01. Pure, no imports (Intl is a JS built-in).
//
// THE MOST EXPENSIVE MISTAKE IN A COHORT PRODUCT is selling a seat to someone who
// cannot attend the live class. They pay, they miss weeks 1–3, they disengage, and
// the refund conversation is worse than the sale was good. So the class hour is
// rendered in the BUYER'S timezone, in words, before payment — and the
// confirmation is stored as a fact on bootcamp_applications.local_time_confirmed.
//
// Sessions are authored in the cohort's band anchor (Band A = Asia/Colombo 19:00)
// and stored as timestamptz, i.e. an absolute instant. Everything here is a
// projection of that instant into another zone. There is no timezone maths in this
// file — Intl does it, correctly, including DST. Hand-rolled offset arithmetic is
// how people ship bugs that only appear in late October.
// ═══════════════════════════════════════════════════════════════════════════════

export interface LocalSessionTime {
  /** "Monday" — in the viewer's zone, which may differ from the cohort's. */
  weekday: string;
  /** "4:30 PM" */
  time: string;
  /** "Mondays at 4:30 PM" — the sentence that goes next to the checkbox. */
  sentence: string;
  /** 0–23 in the viewer's zone. Drives the unsociable check. */
  hour24: number;
  /** True when the class lands somewhere nobody sustains for 24 weeks. */
  unsociable: boolean;
  /** -1 / 0 / +1 — the class falls on a different calendar day for this viewer
   *  than it does for the cohort. A Monday class can be a Sunday class. */
  dayShift: -1 | 0 | 1;
  /** The IANA zone this was rendered in, echoed back so the UI can show it. */
  timeZone: string;
}

/** Before this hour or at/after the late bound, a weekly commitment fails.
 *  Not a hard block — some people genuinely want a 5am class — but it must be
 *  said out loud before money changes hands. */
const EARLY_BOUND = 6;
const LATE_BOUND = 23;

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function partsIn(instant: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const parts = fmt.formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  // hour12 output gives "4" + "PM"; recover 24h separately so callers can reason
  // about it numerically without parsing a display string.
  const h24 = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false })
      .formatToParts(instant)
      .find((p) => p.type === "hour")?.value ?? "0",
  );

  return {
    weekday: get("weekday"),
    time: `${get("hour")}:${get("minute")} ${get("dayPeriod")}`,
    // Intl returns 24 for midnight in some locales; normalise to 0.
    hour24: h24 % 24,
  };
}

/**
 * Project a session instant into a viewer's timezone.
 *
 * @param startsAt   the session instant (timestamptz from bootcamp_sessions)
 * @param viewerTz   IANA zone, e.g. "Asia/Kolkata"
 * @param cohortTz   the cohort's band anchor, used only to compute dayShift
 */
export function localSessionTime(
  startsAt: Date | string,
  viewerTz: string,
  cohortTz: string,
): LocalSessionTime {
  const instant = typeof startsAt === "string" ? new Date(startsAt) : startsAt;

  const local = partsIn(instant, viewerTz);
  const cohort = partsIn(instant, cohortTz);

  const diff = WEEKDAY_INDEX[local.weekday] - WEEKDAY_INDEX[cohort.weekday];
  // Wrap Saturday->Sunday (+6 means -1, -6 means +1).
  const dayShift = (diff === 6 ? -1 : diff === -6 ? 1 : diff) as -1 | 0 | 1;

  return {
    weekday: local.weekday,
    time: local.time,
    sentence: `${local.weekday}s at ${local.time}`,
    hour24: local.hour24,
    unsociable: local.hour24 < EARLY_BOUND || local.hour24 >= LATE_BOUND,
    dayShift,
    timeZone: viewerTz,
  };
}

/**
 * The exact sentence shown beside the confirmation checkbox.
 *
 * Deliberately blunt. "19:00 Asia/Colombo" means nothing to a buyer in Lagos;
 * "Mondays at 3:30 PM in Africa/Lagos" is a thing they can check against their
 * own life. The zone is named because a buyer travelling or on a VPN needs to
 * see which zone we assumed.
 */
export function confirmationSentence(t: LocalSessionTime): string {
  const base = `Live classes are ${t.sentence} in ${t.timeZone}.`;
  if (t.unsociable) {
    return `${base} That is an unusual hour where you are — please check you can make it every week for 24 weeks.`;
  }
  return base;
}

/** Does the viewer's zone resolve at all? Guards against a spoofed or stale
 *  client-supplied zone reaching Intl and throwing at render time. */
export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-guess viewer zone. Client-side this is the browser's own answer, which is
 * authoritative. Server-side there is no such thing, so callers pass the cohort
 * zone as the fallback and the UI offers a picker — a WRONG timezone shown
 * confidently is worse than asking.
 */
export function resolveViewerTimeZone(
  supplied: string | null | undefined,
  fallback: string,
): string {
  if (supplied && isValidTimeZone(supplied)) return supplied;
  return fallback;
}
