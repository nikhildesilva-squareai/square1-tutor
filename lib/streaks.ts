export interface StreakInfo {
  current: number;
  longest: number;
  todayDone: boolean;
  activeDates: Set<string>;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeStreak(completionDates: string[]): StreakInfo {
  if (completionDates.length === 0) {
    return { current: 0, longest: 0, todayDone: false, activeDates: new Set() };
  }

  const activeDates = new Set(completionDates.map((d) => toDateStr(new Date(d))));
  const today = toDateStr(new Date());
  const todayDone = activeDates.has(today);

  const sorted = [...activeDates].sort().reverse();

  let current = 0;
  const startCheck = todayDone ? today : toDateStr(new Date(Date.now() - 86400000));

  if (activeDates.has(startCheck)) {
    let checkDate = new Date(startCheck);
    while (activeDates.has(toDateStr(checkDate))) {
      current++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
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

  return { current, longest, todayDone, activeDates };
}
