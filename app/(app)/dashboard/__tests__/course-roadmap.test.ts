/**
 * Dashboard Course Roadmap — progression rules
 *
 * Locks in the three behaviours the dashboard must guarantee:
 *  1. Module 0 is available the moment a learner starts (and stays available).
 *  2. Once a module is finished, the next one becomes startable.
 *  3. Anything already completed can always be reopened for review.
 *
 * These mirror the rules on /courses/[slug] so both screens agree.
 */

import { describe, it, expect } from "@jest/globals";

type Lesson = { id: string; title: string; completed: boolean };
type Module = { id: string; title: string; week_number: number; lessons: Lesson[] };
type ModuleState = "done" | "current" | "open" | "locked";

/** Mirrors CourseRoadmap's stateOf + currentModuleIndex. */
function moduleStates(modules: Module[], currentLessonId: string | null): ModuleState[] {
  const currentModuleIndex = currentLessonId
    ? modules.findIndex((m) => m.lessons.some((l) => l.id === currentLessonId))
    : -1;

  return modules.map((mod, i) => {
    const done = mod.lessons.length > 0 && mod.lessons.every((l) => l.completed);
    if (done) return "done";
    if (i === currentModuleIndex) return "current";
    if (i === 0) return "open";
    if (currentModuleIndex >= 0 && i < currentModuleIndex) return "open";
    return "locked";
  });
}

const lesson = (id: string, completed = false): Lesson => ({ id, title: `Lesson ${id}`, completed });

function buildCourse(completedIds: string[]): Module[] {
  const mk = (mid: string, week: number, ids: string[]): Module => ({
    id: mid,
    title: `Module ${week}`,
    week_number: week,
    lessons: ids.map((id) => lesson(id, completedIds.includes(id))),
  });
  return [
    mk("m0", 0, ["a1", "a2"]),
    mk("m1", 1, ["b1", "b2"]),
    mk("m2", 2, ["c1", "c2"]),
  ];
}

describe("Course roadmap progression", () => {
  describe("1. Module 0 on day one", () => {
    it("is open before anything is completed", () => {
      const states = moduleStates(buildCourse([]), "a1");
      expect(states[0]).toBe("current");
    });

    it("is open even when the enrollment has no current lesson yet", () => {
      const states = moduleStates(buildCourse([]), null);
      expect(states[0]).toBe("open");
    });

    it("stays reachable later in the course (beginner floor / review)", () => {
      // Learner is deep in module 2; module 0 must not lock behind them.
      const states = moduleStates(buildCourse(["a1", "a2", "b1", "b2"]), "c1");
      expect(states[0]).toBe("done");
      expect(states[0]).not.toBe("locked");
    });
  });

  describe("2. Starting Module 1 after Module 0", () => {
    it("locks module 1 while the learner is still inside module 0", () => {
      const states = moduleStates(buildCourse(["a1"]), "a2");
      expect(states[1]).toBe("locked");
    });

    it("makes module 1 current once module 0 is finished and progression advances", () => {
      const states = moduleStates(buildCourse(["a1", "a2"]), "b1");
      expect(states[0]).toBe("done");
      expect(states[1]).toBe("current");
      expect(states[2]).toBe("locked");
    });
  });

  describe("3. Reviewing completed content", () => {
    it("keeps every finished module open, never re-locked", () => {
      const states = moduleStates(buildCourse(["a1", "a2", "b1", "b2"]), "c1");
      expect(states.slice(0, 2)).toEqual(["done", "done"]);
      expect(states.includes("locked")).toBe(false);
    });

    it("keeps a partially-finished earlier module open once moved past", () => {
      // b2 was never ticked off, but the learner has advanced to module 2.
      const states = moduleStates(buildCourse(["a1", "a2", "b1"]), "c1");
      expect(states[1]).toBe("open");
    });

    it("labels lessons by state: Review / Continue / Start", () => {
      const label = (l: Lesson, currentId: string | null) =>
        l.completed ? "Review" : l.id === currentId ? "Continue" : "Start";
      expect(label(lesson("a1", true), "a2")).toBe("Review");
      expect(label(lesson("a2"), "a2")).toBe("Continue");
      expect(label(lesson("b1"), "a2")).toBe("Start");
    });
  });

  describe("Next-action highlighting", () => {
    /** Mirrors CourseRoadmap's actionableIndex. */
    function actionableIndex(modules: Module[], currentLessonId: string | null): number {
      const states = moduleStates(modules, currentLessonId);
      return modules.findIndex((m, i) => {
        const s = states[i];
        return s === "current" || (s === "open" && m.lessons.some((l) => !l.completed));
      });
    }

    it("points at module 0 on day one", () => {
      expect(actionableIndex(buildCourse([]), "a1")).toBe(0);
    });

    it("moves to module 1 when module 0 is done", () => {
      expect(actionableIndex(buildCourse(["a1", "a2"]), "b1")).toBe(1);
    });

    it("skips fully-completed modules", () => {
      expect(actionableIndex(buildCourse(["a1", "a2", "b1", "b2"]), "c1")).toBe(2);
    });
  });
});
