"use client";

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard course roadmap — the progression control, not just a progress read-out.
//
// The dashboard used to render modules as inert divs: a learner could see that
// Module 0 existed but had no way to open it, start Module 1 once Module 0 was
// done, or reopen a lesson they had already finished. Everything had to go
// through the single "Resume Lesson" button. This makes every module expandable
// and every reachable lesson a link.
//
// Access rules mirror /courses/[slug] exactly (one source of truth for the
// learner, whichever screen they are on):
//   • Module 0 (the Foundations on-ramp) is ALWAYS open — beginner floor + review.
//   • Any module at or before the one you have reached is open.
//   • Everything ahead stays locked until you get there.
// Completed lessons are never re-locked — "Review" is always available.
// ═══════════════════════════════════════════════════════════════════════════════

export interface RoadmapLesson {
  id: string;
  title: string;
  completed: boolean;
}

export interface RoadmapModule {
  id: string;
  title: string;
  week_number: number;
  lessons: RoadmapLesson[];
}

type ModuleState = "done" | "current" | "open" | "locked";

export function CourseRoadmap({
  modules,
  currentLessonId,
  courseColor,
  courseSlug,
}: {
  modules: RoadmapModule[];
  currentLessonId: string | null;
  courseColor: string;
  courseSlug: string;
}) {
  // Which module the learner has reached (holds the current lesson).
  const currentModuleIndex = currentLessonId
    ? modules.findIndex((m) => m.lessons.some((l) => l.id === currentLessonId))
    : -1;

  const stateOf = (mod: RoadmapModule, i: number): ModuleState => {
    const done = mod.lessons.length > 0 && mod.lessons.every((l) => l.completed);
    if (done) return "done";
    if (i === currentModuleIndex) return "current";
    if (i === 0) return "open"; // Module 0 is always reachable
    if (currentModuleIndex >= 0 && i < currentModuleIndex) return "open";
    return "locked";
  };

  // Open the module the learner is in; if they haven't started, open the first.
  const initiallyOpen = currentModuleIndex >= 0 ? currentModuleIndex : 0;
  const [expanded, setExpanded] = useState<number | null>(initiallyOpen);

  // The one module we want the eye to land on — the next thing to actually do.
  const actionableIndex = modules.findIndex((m, i) => {
    const s = stateOf(m, i);
    return s === "current" || (s === "open" && m.lessons.some((l) => !l.completed));
  });

  return (
    <div className="space-y-2.5">
      {modules.map((mod, i) => {
        const state = stateOf(mod, i);
        const total = mod.lessons.length;
        const done = mod.lessons.filter((l) => l.completed).length;
        const pct = total > 0 ? done / total : 0;
        const isOpen = expanded === i;
        const locked = state === "locked";
        const isNextUp = i === actionableIndex;

        // Where the module's own CTA sends you: the first unfinished lesson,
        // else its first lesson (pure review).
        const targetLesson =
          mod.lessons.find((l) => l.id === currentLessonId) ??
          mod.lessons.find((l) => !l.completed) ??
          mod.lessons[0];

        const ctaLabel =
          state === "done" ? "Review" : done > 0 ? "Continue" : i === 0 ? "Start here" : "Start";

        return (
          <div
            key={mod.id}
            className={[
              "rounded-xl border transition-all",
              isNextUp && !isOpen
                ? "border-brand/40 bg-surface-tint"
                : state === "done"
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-border bg-surface",
            ].join(" ")}
          >
            {/* ── Module header — click to expand ─────────────────────────── */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 text-left"
            >
              {/* Status chip */}
              <span
                className={[
                  "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                  state === "done"
                    ? "bg-emerald-100 text-emerald-600"
                    : state === "current" || isNextUp
                    ? "text-white"
                    : locked
                    ? "bg-surface-alt text-ink-muted"
                    : "bg-surface-alt text-ink-secondary",
                ].join(" ")}
                style={state === "current" || (isNextUp && state !== "done") ? { background: courseColor } : undefined}
              >
                {state === "done" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : locked ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                ) : (
                  mod.week_number
                )}
              </span>

              {/* Title + meta */}
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span
                    className={[
                      "text-sm font-semibold truncate",
                      state === "done" ? "text-emerald-700" : locked ? "text-ink-muted" : "text-ink",
                    ].join(" ")}
                  >
                    {mod.title}
                  </span>
                  {isNextUp && state !== "done" && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shrink-0"
                      style={{ background: courseColor }}
                    >
                      {done > 0 ? "Current" : "Start here"}
                    </span>
                  )}
                  {state === "done" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                      Done
                    </span>
                  )}
                </span>
                <span className="block text-[10px] text-ink-muted mt-0.5">
                  Week {mod.week_number} · {done}/{total} lessons
                  {locked && " · unlocks as you progress"}
                </span>
              </span>

              {/* Progress + chevron */}
              <span className="hidden sm:block w-16 shrink-0">
                <span className="block w-full h-1.5 rounded-full bg-surface-alt overflow-hidden">
                  <span
                    className="block h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct * 100}%`,
                      background: state === "done" ? "#059669" : courseColor,
                    }}
                  />
                </span>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* ── Lessons ─────────────────────────────────────────────────── */}
            {isOpen && (
              <div className="px-3 sm:px-4 pb-3">
                {locked ? (
                  <p className="text-xs text-ink-muted px-2 py-3">
                    Finish the module you&apos;re on and this one opens automatically.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-1 border-t border-border pt-2">
                      {mod.lessons.map((l) => {
                        const isCurrent = l.id === currentLessonId;
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/learn/${l.id}`}
                              className={[
                                "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors group",
                                isCurrent ? "bg-surface-tint" : "hover:bg-surface-soft",
                              ].join(" ")}
                            >
                              {/* Lesson status dot */}
                              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={
                                  l.completed
                                    ? { background: "#D1FAE5", color: "#059669" }
                                    : isCurrent
                                    ? { background: courseColor, color: "#fff" }
                                    : { border: "1.5px solid #CBD5E1" }
                                }
                              >
                                {l.completed ? (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : isCurrent ? (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="6 4 20 12 6 20 6 4" />
                                  </svg>
                                ) : null}
                              </span>

                              <span
                                className={[
                                  "flex-1 min-w-0 text-[13px] truncate",
                                  l.completed ? "text-ink-secondary" : isCurrent ? "text-ink font-semibold" : "text-ink",
                                ].join(" ")}
                              >
                                {l.title}
                              </span>

                              <span
                                className={[
                                  "text-[10px] font-bold uppercase tracking-wider shrink-0",
                                  l.completed ? "text-ink-muted group-hover:text-brand" : "text-brand",
                                ].join(" ")}
                              >
                                {l.completed ? "Review" : isCurrent ? "Continue" : "Start"}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Module CTA — the unmissable next action */}
                    {targetLesson && (
                      <Link
                        href={`/learn/${targetLesson.id}`}
                        className="mt-2.5 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold text-white transition-transform motion-safe:hover:-translate-y-0.5"
                        style={{ background: state === "done" ? "#059669" : courseColor }}
                      >
                        {ctaLabel}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <polygon points="6 4 20 12 6 20 6 4" />
                        </svg>
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Link
        href={`/courses/${courseSlug}`}
        className="block text-center text-xs font-semibold text-ink-muted hover:text-brand transition-colors pt-1"
      >
        View the full course page
      </Link>
    </div>
  );
}
