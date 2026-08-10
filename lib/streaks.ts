export interface StreakInfo {
  current: number;
  longest: number;
  todayDone: boolean;
  activeDates: Set<string>;
  /** ISO date (YYYY-MM-DD) of the missed day a streak shield bridged, or null
   *  when the streak needed no shield. */
  shieldUsedOn: string | null;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Streak with a SHIELD (UX review K2, Duolingo's "freeze" — stateless version).
//
// Loss aversion powers streaks right up until the streak dies — then it powers
// churn: one bad Tuesday and the number a reluctant learner was protecting is
// gone, so why come back? The shield forgives AT MOST ONE missed day inside
// the current streak, and only when it was genuinely earned: the 7 days
// before the miss must contain ≥5 active days (a solid week of showing up).
//
// Deterministic and computed from completion history alone — no DB state, no
// consumption writes, so every surface that calls computeStreak agrees. The
// bridged day is returned so the UI can say "🛡 shield covered Tue" instead
// of silently inflating the number — honesty stays intact.
// ═══════════════════════════════════════════════════════════════════════════════

const SHIELD_LOOKBACK = 7;
const SHIELD_MIN_ACTIVE = 5;

export function computeStreak(completionDates: string[]): StreakInfo {
  if (completionDates.length === 0) {
    return { current: 0, longest: 0, todayDone: false, activeDates: new Set(), shieldUsedOn: null };
  }

  const activeDates = new Set(completionDates.map((d) => toDateStr(new Date(d))));
  const today = toDateStr(new Date());
  const todayDone = activeDates.has(today);

  const sorted = [...activeDates].sort().reverse();

  // Was the week before `gapDate` solid enough to have earned a shield?
  const shieldEarned = (gapDate: Date): boolean => {
    let active = 0;
    for (let i = 1; i <= SHIELD_LOOKBACK; i++) {
      if (activeDates.has(toDateStr(new Date(gapDate.getTime() - i * 86400000)))) active++;
    }
    return active >= SHIELD_MIN_ACTIVE;
  };

  // Walk back from today (or yesterday, if today isn't done yet — an
  // in-progress day never breaks a streak). One earned shield may bridge a
  // single missed day; a second gap ends the streak.
  let current = 0;
  let shieldUsedOn: string | null = null;
  let checkDate = new Date(todayDone ? today : toDateStr(new Date(Date.now() - 86400000)));
  for (;;) {
    const key = toDateStr(checkDate);
    if (activeDates.has(key)) {
      current++;
    } else if (current > 0 && shieldUsedOn === null && shieldEarned(checkDate)) {
      shieldUsedOn = key; // bridged, not counted — the number stays honest
    } else {
      break;
    }
    checkDate = new Date(checkDate.getTime() - 86400000);
  }

  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);

  return { current, longest, todayDone, activeDates, shieldUsedOn };
}
