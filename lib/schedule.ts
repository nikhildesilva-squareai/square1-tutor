// Paced-program scheduling. Turns a course's module/project week offsets + the
// learner's enrolment date + chosen plan length into rolling dates, a current-week
// marker, and per-project deadline status. Pure functions — no DB, safe anywhere.
//
// Project `schedule_week` and module `schedule_week_start` are authored against the
// 6-month (24-week) baseline; we scale them to the learner's actual plan_months so
// a 3-month intensive compresses and a 9-month plan stretches. Deadlines are
// per-learner and rolling: a project is due at the END of its scheduled week,
// measured from the enrolment date.

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** Scale a baseline (6-month) week to the learner's plan length. */
export function scaleWeek(baseWeek: number, planMonths: number | null | undefined): number {
  const f = (planMonths || 6) / 6;
  // Anchor at week 1: a baseline week-1 item (e.g. Module 0) stays week 1 at every
  // pace — no empty lead-in week when stretched (9-mo), no week-1 pile-up when
  // compressed (3-mo). Everything else stretches/compresses relative to week 1.
  return Math.max(1, 1 + Math.round((baseWeek - 1) * f));
}

/** Total weeks in the program for a given plan length. */
export function totalWeeks(planMonths: number | null | undefined): number {
  return Math.round((planMonths || 6) * 4.345);
}

/** 1-based current week of the program (week 1 = first 7 days after enrolment). */
export function currentWeek(enrolledAt: Date, now: Date = new Date()): number {
  return Math.max(1, Math.floor((now.getTime() - enrolledAt.getTime()) / WEEK) + 1);
}

/** Due date = end of the scheduled (scaled) week, measured from enrolment. */
export function weekDueDate(enrolledAt: Date, scaledWeek: number): Date {
  return new Date(enrolledAt.getTime() + scaledWeek * WEEK);
}

export type ProjectStatus = "done" | "overdue" | "due-soon" | "upcoming";

export function projectStatus(due: Date, submitted: boolean, now: Date = new Date()): ProjectStatus {
  if (submitted) return "done";
  const d = daysUntil(due, now);
  if (d < 0) return "overdue";
  if (d <= 10) return "due-soon";
  return "upcoming";
}

export function daysUntil(due: Date, now: Date = new Date()): number {
  return Math.ceil((due.getTime() - now.getTime()) / DAY);
}

/** Human countdown: "due in 5 days", "due today", "3 days overdue". */
export function countdownLabel(due: Date, now: Date = new Date()): string {
  const d = daysUntil(due, now);
  if (d === 0) return "due today";
  if (d === 1) return "due tomorrow";
  if (d > 1) return `due in ${d} days`;
  if (d === -1) return "1 day overdue";
  return `${Math.abs(d)} days overdue`;
}

export function fmtDate(due: Date): string {
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const STATUS_STYLE: Record<ProjectStatus, { label: string; cls: string }> = {
  done:       { label: "Complete",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue:    { label: "Overdue",   cls: "bg-red-50 text-red-700 border-red-200" },
  "due-soon": { label: "Due soon",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  upcoming:   { label: "Upcoming",  cls: "bg-surface-alt text-ink-muted border-border" },
};
