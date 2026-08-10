// ═══════════════════════════════════════════════════════════════════════════
// Theory → card-deck parser. Sections split on "##", quick checks paced every
// two sections (orphan MCQs always flushed), first-win milestone placement,
// summary/case-study/applied/practice/complete ordering.
// Split out of LearnClient.tsx (UX review L4). Behaviour-identical.
// ═══════════════════════════════════════════════════════════════════════════

import type { ExerciseData, LessonReference, LessonCard } from "./lesson-types";
import { renderSection } from "./lesson-markdown";

// ─── Parse theory into cards ───────────────────────────────────────────────

export function parseTheoryIntoCards(theory: string, exercises: ExerciseData[], objectives: string[], caseStudy: string, references: LessonReference[], hasAppliedTask: boolean, firstEverLesson = false): LessonCard[] {
  const cards: LessonCard[] = [];

  // 1. Objectives card (if any)
  if (objectives && objectives.length > 0) {
    cards.push({ type: "objectives", title: "What You'll Learn" });
  }

  // 2. Split theory on ## headers into sections.
  //    Strip the leading "# Title" block first — it duplicates the lesson header
  //    and would otherwise render as an empty first step (showing a literal "#").
  const theoryBody = theory.replace(/^\s*#(?!#)\s+.*(?:\r?\n)+/, "");
  const sections: { title: string; content: string }[] = [];
  const parts = theoryBody.split(/^## /gm);

  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    // Anything before the FIRST "## " is the lesson's lead-in paragraph, not a section
    // heading. It must render as body copy: dropping it into the section <h2> would
    // show the whole paragraph as one bold block with literal "**" markers, and leave
    // the card body empty. (Only fires when parts[0] is non-empty — a lesson whose
    // theory starts straight at "## " yields an empty parts[0], which is skipped.)
    if (idx === 0) {
      sections.push({ title: "Overview", content: trimmed });
      return;
    }
    const firstNewline = trimmed.indexOf("\n");
    const rawTitle = firstNewline === -1 ? trimmed : trimmed.substring(0, firstNewline);
    const title = rawTitle.replace(/^#+\s*/, "").trim();           // never show a literal "#"
    // Strip the `---` section separators that glue to the section body when we
    // split on `##` — renderSection prints them as literal dashes otherwise.
    const content = (firstNewline === -1 ? "" : trimmed.substring(firstNewline + 1))
      .replace(/(?:\r?\n)\s*-{3,}\s*$/, "")   // trailing separator
      .replace(/^\s*-{3,}\s*(?:\r?\n)/, "")    // leading separator
      .trim();
    sections.push({ title, content });
  });

  // 3. Add theory cards with inline quizzes after every 2 sections
  const mcqExercises = exercises.filter(e => e.type === "mcq");
  let quizIdx = 0;

  sections.forEach((section, i) => {
    // Lift an optional author takeaway from the FIRST non-empty line —
    // `**In short:** …` or `> [!KEY] …` — into a chip and strip it from the body.
    let takeaway: string | undefined;
    let body = section.content;
    const bodyLines = body.split(/\r?\n/);
    const firstIdx = bodyLines.findIndex((l) => l.trim().length > 0);
    if (firstIdx !== -1) {
      const m = bodyLines[firstIdx].match(/^\s*(?:\*\*In short:\*\*|>\s*\[!KEY\])\s*(.+?)\s*$/i);
      if (m) {
        takeaway = m[1].trim();
        bodyLines.splice(firstIdx, 1);
        body = bodyLines.join("\n").replace(/^\s+/, "");
      }
    }
    cards.push({
      type: "theory",
      title: section.title,
      content: renderSection(body),
      rawContent: body,
      takeaway,
    });

    // Insert an inline quiz after every 2 theory sections
    if ((i + 1) % 2 === 0 && quizIdx < mcqExercises.length) {
      cards.push({
        type: "quiz",
        title: "Quick Check",
        exercise: mcqExercises[quizIdx],
      });
      quizIdx++;
    }
  });

  // 3a. Flush every quick check the pacing loop didn't place. A lesson with
  // more MCQs than sections÷2 used to ORPHAN the extras: no card existed for
  // them, so the completion checklist's jump went nowhere, the deck never
  // asked the question, and the server-side completion gate demanded answers
  // the student was never shown. Every exercise must own a card, always.
  while (quizIdx < mcqExercises.length) {
    cards.push({
      type: "quiz",
      title: "Quick Check",
      exercise: mcqExercises[quizIdx],
    });
    quizIdx++;
  }

  // 3b. First-win milestone — ONLY on a student's very first lesson. The full
  // lesson is a 30–40 minute ask; the honest "5-minute first win" is the first
  // concept + its quick check. Right there we celebrate and offer a clean exit
  // (momentum by choice, not by trap). Placed after the first quiz card, or
  // after the opening cards when a lesson has no MCQs.
  if (firstEverLesson && cards.length > 1) {
    const firstQuiz = cards.findIndex((c) => c.type === "quiz");
    const anchor = firstQuiz !== -1 ? firstQuiz + 1 : Math.min(cards.length, 3);
    cards.splice(anchor, 0, { type: "milestone", title: "First win" });
  }

  // 4. Summary card
  cards.push({ type: "summary", title: "Key Takeaways" });

  // 4b. Real-world case study (how companies use this) — shown after the recap.
  if ((caseStudy && caseStudy.trim()) || (references && references.length > 0)) {
    cards.push({ type: "casestudy", title: "Real-World Case Study" });
  }

  // 4c. Applied "Apply It" task — reflective (not graded), optional Nova feedback.
  if (hasAppliedTask) {
    cards.push({ type: "applied", title: "Apply It" });
  }

  // 5. Practice cards (non-MCQ exercises)
  const practiceExercises = exercises.filter(e => e.type !== "mcq");
  for (const ex of practiceExercises) {
    cards.push({ type: "practice", title: ex.title, exercise: ex });
  }

  // 6. Completion card
  cards.push({ type: "complete", title: "Lesson Complete" });

  return cards;
}
