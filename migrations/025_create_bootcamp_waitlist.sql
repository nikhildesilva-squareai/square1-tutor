-- Migration: Bootcamp waitlist
-- Description: Interest capture for a track that cannot be applied to yet.
-- Created: 2026-08-21
--
-- WHY A SEPARATE TABLE AND NOT bootcamp_applications
--
-- An application is against a COHORT: bootcamp_applications.cohort_id is NOT NULL
-- and the row carries an assessment, a decision and a seat. Four of the six tracks
-- have no cohort at all, and even the two that do spend most of their life outside
-- the application window. Forcing those people through the applications table
-- would mean either a nullable cohort_id — which silently weakens every seat
-- count and gate join that assumes one — or fake cohort rows. Neither is worth it
-- for what is, honestly, an email address and an intent.
--
-- Waitlist rows are ANONYMOUS-FRIENDLY on purpose. Applying requires an account
-- because the work has to live somewhere; saying "tell me when this opens" should
-- not. student_id is therefore nullable and filled in when we know it.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

CREATE TABLE IF NOT EXISTS bootcamp_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bootcamp_id uuid NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
  -- Which cohort they were looking at, when there was one. Null for a track that
  -- has not scheduled an intake yet.
  cohort_id uuid REFERENCES bootcamp_cohorts(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  email text NOT NULL,
  timezone text,
  -- Why they could not join today. Mirrors lib/bootcamp/availability.ts, so the
  -- desk can tell "we were sold out" from "we had not opened yet" — those are
  -- very different signals about demand.
  reason text NOT NULL DEFAULT 'not_open_yet',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_waitlist_email_shape CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT bootcamp_waitlist_email_len   CHECK (char_length(email) <= 320),
  CONSTRAINT bootcamp_waitlist_reason_valid
    CHECK (reason IN ('not_open_yet', 'closed', 'full', 'no_cohort', 'other_band')),
  -- One row per person per track. Signing up twice is a no-op, not a duplicate.
  CONSTRAINT bootcamp_waitlist_unique UNIQUE (bootcamp_id, email)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_waitlist_bootcamp ON bootcamp_waitlist(bootcamp_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bootcamp_waitlist_pending  ON bootcamp_waitlist(bootcamp_id) WHERE notified_at IS NULL;

ALTER TABLE bootcamp_waitlist ENABLE ROW LEVEL SECURITY;

-- No policies, and no grants below. Joining is a POST through a route handler
-- that runs under the service role, exactly like the diagnostic lead capture:
-- a client-writable waitlist is a spam target, and a client-READABLE one leaks
-- every email address of everyone interested in the product.
REVOKE ALL ON bootcamp_waitlist FROM anon, authenticated;

COMMENT ON TABLE bootcamp_waitlist IS
  'Interest capture for a track that cannot be applied to yet. Separate from bootcamp_applications because an application is against a cohort and four of six tracks have none. Service-role only — client-readable would leak every interested email.';
COMMENT ON COLUMN bootcamp_waitlist.reason IS
  'Mirrors lib/bootcamp/availability.ts. "we were sold out" and "we had not opened yet" are very different demand signals.';
