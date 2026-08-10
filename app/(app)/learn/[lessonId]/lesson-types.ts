// ═══════════════════════════════════════════════════════════════════════════
// Lesson player — shared types, constants and keyframe styles.
// Split out of LearnClient.tsx (UX review L4) so the card parser, markdown
// renderer and player UI can evolve independently. Types only — no logic.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Types ─────────────────────────────────────────────────────────────────

export interface LessonReference { title: string; url: string; note?: string }
export interface AppliedTask { type: "writing" | "design"; prompt: string; model_answer?: string; checklist?: string[] }
export interface LessonData {
  id: string; module_id: string; course_id: string; order_index: number;
  title: string; theory_md: string; estimated_minutes: number; learning_objectives: string[];
  case_study?: string | null; reference_links?: LessonReference[] | null;
  applied_task?: AppliedTask | null;
}
export interface ModuleData { id: string; title: string; order_index: number; course_id: string }
export interface CourseData { id: string; slug: string; title: string; total_lessons: number }
export interface ExerciseData {
  id: string; lesson_id: string; order_index: number;
  type: "mcq" | "short_answer" | "code"; title: string; prompt_md: string;
  starter_code: string | null; marks: number; language: string | null;
  options: string[] | null; correct_answer: string | null;
}
export interface ExerciseResult { exerciseId: string; correct: boolean; score: number; maxScore: number; feedback: string }
// Prompt Lab: a short_answer exercise with language='prompt' — the student writes
// the PROMPT they'd send an AI assistant for a scenario, and Nova grades the prompt.
export interface PromptGrade {
  total: number;
  dimensions: { key: string; label: string; score: number; tip: string }[];
  strength: string;
  improved_prompt: string;
}
export const PROMPT_LAB_MAX_TRIES = 3;

export interface OutlineLesson { id: string; title: string; completed: boolean; reachable: boolean }
export interface OutlineModule { id: string; title: string; orderIndex: number; lessons: OutlineLesson[] }

export interface LearnClientProps {
  lesson: LessonData; module: ModuleData | null; course: CourseData | null;
  exercises: ExerciseData[]; lessonPosition: number; totalLessonsInModule: number;
  prevLessonId: string | null; nextLessonId: string | null; alreadyCompleted: boolean;
  outline: OutlineModule[];
  weakTopics: string[];
  advancedCourse?: { slug: string; title: string } | null;
  /** True when this student has never completed ANY lesson — unlocks the
   *  "first win" milestone card ~5 minutes in (see parseTheoryIntoCards). */
  firstEverLesson?: boolean;
}

// ─── Card types ────────────────────────────────────────────────────────────

export type CardType = "objectives" | "theory" | "quiz" | "summary" | "casestudy" | "applied" | "practice" | "complete" | "milestone";

export interface LessonCard {
  type: CardType;
  title: string;
  content?: string;       // rendered HTML for theory cards
  rawContent?: string;    // raw markdown section
  exercise?: ExerciseData; // for quiz/practice cards
  takeaway?: string;      // optional one-line "In short" section takeaway
}

// ─── Styles ────────────────────────────────────────────────────────────────

export const STYLES = `
@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideIn { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
@keyframes slideOut { from { opacity:1; transform:translateX(0) } to { opacity:0; transform:translateX(-40px) } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
@keyframes pulseCheck { 0% { transform:scale(0) } 50% { transform:scale(1.2) } 100% { transform:scale(1) } }
.card-enter { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both }
.card-fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both }
.card-scale { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both }
.check-pop { animation: pulseCheck 0.4s cubic-bezier(0.16,1,0.3,1) both }
.ring-progress { transition: stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1), stroke 0.3s ease }
@keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.02) } }
.cta-breathe { animation: breathe 2s ease-in-out infinite }
@keyframes riseIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
.rise-in { animation: riseIn 0.35s cubic-bezier(0.16,1,0.3,1) both }
@media (prefers-reduced-motion: reduce) { .cta-breathe, .rise-in { animation:none } .ring-progress { transition:none } }
`;
