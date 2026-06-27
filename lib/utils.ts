import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  const totalSecs = Math.round(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function topicColor(score: number): string {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-error";
}

export function topicBg(score: number): string {
  if (score >= 70) return "bg-success-bg";
  if (score >= 40) return "bg-warning-bg";
  return "bg-error-bg";
}

export function levelFromPct(pct: number): "beginner" | "intermediate" | "advanced" {
  if (pct >= 70) return "advanced";
  if (pct >= 40) return "intermediate";
  return "beginner";
}

export function levelLabel(level: string): string {
  if (level === "advanced") return "Advanced";
  if (level === "intermediate") return "Intermediate";
  return "Beginner";
}

export function levelBadgeVariant(level: string): "success" | "warning" | "error" {
  if (level === "advanced") return "success";
  if (level === "intermediate") return "warning";
  return "error";
}

// Honest "learnable hours" for a course: taught lesson time + hands-on practice time.
// Practice estimate per exercise: mcq 2 min, short_answer 5 min, code 12 min
// (defensible deliberate-practice averages — learners actually complete these).
// Hosted projects are counted/shown SEPARATELY, never folded in here.
export function learnableHours(
  lessonMinutes: number,
  ex: { mcq: number; short: number; code: number },
): number {
  const practice = ex.mcq * 2 + ex.short * 5 + ex.code * 12;
  return Math.round((lessonMinutes + practice) / 60);
}
