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
  parent_course_id: string | null;
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

export interface ProjectRubricCriterion {
  criterion: string;
  weight: number;
  description?: string;
}

export interface ProjectReference {
  title: string;
  url: string;
  note?: string;
}

export interface ProjectDataCardColumn {
  name: string;
  type: string;
  description: string;
}

export interface ProjectDataCard {
  summary?: string;
  columns?: ProjectDataCardColumn[];
  sample_rows?: Record<string, unknown>[];
  notes?: string;
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
  // Gold-standard kit fields (added via migration)
  rubric?: ProjectRubricCriterion[] | null;
  reference_links?: ProjectReference[] | null;
  dataset_source?: string | null;
  dataset_license?: string | null;
  dataset_attribution?: string | null;
  dataset_url?: string | null;
  starter_repo_url?: string | null;
  resources?: Record<string, unknown>[] | null;
  data_card?: ProjectDataCard | null;
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
  code_comments: CodeComment[] | null;
  submission_history: SubmissionHistoryEntry[] | null;
  attempt_number: number;
  in_portfolio: boolean;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface SubmissionHistoryEntry {
  attempt: number;
  score: number;
  max_score: number;
  breakdown: ScoreBreakdown[];
  submitted_at: string;
}

export interface ScoreBreakdown {
  criterion: string;
  score: number;
  max: number;
  feedback: string;
}

export interface CodeComment {
  file: string;
  line?: number;
  comment: string;
  severity: "info" | "warning" | "error";
  snippet?: {
    startLine: number;
    lines: { num: number; text: string; highlighted: boolean }[];
  };
  githubUrl?: string;
}

export interface CommunityProfile {
  id: string;
  user_id: string;
  student_id: string;
  avatar_url: string | null;
  bio: string | null;
  pronouns: string | null;
  location: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export type TemplateType = "project" | "research" | "company" | "opensource" | "cohort";
export type CommunityRole = "creator" | "moderator" | "member";
export type InviteStatus = "auto_added" | "pending" | "accepted" | "declined";

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template_type: TemplateType;
  category: string;
  is_private: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  profile_id: string;
  role: CommunityRole;
  joined_at: string;
  is_muted: boolean;
}

export interface CommunityInvite {
  id: string;
  community_id: string;
  profile_id: string;
  invited_by: string | null;
  invite_status: InviteStatus;
  sent_at: string;
  responded_at: string | null;
}

// ── Competitions ─────────────────────────────────────────────────────────────
// Schema: migrations/020_create_competitions.sql
// Locked product decisions: docs/competitions-decisions.md

export type CompetitionTrack = "ml" | "ds" | "cv" | "nlp" | "agents";
export type CompetitionTier = "playground" | "featured" | "sponsored";
/** draft (unlisted) → upcoming (joinable) → open (submittable) → scoring → closed */
export type CompetitionStatus = "draft" | "upcoming" | "open" | "scoring" | "closed";
export type CompetitionMetric =
  | "rmse" | "mae" | "r2"                          // regression
  | "accuracy" | "macro_f1" | "auc" | "logloss"    // classification
  | "map_iou" | "mean_dice"                        // vision (P3)
  | "bleu" | "rouge_l";                            // text (P3)
export type MetricDirection = "maximize" | "minimize";
export type SubmissionStatus = "queued" | "scored" | "invalid";
export type CompetitionMedal = "gold" | "silver" | "bronze";

export interface Competition {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  overview_md: string;
  rules_md: string;
  track: CompetitionTrack;
  tier: CompetitionTier;
  /** A link, not a gate — entry is open to any signed-in student. */
  course_id: string | null;
  metric: CompetitionMetric;
  metric_direction: MetricDirection;
  baseline_score: number | null;
  baseline_label: string | null;
  data_path: string | null;
  sample_submission_path: string | null;
  column_docs: { name: string; description: string }[];
  id_column: string;
  target_column: string;
  test_row_count: number | null;
  opens_at: string;
  closes_at: string;
  daily_submission_limit: number;
  max_selected_submissions: number;
  team_size_limit: number;
  status: CompetitionStatus;
  results_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  student_id: string;
  /** Placeholder until P3 team entries land. */
  team_id: string | null;
  display_name: string;
  rules_accepted_at: string;
  disqualified_at: string | null;
  disqualified_reason: string | null;
  joined_at: string;
}

/**
 * Client-visible shape of a submission. `private_score` is deliberately absent:
 * the column is never granted to the authenticated role, at any time. Final
 * standings reach students through CompetitionResult only.
 */
export interface CompetitionSubmission {
  id: string;
  entry_id: string;
  competition_id: string;
  file_path: string;
  file_sha256: string | null;
  row_count: number | null;
  public_score: number | null;
  status: SubmissionStatus;
  error: string | null;
  is_selected: boolean;
  scored_at: string | null;
  created_at: string;
}

export interface CompetitionResult {
  competition_id: string;
  entry_id: string;
  rank: number;
  entrant_count: number;
  /** 0 = best. Preferred over raw rank on proof surfaces — survives small N. */
  percentile: number;
  final_score: number;
  public_score: number | null;
  medal: CompetitionMedal | null;
  /** Independent of medal: the absolute goal every entrant can reach. */
  beat_baseline: boolean;
  created_at: string;
}

/** Row shape returned by the s1_competition_leaderboard(uuid, int, int) RPC. */
export interface LeaderboardRow {
  rank: number;
  entry_id: string;
  display_name: string;
  best_score: number;
  submission_count: number;
  reached_at: string;
}

// ── Bootcamps ────────────────────────────────────────────────────────────────
// Schema: migrations/021_create_bootcamp_spine.sql
// Product decisions: docs/bootcamp-prd.md (v2)
//
// These are the CLIENT-VISIBLE shapes. Two columns are deliberately absent and
// must never be added here:
//   • bootcamp_gates.requires        — pass thresholds; effectively answer keys
//   • bootcamp_sessions.zoom_start_url — whoever holds it can host the class
// Both are excluded from the authenticated GRANT in 021. Typing them would
// invite a query that silently returns null and a reader who assumes otherwise.

export type BootcampStatus = "draft" | "waitlist" | "open" | "retired";
export type CohortBand = "A" | "B" | "C";
export type CohortStatus =
  | "draft" | "open" | "full" | "running" | "complete" | "cancelled";
export type BootcampApplicationStatus =
  | "submitted" | "assessed" | "accepted" | "waitlisted"
  | "rejected" | "withdrawn" | "deferred";
export type BootcampEnrollmentStatus =
  | "active" | "suspended" | "deferred" | "withdrawn" | "graduated";
export type BootcampStanding = "good" | "at_risk" | "probation";
export type BootcampPaymentPlan = "full" | "three_part";
export type BootcampGateStatus =
  | "locked" | "open" | "submitted" | "passed" | "failed" | "waived";
export type BootcampSessionKind =
  | "kickoff" | "class" | "lab" | "office_hours"
  | "one_to_one" | "viva" | "demo_day";
export type BootcampSessionStatus = "scheduled" | "live" | "ended" | "cancelled";
export type BootcampAttendanceStatus =
  | "present" | "late" | "absent" | "excused" | "watched_recording";
export type SubmissionCommentAuthor = "ai" | "instructor" | "student";

export interface Bootcamp {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  overview_md: string;
  weeks: number;
  hours_per_week: number;
  default_cohort_size: number;
  status: BootcampStatus;
  created_at: string;
  updated_at: string;
}

export interface BootcampCohort {
  id: string;
  bootcamp_id: string;
  name: string;
  band: CohortBand;
  /** IANA zone. The band anchor — session times are authored in it. */
  timezone: string;
  starts_on: string;
  ends_on: string;
  applications_open_on: string;
  applications_close_on: string;
  seats: number;
  price_cents_global: number;
  price_cents_regional: number;
  /** Holiday dates this band must not schedule class on. */
  skip_weeks: string[];
  status: CohortStatus;
  community_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BootcampSquad {
  id: string;
  cohort_id: string;
  name: string;
  repo_url: string | null;
  timezone_anchor: string | null;
  created_at: string;
}

export interface BootcampApplication {
  id: string;
  cohort_id: string;
  student_id: string;
  status: BootcampApplicationStatus;
  assessment_attempt_id: string | null;
  assessment_pct: number | null;
  hours_committed: number | null;
  timezone: string | null;
  motivation: string | null;
  /** ST-02: the applicant confirmed the class hour in their OWN timezone. */
  local_time_confirmed: boolean;
  reviewed_by: string | null;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BootcampEnrollment {
  id: string;
  cohort_id: string;
  student_id: string;
  /** The ordinary student_enrollments row. A bootcamp student IS a normal
   *  enrolled student — dashboard, streaks, Nova, portfolio all keep working. */
  enrollment_id: string;
  squad_id: string | null;
  status: BootcampEnrollmentStatus;
  standing: BootcampStanding;
  timezone: string | null;
  payment_plan: BootcampPaymentPlan;
  amount_paid_cents: number;
  currency: string;
  deposit_paid_at: string | null;
  paid_in_full_at: string | null;
  recording_consent_at: string | null;
  /** The ONE column a student may write on this table (ST-49). */
  viva_public: boolean;
  deferred_to_cohort_id: string | null;
  graduated_at: string | null;
  created_at: string;
  updated_at: string;
}

/** `requires` is intentionally absent — service-role read only. */
export interface BootcampGate {
  id: string;
  bootcamp_id: string;
  order_index: number;
  week: number;
  title: string;
  summary_md: string;
  unlocks_module_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface BootcampGateResult {
  id: string;
  bootcamp_enrollment_id: string;
  gate_id: string;
  status: BootcampGateStatus;
  submission_id: string | null;
  objective_passed: boolean | null;
  ci_passed: boolean | null;
  rubric_pct: number | null;
  auto_score: number | null;
  attempts: number;
  reviewer_id: string | null;
  reviewer_notes_md: string | null;
  viva_recording_url: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

/** `zoom_start_url` is intentionally absent — service-role read only. */
export interface BootcampSession {
  id: string;
  cohort_id: string;
  week: number;
  kind: BootcampSessionKind;
  title: string;
  starts_at: string;
  duration_min: number;
  host_id: string | null;
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  status: BootcampSessionStatus;
  created_at: string;
  updated_at: string;
}

/** The student's own personal join link. Never another student's. */
export interface BootcampSessionRegistrant {
  id: string;
  session_id: string;
  bootcamp_enrollment_id: string;
  zoom_registrant_id: string | null;
  join_url: string;
  created_at: string;
}

export interface BootcampAttendance {
  id: string;
  session_id: string;
  bootcamp_enrollment_id: string;
  status: BootcampAttendanceStatus;
  minutes_present: number;
  /** live 1.0 · late 0.75 · watched_recording 0.5 · absent 0 */
  weight: number;
  source: "webhook" | "recording" | "manual";
  joined_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionComment {
  id: string;
  submission_id: string;
  /** Trigger-stamped on any client insert — a student cannot post as staff. */
  author_kind: SubmissionCommentAuthor;
  author_id: string | null;
  body_md: string;
  created_at: string;
  deleted_at: string | null;
}
