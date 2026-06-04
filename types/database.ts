// ── Core domain types for Square 1 Tutor ─────────────────────────────────────

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseType = "mcq" | "short_answer" | "code";
export type QuestionType = "mcq" | "short_answer" | "code";
export type EnrollmentStatus = "active" | "paused" | "completed";
export type ProjectStatus = "not_started" | "in_progress" | "submitted" | "reviewed";
export type AssessmentStatus = "in_progress" | "submitted" | "graded";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  level: string;
  total_modules: number;
  total_lessons: number;
  total_projects: number;
  status: "active" | "coming_soon";
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
  description: string;
  week_number: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  order_index: number;
  title: string;
  theory_md: string;
  estimated_minutes: number;
  learning_objectives: string[];
}

export interface Exercise {
  id: string;
  lesson_id: string;
  order_index: number;
  type: ExerciseType;
  title: string;
  prompt_md: string;
  starter_code: string | null;
  solution_code: string | null;
  test_cases: Record<string, unknown>[] | null;
  marks: number;
  language: string | null;
  options: string[] | null;
  correct_answer: string | null;
}

export interface Project {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
  description_md: string;
  difficulty: CourseLevel;
  estimated_hours: number;
  tech_stack: string[];
  requirements: string[];
  milestone_checkpoints: Record<string, unknown>[];
}

export interface AssessmentQuestion {
  id: string;
  paper_id: string;
  number: number;
  type: QuestionType;
  stem_md: string;
  options: string[] | null;
  correct_answer: string | null;
  mark_scheme_md: string | null;
  marks: number;
  topic_tags: string[];
  bloom_level: string;
  language: string | null;
  starter_code: string | null;
}

export interface Student {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  assessment_level: CourseLevel | null;
  current_lesson_id: string | null;
  target_completion_date: string | null;
  status: EnrollmentStatus;
}

export interface ProjectSubmission {
  id: string;
  student_id: string;
  project_id: string;
  github_url: string;
  live_url: string | null;
  description: string | null;
  score: number | null;
  max_score: number;
  breakdown: ScoreBreakdown[] | null;
  overall_feedback: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface ScoreBreakdown {
  criterion: string;
  score: number;
  max: number;
  feedback: string;
}
