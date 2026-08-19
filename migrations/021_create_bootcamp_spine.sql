-- Migration: Bootcamp spine — cohorts, gates, sessions, attendance, integrity
-- Description: The data layer for Bootcamps (section S1 of docs/bootcamp-prd.md).
--              Twelve tables:
--                • bootcamps                     — one row per track (AI, Cyber, CV, ML, SE, FDE)
--                • bootcamp_cohorts              — a dated, banded, seat-capped instance
--                • bootcamp_squads               — 4-person teams inside a cohort
--                • bootcamp_applications         — apply → assessed → decided
--                • bootcamp_enrollments          — membership + payment + standing
--                • bootcamp_gates                — the six compulsory gates (thresholds WITHHELD)
--                • bootcamp_gate_results         — per-student gate outcome (student-unwritable)
--                • bootcamp_sessions             — classes, labs, 1-1s, vivas
--                • bootcamp_session_registrants  — PER-STUDENT Zoom join links
--                • bootcamp_attendance           — objective, webhook-written
--                • submission_comments           — private student↔instructor thread
--                • bootcamp_audit_log            — every override, with actor and reason
-- Created: 2026-08-19
--
-- Product decisions this schema encodes are in docs/bootcamp-prd.md (v2). The
-- load-bearing ones: cohorts of 50; six gates at a 75% bar with human sign-off;
-- a weekly 30-minute 1-1; classes run on Zoom via PER-STUDENT registration links
-- (not embedded); recordings ingested to our own storage; pay-in-full or 3-part.
--
-- Follows the conventions in 020_create_competitions.sql: s1_* SECURITY DEFINER
-- helpers (so membership checks inside policies cannot recurse — see 015 for the
-- community_members recursion this avoids), named CHECK constraints, CREATE TABLE/
-- INDEX IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE POLICY, and column-level
-- REVOKE as belt-and-braces *below* RLS.
--
-- INTEGRITY NOTE (carries the 2026-07-29 audit lesson forward). That audit found our
-- weakness is integrity, not confidentiality: students could forge grades. A bootcamp
-- credential is the same shape with a sharper edge — it is sold to employers as proof,
-- and it costs the student real money. Five structural defences, none of which depend
-- on API-route correctness:
--
--   1. bootcamp_gate_results has NO INSERT or UPDATE grant for authenticated, ever.
--      A student cannot write their own pass. Gate decisions are service-role only.
--   2. bootcamp_attendance likewise. Attendance is a gate input, so a writable
--      attendance row is a forged graduation by another route. Written by the Zoom
--      webhook under the service role.
--   3. bootcamp_gates.requires (the pass thresholds) is excluded from the authenticated
--      SELECT grant permanently. Thresholds are effectively answer keys.
--   4. bootcamp_sessions.zoom_start_url is excluded from the authenticated SELECT grant.
--      A leaked start URL lets a student host — and claim-start — the class.
--   5. bootcamp_audit_log has RLS on with ZERO policies and all privileges revoked.
--      Every gate pass/fail/waive and standing override writes a row with actor +
--      reason. Overrides are allowed; silent ones are not.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).
--
-- NOTE ON NUMBERING: two 019_* migrations exist (social core, venture spine) and 020 is
-- competitions. This is 021.
--
-- NOTE ON FILE COUNT: docs/bootcamp-prd.md S1 proposed 021 (tables) + 022 (RLS). Kept as
-- ONE file, matching 019/020: applying tables without policies would leave every row
-- world-readable in the window between the two, and Supabase grants ALL on new public
-- tables by default. Schema and its defences ship together or not at all.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- Defined identically in 019/020. Repeated as CREATE OR REPLACE with the same body
-- so these migrations can be applied in any order without depending on each other.
CREATE OR REPLACE FUNCTION public.s1_student_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.s1_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Does the caller own this project submission? Used by submission_comments'
-- policy; SECURITY DEFINER so it is not subject to project_submissions' own RLS.
CREATE OR REPLACE FUNCTION public.s1_owns_submission(p_submission_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_submissions ps
    WHERE ps.id = p_submission_id
      AND ps.student_id = public.s1_student_id()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamps — one row per track. A track is a row, not a code path: all six
-- (AI, Cybersecurity, FDE, CV, ML, SE) exist from day one; only `status`
-- decides which are sellable. `course_id` is the curriculum it runs on.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  tagline text,
  overview_md text NOT NULL DEFAULT '',
  weeks int NOT NULL DEFAULT 24,
  hours_per_week int NOT NULL DEFAULT 15,
  default_cohort_size int NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamps_status_valid
    CHECK (status IN ('draft', 'waitlist', 'open', 'retired')),
  CONSTRAINT bootcamps_weeks_sane   CHECK (weeks BETWEEN 4 AND 52),
  CONSTRAINT bootcamps_size_sane    CHECK (default_cohort_size BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS idx_bootcamps_status    ON bootcamps(status);
CREATE INDEX IF NOT EXISTS idx_bootcamps_course_id ON bootcamps(course_id);

DROP TRIGGER IF EXISTS trg_bootcamps_touch ON bootcamps;
CREATE TRIGGER trg_bootcamps_touch BEFORE UPDATE ON bootcamps
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_cohorts — a dated instance. `timezone` is the BAND anchor: every
-- session time is authored in it and rendered to the visitor's own zone.
-- `skip_weeks` holds holiday dates (Eid, Diwali, Poya, Thanksgiving) so a band
-- never schedules class on one.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bootcamp_id uuid NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
  name text NOT NULL,
  band text NOT NULL DEFAULT 'A',
  timezone text NOT NULL DEFAULT 'Asia/Colombo',
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  applications_open_on date NOT NULL,
  applications_close_on date NOT NULL,
  seats int NOT NULL DEFAULT 50,
  price_cents_global int NOT NULL,
  price_cents_regional int NOT NULL,
  skip_weeks date[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_cohorts_name_unique UNIQUE (bootcamp_id, name),
  CONSTRAINT bootcamp_cohorts_band_valid  CHECK (band IN ('A', 'B', 'C')),
  CONSTRAINT bootcamp_cohorts_status_valid
    CHECK (status IN ('draft', 'open', 'full', 'running', 'complete', 'cancelled')),
  CONSTRAINT bootcamp_cohorts_dates_ordered   CHECK (ends_on > starts_on),
  CONSTRAINT bootcamp_cohorts_apps_ordered    CHECK (applications_close_on >= applications_open_on),
  CONSTRAINT bootcamp_cohorts_apps_before_start CHECK (applications_close_on <= starts_on),
  CONSTRAINT bootcamp_cohorts_seats_sane      CHECK (seats BETWEEN 1 AND 200),
  CONSTRAINT bootcamp_cohorts_prices_positive
    CHECK (price_cents_global > 0 AND price_cents_regional > 0)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_cohorts_bootcamp ON bootcamp_cohorts(bootcamp_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_cohorts_status   ON bootcamp_cohorts(status);
CREATE INDEX IF NOT EXISTS idx_bootcamp_cohorts_starts   ON bootcamp_cohorts(starts_on);

DROP TRIGGER IF EXISTS trg_bootcamp_cohorts_touch ON bootcamp_cohorts;
CREATE TRIGGER trg_bootcamp_cohorts_touch BEFORE UPDATE ON bootcamp_cohorts
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_squads — 4-person teams. `timezone_anchor` records the cluster the
-- squad was formed around: four people within ±2h can always find a time to
-- pair; four spread across 15h never can.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES bootcamp_cohorts(id) ON DELETE CASCADE,
  name text NOT NULL,
  repo_url text,
  timezone_anchor text,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_squads_name_unique UNIQUE (cohort_id, name)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_squads_cohort ON bootcamp_squads(cohort_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_applications — apply → assessed → decided.
--
-- `local_time_confirmed` encodes ST-02 at the database level: the applicant
-- ticked a box stating the class hour IN THEIR OWN TIMEZONE, in words. Selling a
-- seat to someone who cannot attend is the single most expensive mistake in a
-- cohort product, so the confirmation is a stored fact, not a UI nicety.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES bootcamp_cohorts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted',
  assessment_attempt_id uuid,
  assessment_pct numeric,
  hours_committed int,
  timezone text,
  motivation text,
  local_time_confirmed boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_applications_unique UNIQUE (cohort_id, student_id),
  CONSTRAINT bootcamp_applications_status_valid
    CHECK (status IN ('submitted', 'assessed', 'accepted', 'waitlisted',
                      'rejected', 'withdrawn', 'deferred')),
  CONSTRAINT bootcamp_applications_pct_range
    CHECK (assessment_pct IS NULL OR (assessment_pct >= 0 AND assessment_pct <= 100)),
  CONSTRAINT bootcamp_applications_hours_sane
    CHECK (hours_committed IS NULL OR hours_committed BETWEEN 1 AND 80),
  CONSTRAINT bootcamp_applications_motivation_len
    CHECK (motivation IS NULL OR char_length(motivation) <= 4000)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_applications_cohort  ON bootcamp_applications(cohort_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_applications_student ON bootcamp_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_applications_status  ON bootcamp_applications(cohort_id, status);

DROP TRIGGER IF EXISTS trg_bootcamp_applications_touch ON bootcamp_applications;
CREATE TRIGGER trg_bootcamp_applications_touch BEFORE UPDATE ON bootcamp_applications
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_enrollments — membership, payment and standing.
--
-- `enrollment_id` points at the ordinary student_enrollments row. A bootcamp
-- student IS a normal enrolled student: dashboard, streaks, Nova memory,
-- portfolio and certificates keep working with no changes. This table adds the
-- cohort layer on top; it never replaces the base enrolment.
--
-- Everything financial and every judgement (status, standing) is service-role
-- written. `viva_public` is the ONE column a student may change — ST-49, their
-- face, their choice, revocable.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES bootcamp_cohorts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES student_enrollments(id) ON DELETE RESTRICT,
  squad_id uuid REFERENCES bootcamp_squads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  standing text NOT NULL DEFAULT 'good',
  timezone text,
  payment_plan text NOT NULL DEFAULT 'full',
  amount_paid_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  deposit_paid_at timestamptz,
  paid_in_full_at timestamptz,
  recording_consent_at timestamptz,
  viva_public boolean NOT NULL DEFAULT false,
  deferred_to_cohort_id uuid REFERENCES bootcamp_cohorts(id) ON DELETE SET NULL,
  graduated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_enrollments_unique UNIQUE (cohort_id, student_id),
  CONSTRAINT bootcamp_enrollments_status_valid
    CHECK (status IN ('active', 'suspended', 'deferred', 'withdrawn', 'graduated')),
  CONSTRAINT bootcamp_enrollments_standing_valid
    CHECK (standing IN ('good', 'at_risk', 'probation')),
  CONSTRAINT bootcamp_enrollments_plan_valid
    CHECK (payment_plan IN ('full', 'three_part')),
  CONSTRAINT bootcamp_enrollments_paid_nonneg CHECK (amount_paid_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_cohort   ON bootcamp_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_student  ON bootcamp_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_squad    ON bootcamp_enrollments(squad_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_enrollments_standing ON bootcamp_enrollments(cohort_id, standing)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS trg_bootcamp_enrollments_touch ON bootcamp_enrollments;
CREATE TRIGGER trg_bootcamp_enrollments_touch BEFORE UPDATE ON bootcamp_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_gates — the six compulsory gates.
--
-- `requires` holds the pass thresholds, e.g.
--   { "lessons_pct": 90, "project_ids": ["…"], "min_score": 75,
--     "peer_reviews": 2, "attendance_pct": 70, "viva": false, "human_signoff": true }
--
-- It is NEVER granted to authenticated. Thresholds are effectively answer keys:
-- a student who can read them knows exactly how little to do.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bootcamp_id uuid NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  week int NOT NULL,
  title text NOT NULL,
  summary_md text NOT NULL DEFAULT '',
  requires jsonb NOT NULL DEFAULT '{}'::jsonb,
  unlocks_module_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_gates_order_unique UNIQUE (bootcamp_id, order_index),
  CONSTRAINT bootcamp_gates_week_sane  CHECK (week BETWEEN 1 AND 52),
  CONSTRAINT bootcamp_gates_order_sane CHECK (order_index BETWEEN 1 AND 20)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_gates_bootcamp ON bootcamp_gates(bootcamp_id, order_index);

DROP TRIGGER IF EXISTS trg_bootcamp_gates_touch ON bootcamp_gates;
CREATE TRIGGER trg_bootcamp_gates_touch BEFORE UPDATE ON bootcamp_gates
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_gate_results — per-student outcome.
--
-- THE FORGERY TARGET. A student who can write status='passed' here has
-- manufactured a credential we sell to employers as proof. There is no INSERT
-- or UPDATE grant for authenticated on this table, at any time, for any column.
-- Every write is service-role, and every decision writes bootcamp_audit_log.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_gate_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bootcamp_enrollment_id uuid NOT NULL REFERENCES bootcamp_enrollments(id) ON DELETE CASCADE,
  gate_id uuid NOT NULL REFERENCES bootcamp_gates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'locked',
  submission_id uuid REFERENCES project_submissions(id) ON DELETE SET NULL,
  objective_passed boolean,
  ci_passed boolean,
  rubric_pct numeric,
  auto_score numeric,
  attempts int NOT NULL DEFAULT 0,
  reviewer_id uuid,
  reviewer_notes_md text,
  viva_recording_url text,
  opened_at timestamptz,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_gate_results_unique UNIQUE (bootcamp_enrollment_id, gate_id),
  CONSTRAINT bootcamp_gate_results_status_valid
    CHECK (status IN ('locked', 'open', 'submitted', 'passed', 'failed', 'waived')),
  CONSTRAINT bootcamp_gate_results_attempts_capped CHECK (attempts BETWEEN 0 AND 3),
  CONSTRAINT bootcamp_gate_results_rubric_range
    CHECK (rubric_pct IS NULL OR (rubric_pct >= 0 AND rubric_pct <= 100)),
  -- A decided gate must record who decided it.
  CONSTRAINT bootcamp_gate_results_decision_attributed
    CHECK (status NOT IN ('passed', 'failed', 'waived')
           OR (decided_at IS NOT NULL AND reviewer_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_gate_results_enrollment
  ON bootcamp_gate_results(bootcamp_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_gate_results_queue
  ON bootcamp_gate_results(gate_id, status) WHERE status = 'submitted';

DROP TRIGGER IF EXISTS trg_bootcamp_gate_results_touch ON bootcamp_gate_results;
CREATE TRIGGER trg_bootcamp_gate_results_touch BEFORE UPDATE ON bootcamp_gate_results
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_sessions — classes, labs, office hours, 1-1s, vivas, demo day.
--
-- zoom_start_url is the HOST url. It is excluded from the authenticated grant
-- permanently: whoever holds it can start and host the meeting.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES bootcamp_cohorts(id) ON DELETE CASCADE,
  week int NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 90,
  host_id uuid,
  zoom_meeting_id text,
  zoom_join_url text,
  zoom_start_url text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_sessions_kind_valid
    CHECK (kind IN ('kickoff', 'class', 'lab', 'office_hours',
                    'one_to_one', 'viva', 'demo_day')),
  CONSTRAINT bootcamp_sessions_status_valid
    CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  CONSTRAINT bootcamp_sessions_duration_sane CHECK (duration_min BETWEEN 5 AND 480),
  CONSTRAINT bootcamp_sessions_week_sane     CHECK (week BETWEEN 0 AND 52)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_sessions_cohort ON bootcamp_sessions(cohort_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_bootcamp_sessions_zoom    ON bootcamp_sessions(zoom_meeting_id)
  WHERE zoom_meeting_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_bootcamp_sessions_touch ON bootcamp_sessions;
CREATE TRIGGER trg_bootcamp_sessions_touch BEFORE UPDATE ON bootcamp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_session_registrants — PER-STUDENT Zoom join links.
--
-- Not in the S1 table list in the PRD, but the spine cannot work without it and
-- S5 would otherwise need its own migration. This is the table that makes
-- attendance attributable: one shared class link produces webhook events from
-- "iPhone" and "Priya's Laptop" and cannot be matched to a student, which
-- collapses the entire gate model. Zoom registration gives each student a unique
-- join_url and carries their registrant identity into the webhook.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_session_registrants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES bootcamp_sessions(id) ON DELETE CASCADE,
  bootcamp_enrollment_id uuid NOT NULL REFERENCES bootcamp_enrollments(id) ON DELETE CASCADE,
  zoom_registrant_id text,
  join_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_session_registrants_unique UNIQUE (session_id, bootcamp_enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_registrants_session
  ON bootcamp_session_registrants(session_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_registrants_zoom
  ON bootcamp_session_registrants(zoom_registrant_id)
  WHERE zoom_registrant_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_attendance — objective, written by the Zoom webhook.
--
-- `weight` implements the global-cohort rule: live attendance counts 1.0,
-- watched_recording counts 0.5 and only when paired with an async artifact.
-- Students in the wrong timezone band must be able to graduate; students who
-- watch nothing must not.
--
-- Attendance is a GATE INPUT, so it is student-unwritable for the same reason
-- gate_results is.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES bootcamp_sessions(id) ON DELETE CASCADE,
  bootcamp_enrollment_id uuid NOT NULL REFERENCES bootcamp_enrollments(id) ON DELETE CASCADE,
  status text NOT NULL,
  minutes_present int NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 1.0,
  source text NOT NULL DEFAULT 'webhook',
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_attendance_unique UNIQUE (session_id, bootcamp_enrollment_id),
  CONSTRAINT bootcamp_attendance_status_valid
    CHECK (status IN ('present', 'late', 'absent', 'excused', 'watched_recording')),
  CONSTRAINT bootcamp_attendance_source_valid
    CHECK (source IN ('webhook', 'recording', 'manual')),
  CONSTRAINT bootcamp_attendance_weight_range CHECK (weight >= 0 AND weight <= 1),
  CONSTRAINT bootcamp_attendance_minutes_nonneg CHECK (minutes_present >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_attendance_session
  ON bootcamp_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_attendance_enrollment
  ON bootcamp_attendance(bootcamp_enrollment_id);

DROP TRIGGER IF EXISTS trg_bootcamp_attendance_touch ON bootcamp_attendance;
CREATE TRIGGER trg_bootcamp_attendance_touch BEFORE UPDATE ON bootcamp_attendance
  FOR EACH ROW EXECUTE FUNCTION public.s1_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_comments — the private student↔instructor thread (ST-32 / IN-20).
--
-- Grading is currently a one-shot AI verdict with no reply path. For a paid
-- programme with a human instructor, this conversation IS the product. The AI
-- review is message #1; the student replies; the instructor's sign-off is a
-- message in the same thread.
--
-- author_kind is NOT client-settable — a trigger forces 'student' on any
-- authenticated insert, so nobody can post as the instructor.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS submission_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  author_kind text NOT NULL DEFAULT 'student',
  author_id uuid,
  body_md text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,

  CONSTRAINT submission_comments_kind_valid
    CHECK (author_kind IN ('ai', 'instructor', 'student')),
  CONSTRAINT submission_comments_body_len
    CHECK (char_length(body_md) BETWEEN 1 AND 20000)
);

CREATE INDEX IF NOT EXISTS idx_submission_comments_submission
  ON submission_comments(submission_id, created_at)
  WHERE deleted_at IS NULL;

-- Force provenance on any client insert. Without this a student could post a
-- comment as author_kind='instructor' and manufacture a sign-off in the thread.
CREATE OR REPLACE FUNCTION public.s1_submission_comment_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The service role bypasses RLS but still fires triggers; only constrain the
  -- authenticated path, identified by having a resolvable student.
  IF public.s1_student_id() IS NOT NULL AND auth.role() = 'authenticated' THEN
    NEW.author_kind := 'student';
    NEW.author_id   := public.s1_student_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submission_comments_guard ON submission_comments;
CREATE TRIGGER trg_submission_comments_guard BEFORE INSERT ON submission_comments
  FOR EACH ROW EXECUTE FUNCTION public.s1_submission_comment_guard();

-- ─────────────────────────────────────────────────────────────────────────────
-- bootcamp_audit_log — every override, with actor and reason.
--
-- Overrides are allowed. SILENT overrides are not. Anything that changes a gate
-- outcome, a standing, or an enrolment status by human decision writes a row.
-- RLS on with zero policies: service role only, and not readable by the desk UI
-- through the anon/authenticated roles either.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  subject_table text NOT NULL,
  subject_id uuid NOT NULL,
  reason text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_audit_log_reason_len
    CHECK (reason IS NULL OR char_length(reason) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_audit_subject
  ON bootcamp_audit_log(subject_table, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bootcamp_audit_actor
  ON bootcamp_audit_log(actor_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Membership helper — defined HERE, after the tables.
--
-- LANGUAGE sql functions are parse-validated at CREATE time, so this cannot be
-- declared alongside the other helpers at the top: bootcamp_enrollments does not
-- exist yet at that point and Postgres raises 42P01. (Found by applying it.)
-- ─────────────────────────────────────────────────────────────────────────────

-- Cohorts the caller is a live member of. SECURITY DEFINER so policies on
-- squads/sessions/registrants can check membership without re-entering
-- bootcamp_enrollments' own policy (the 015 recursion trap).
CREATE OR REPLACE FUNCTION public.s1_bootcamp_cohort_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT be.cohort_id
  FROM bootcamp_enrollments be
  WHERE be.student_id = public.s1_student_id()
    AND be.status IN ('active', 'suspended', 'graduated');
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bootcamps                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_cohorts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_squads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_gates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_gate_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_session_registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_audit_log           ENABLE ROW LEVEL SECURITY;

-- bootcamps / cohorts — anything not a draft is visible to signed-in students.
-- To open public browsing later: add a TO anon policy with the same predicate
-- and grant SELECT to anon. No structural change needed.
DROP POLICY IF EXISTS bootcamps_select_published ON bootcamps;
CREATE POLICY bootcamps_select_published ON bootcamps
  FOR SELECT TO authenticated
  USING (status <> 'draft');

DROP POLICY IF EXISTS bootcamp_cohorts_select_published ON bootcamp_cohorts;
CREATE POLICY bootcamp_cohorts_select_published ON bootcamp_cohorts
  FOR SELECT TO authenticated
  USING (status <> 'draft');

-- squads — visible to members of the same cohort (you need to see who is in the room).
DROP POLICY IF EXISTS bootcamp_squads_select_cohort ON bootcamp_squads;
CREATE POLICY bootcamp_squads_select_cohort ON bootcamp_squads
  FOR SELECT TO authenticated
  USING (cohort_id IN (SELECT * FROM public.s1_bootcamp_cohort_ids()));

-- applications — your own only. You may create one; you may never decide one.
DROP POLICY IF EXISTS bootcamp_applications_select_own ON bootcamp_applications;
CREATE POLICY bootcamp_applications_select_own ON bootcamp_applications
  FOR SELECT TO authenticated
  USING (student_id = public.s1_student_id());

DROP POLICY IF EXISTS bootcamp_applications_insert_own ON bootcamp_applications;
CREATE POLICY bootcamp_applications_insert_own ON bootcamp_applications
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.s1_student_id());

-- enrollments — your own only. No INSERT policy: enrolment is created by the
-- checkout webhook under the service role, atomically with the payment.
DROP POLICY IF EXISTS bootcamp_enrollments_select_own ON bootcamp_enrollments;
CREATE POLICY bootcamp_enrollments_select_own ON bootcamp_enrollments
  FOR SELECT TO authenticated
  USING (student_id = public.s1_student_id());

DROP POLICY IF EXISTS bootcamp_enrollments_update_own_consent ON bootcamp_enrollments;
CREATE POLICY bootcamp_enrollments_update_own_consent ON bootcamp_enrollments
  FOR UPDATE TO authenticated
  USING (student_id = public.s1_student_id())
  WITH CHECK (student_id = public.s1_student_id());

-- gates — the titles and weeks are public to the cohort; `requires` is withheld
-- by the column grant below, not by policy.
DROP POLICY IF EXISTS bootcamp_gates_select_all ON bootcamp_gates;
CREATE POLICY bootcamp_gates_select_all ON bootcamp_gates
  FOR SELECT TO authenticated
  USING (true);

-- gate results — your own only, read only. NO insert/update policy exists, and
-- no grant is issued below either. Two layers, same answer.
DROP POLICY IF EXISTS bootcamp_gate_results_select_own ON bootcamp_gate_results;
CREATE POLICY bootcamp_gate_results_select_own ON bootcamp_gate_results
  FOR SELECT TO authenticated
  USING (bootcamp_enrollment_id IN (
    SELECT id FROM bootcamp_enrollments WHERE student_id = public.s1_student_id()
  ));

-- sessions — members of the cohort see the schedule.
DROP POLICY IF EXISTS bootcamp_sessions_select_cohort ON bootcamp_sessions;
CREATE POLICY bootcamp_sessions_select_cohort ON bootcamp_sessions
  FOR SELECT TO authenticated
  USING (cohort_id IN (SELECT * FROM public.s1_bootcamp_cohort_ids()));

-- registrants — your own personal join link only. Another student's link would
-- let you attend as them, which is attendance fraud.
DROP POLICY IF EXISTS bootcamp_session_registrants_select_own ON bootcamp_session_registrants;
CREATE POLICY bootcamp_session_registrants_select_own ON bootcamp_session_registrants
  FOR SELECT TO authenticated
  USING (bootcamp_enrollment_id IN (
    SELECT id FROM bootcamp_enrollments WHERE student_id = public.s1_student_id()
  ));

-- attendance — your own only, read only.
DROP POLICY IF EXISTS bootcamp_attendance_select_own ON bootcamp_attendance;
CREATE POLICY bootcamp_attendance_select_own ON bootcamp_attendance
  FOR SELECT TO authenticated
  USING (bootcamp_enrollment_id IN (
    SELECT id FROM bootcamp_enrollments WHERE student_id = public.s1_student_id()
  ));

-- submission_comments — private to the submission's owner (and staff via the
-- service role). Students may add to their own thread; the guard trigger stamps
-- provenance so they cannot post as the instructor.
DROP POLICY IF EXISTS submission_comments_select_own ON submission_comments;
CREATE POLICY submission_comments_select_own ON submission_comments
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.s1_owns_submission(submission_id));

DROP POLICY IF EXISTS submission_comments_insert_own ON submission_comments;
CREATE POLICY submission_comments_insert_own ON submission_comments
  FOR INSERT TO authenticated
  WITH CHECK (public.s1_owns_submission(submission_id));

-- bootcamp_audit_log — DELIBERATELY NO POLICIES. RLS is on, so with no policy the
-- table denies everything to every non-superuser role. The grants below make it
-- unreachable a second time, at a different layer.

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants — belt and braces BELOW RLS.
--
-- Supabase grants ALL on new public tables to anon + authenticated by default, so
-- every table here is stripped back and re-granted explicitly. Even if a future
-- policy is written carelessly, these roles simply cannot touch what they must not.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE ALL ON bootcamps                    FROM anon, authenticated;
REVOKE ALL ON bootcamp_cohorts             FROM anon, authenticated;
REVOKE ALL ON bootcamp_squads              FROM anon, authenticated;
REVOKE ALL ON bootcamp_applications        FROM anon, authenticated;
REVOKE ALL ON bootcamp_enrollments         FROM anon, authenticated;
REVOKE ALL ON bootcamp_gates               FROM anon, authenticated;
REVOKE ALL ON bootcamp_gate_results        FROM anon, authenticated;
REVOKE ALL ON bootcamp_sessions            FROM anon, authenticated;
REVOKE ALL ON bootcamp_session_registrants FROM anon, authenticated;
REVOKE ALL ON bootcamp_attendance          FROM anon, authenticated;
REVOKE ALL ON submission_comments          FROM anon, authenticated;
REVOKE ALL ON bootcamp_audit_log           FROM anon, authenticated;

-- bootcamps / cohorts / squads: read-only. Authoring is a desk/service-role action.
GRANT SELECT ON bootcamps        TO authenticated;
GRANT SELECT ON bootcamp_cohorts TO authenticated;
GRANT SELECT ON bootcamp_squads  TO authenticated;

-- applications: read your own, create one. Decision columns have no write grant —
-- status, reviewed_by, decision_note and decided_at are service-role only.
GRANT SELECT ON bootcamp_applications TO authenticated;
GRANT INSERT (cohort_id, student_id, assessment_attempt_id, hours_committed,
              timezone, motivation, local_time_confirmed)
  ON bootcamp_applications TO authenticated;

-- enrollments: read your own. The ONLY writable column is viva_public — the
-- student's own face, their own choice, revocable (ST-49). Everything financial
-- and every judgement is service-role.
GRANT SELECT ON bootcamp_enrollments TO authenticated;
GRANT UPDATE (viva_public) ON bootcamp_enrollments TO authenticated;

-- gates: `requires` is omitted from the SELECT grant and never appears in it. A
-- table-level GRANT SELECT would silently cover it, so columns are enumerated.
GRANT SELECT (id, bootcamp_id, order_index, week, title, summary_md,
              unlocks_module_ids, created_at, updated_at)
  ON bootcamp_gates TO authenticated;

-- gate_results: SELECT only. No INSERT, no UPDATE, no column exceptions. This is
-- the whole point — a student cannot write their own pass.
GRANT SELECT ON bootcamp_gate_results TO authenticated;

-- sessions: zoom_start_url is omitted permanently. Whoever holds it can host.
GRANT SELECT (id, cohort_id, week, kind, title, starts_at, duration_min,
              host_id, zoom_meeting_id, zoom_join_url, status,
              created_at, updated_at)
  ON bootcamp_sessions TO authenticated;

-- registrants: SELECT only, and the policy narrows it to your own link.
GRANT SELECT ON bootcamp_session_registrants TO authenticated;

-- attendance: SELECT only. Attendance is a gate input; a writable row is a
-- forged graduation by another route.
GRANT SELECT ON bootcamp_attendance TO authenticated;

-- submission_comments: read your thread, add to it. author_kind and author_id
-- have no grant — the guard trigger stamps them.
GRANT SELECT ON submission_comments TO authenticated;
GRANT INSERT (submission_id, body_md) ON submission_comments TO authenticated;

-- bootcamp_audit_log: nothing. Service role only. This is the whole point.

-- Functions: EXECUTE defaults to PUBLIC on creation, which would expose the
-- helpers and the guard to anon. Strip and re-grant.
REVOKE ALL ON FUNCTION public.s1_bootcamp_cohort_ids()       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.s1_bootcamp_cohort_ids()    TO authenticated;

REVOKE ALL ON FUNCTION public.s1_owns_submission(uuid)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.s1_owns_submission(uuid)    TO authenticated;

REVOKE ALL ON FUNCTION public.s1_submission_comment_guard()  FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments (these tables will be read by people who did not write them)
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE bootcamps IS
  'One row per bootcamp track. All six exist from day one; `status` decides which are sellable. Spec: docs/bootcamp-prd.md S1.';
COMMENT ON COLUMN bootcamps.course_id IS
  'The curriculum this track runs on. A bootcamp is a delivery mode over an existing course, not a separate body of content.';

COMMENT ON COLUMN bootcamp_cohorts.timezone IS
  'The BAND anchor (IANA). Every session time is authored in this zone and rendered to the visitor''s own. Band A = Asia/Colombo 19:00.';
COMMENT ON COLUMN bootcamp_cohorts.skip_weeks IS
  'Holiday dates for this band — Eid, Diwali, Poya, Thanksgiving. A band must never schedule class on one.';

COMMENT ON COLUMN bootcamp_applications.local_time_confirmed IS
  'ST-02 as a stored fact: the applicant ticked a box stating the class hour IN THEIR OWN TIMEZONE, in words. Selling a seat to someone who cannot attend is the most expensive mistake in a cohort product.';

COMMENT ON TABLE bootcamp_enrollments IS
  'The cohort layer on top of an ordinary student_enrollments row. A bootcamp student IS a normal enrolled student — dashboard, streaks, Nova memory, portfolio and certificates keep working unchanged.';
COMMENT ON COLUMN bootcamp_enrollments.viva_public IS
  'The ONE column a student may write on this table. Their face, their choice, revocable (ST-49).';
COMMENT ON COLUMN bootcamp_enrollments.status IS
  'active | suspended (payment failed — loses live access and gate submission, keeps recordings) | deferred | withdrawn | graduated.';

COMMENT ON COLUMN bootcamp_gates.requires IS
  'Pass thresholds. NEVER granted to authenticated — thresholds are effectively answer keys. Service role only.';

COMMENT ON TABLE bootcamp_gate_results IS
  'THE FORGERY TARGET. No INSERT or UPDATE grant for authenticated, ever, for any column. Every decision is service-role and writes bootcamp_audit_log.';

COMMENT ON COLUMN bootcamp_sessions.zoom_start_url IS
  'HOST url. Excluded from the authenticated SELECT grant permanently — whoever holds it can start and host the class.';

COMMENT ON TABLE bootcamp_session_registrants IS
  'Per-student Zoom join links. The table that makes attendance attributable: one shared class link produces unmatched webhook events and collapses the gate model.';

COMMENT ON COLUMN bootcamp_attendance.weight IS
  'Live = 1.0; watched_recording = 0.5 and only when paired with an async artifact. Students in the wrong timezone band must be able to graduate; students who watch nothing must not.';

COMMENT ON TABLE submission_comments IS
  'Private student<->instructor thread on a submission (ST-32 / IN-20). The AI review is message #1. author_kind is trigger-stamped so a student cannot post as the instructor.';

COMMENT ON TABLE bootcamp_audit_log IS
  'Every gate pass/fail/waive and standing override, with actor and reason. RLS on with zero policies and all privileges revoked — service role only. Overrides are allowed; silent ones are not.';
