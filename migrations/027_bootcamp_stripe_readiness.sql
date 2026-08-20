-- Migration: Consent, retryable instalments, and an atomic enrolment
-- Description: S3 completion. Everything the Stripe integration needs that is
--              not a credential. Created: 2026-08-21.
--
-- THREE THINGS, EACH A DEFECT RATHER THAN A FEATURE
--
-- 1. CONSENT WAS NEVER CAPTURED. bootcamp_enrollments.recording_consent_at has
--    existed since migration 021 and nothing has ever written it. Every live
--    class is recorded and the viva recording is what backs the credential, so a
--    null consent column on every student is not a gap in a form — it is the
--    record of permission we would need if anyone ever asked for it.
--
--    Captured at APPLICATION time, not at payment. The PRD says "captured here,
--    not later" meaning checkout, but consent to being recorded should come
--    before someone pays, never as a condition of having paid. It is copied onto
--    the enrolment when they enrol so the enrolment stays self-contained.
--
-- 2. A FAILED INSTALMENT PERMANENTLY BLOCKED ITS RETRY. UNIQUE (application_id,
--    instalment) is what makes a double-clicked button or a redelivered webhook
--    land once — that part is right and stays. But it also meant recording a
--    FAILED instalment 2 made a later successful instalment 2 impossible to
--    insert. With card payments arriving, a first failure is ordinary rather
--    than exceptional. The uniqueness that actually matters is "at most one PAID
--    row per instalment", so the constraint becomes a partial unique index.
--
-- 3. ENROLMENT WAS NOT ATOMIC. The route created student_enrollments and then
--    bootcamp_enrollments as two separate statements. A failure between them
--    left a base enrolment with no cohort row. It self-healed on retry, but
--    "self-heals if someone retries" is not the same as correct, and a payment
--    webhook is exactly where nobody is watching. One function, one transaction.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Consent, captured when they apply
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bootcamp_applications
  ADD COLUMN IF NOT EXISTS recording_consent_at timestamptz;

COMMENT ON COLUMN bootcamp_applications.recording_consent_at IS
  'When the applicant agreed that live classes and their viva are recorded. Set at apply time; copied to bootcamp_enrollments on enrolment.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Instalments: one PAID row each, any number of failed attempts
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bootcamp_payments
  DROP CONSTRAINT IF EXISTS bootcamp_payments_no_duplicate_instalment;

CREATE UNIQUE INDEX IF NOT EXISTS bootcamp_payments_one_paid_per_instalment
  ON bootcamp_payments (application_id, instalment)
  WHERE status = 'paid';

ALTER TABLE bootcamp_payments
  ADD COLUMN IF NOT EXISTS failure_reason text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Atomic enrolment
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SECURITY DEFINER because it writes tables `authenticated` cannot touch —
-- enrolments are service-role-write by design (the 2026-07-29 integrity work).
-- REVOKED from anon and authenticated below so a new function does not quietly
-- reopen the door migration 022 closed.
--
-- The amount is a PARAMETER rather than something this function derives. The
-- caller has already checked it against the payment method's billing country via
-- verifyRegionAtCheckout(); re-deriving it here from students.country would undo
-- that check, because a self-declared profile field is not a payment method.

CREATE OR REPLACE FUNCTION s1_bootcamp_enrol(
  p_application_id uuid,
  p_plan           text,
  p_amount_cents   integer,
  p_region         text,
  p_provider       text,
  p_provider_ref   text DEFAULT NULL,
  p_note           text DEFAULT NULL,
  p_recorded_by    text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_app       bootcamp_applications%ROWTYPE;
  v_course    uuid;
  v_base      uuid;
  v_enrolment uuid;
  v_next      integer;
  v_seen      uuid;
BEGIN
  -- FOR UPDATE: two webhook deliveries for the same session must not both pass
  -- the status check and both enrol.
  SELECT * INTO v_app FROM bootcamp_applications
   WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'no_data_found';
  END IF;

  -- IDEMPOTENCY. Stripe redelivers on any non-2xx and on its own timeouts, and a
  -- redelivery carries the SAME payment_intent. The instalment number is derived
  -- below as "one past the highest paid", so WITHOUT this guard a redelivery
  -- looks like the NEXT instalment: one payment recorded twice and added to the
  -- running total twice. The unique index cannot catch it, because a derived
  -- instalment number is never the same twice. The provider reference is the
  -- only thing that identifies a payment across deliveries.
  IF p_provider_ref IS NOT NULL THEN
    SELECT bootcamp_enrollment_id INTO v_seen FROM bootcamp_payments
     WHERE application_id = p_application_id AND provider = p_provider
       AND provider_ref = p_provider_ref AND status = 'paid'
     LIMIT 1;
    IF v_seen IS NOT NULL THEN RETURN v_seen; END IF;
  END IF;

  IF v_app.status <> 'accepted' THEN
    RAISE EXCEPTION 'application is %, not accepted', v_app.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- A lapsed offer no longer holds a seat, and taking money for it would be
  -- selling something already returned to the pool. The exception is an
  -- enrolment that already exists: money already taken outranks the timer.
  IF v_app.offer_expires_at IS NULL OR v_app.offer_expires_at <= now() THEN
    IF NOT EXISTS (SELECT 1 FROM bootcamp_enrollments
                    WHERE cohort_id = v_app.cohort_id
                      AND student_id = v_app.student_id) THEN
      RAISE EXCEPTION 'offer has expired' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  SELECT b.course_id INTO v_course
    FROM bootcamp_cohorts c JOIN bootcamps b ON b.id = c.bootcamp_id
   WHERE c.id = v_app.cohort_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'course not found for cohort' USING ERRCODE = 'no_data_found';
  END IF;

  -- A bootcamp student IS an ordinary enrolled student, so the ordinary row
  -- comes first: dashboard, streaks, Nova memory and certificates keep working
  -- with no special cases.
  SELECT id INTO v_base FROM student_enrollments
   WHERE student_id = v_app.student_id AND course_id = v_course;
  IF v_base IS NULL THEN
    INSERT INTO student_enrollments (student_id, course_id, plan_months, status)
    VALUES (v_app.student_id, v_course, 6, 'active')
    RETURNING id INTO v_base;
  END IF;

  INSERT INTO bootcamp_enrollments (
    cohort_id, student_id, enrollment_id, status, timezone,
    payment_plan, amount_paid_cents, currency, paid_in_full_at, recording_consent_at
  ) VALUES (
    v_app.cohort_id, v_app.student_id, v_base, 'active', v_app.timezone,
    p_plan, p_amount_cents, 'USD',
    CASE WHEN p_plan = 'full' THEN now() ELSE NULL END,
    v_app.recording_consent_at
  )
  ON CONFLICT (cohort_id, student_id) DO UPDATE
     SET amount_paid_cents = bootcamp_enrollments.amount_paid_cents + EXCLUDED.amount_paid_cents,
         status            = 'active',
         paid_in_full_at   = COALESCE(bootcamp_enrollments.paid_in_full_at,
                                      EXCLUDED.paid_in_full_at)
  RETURNING id INTO v_enrolment;

  -- Which instalment this is: one past the highest already PAID. Derived here
  -- rather than passed in, so a redelivered webhook cannot be told it is a
  -- different instalment than it really is.
  SELECT COALESCE(max(instalment), 0) + 1 INTO v_next
    FROM bootcamp_payments
   WHERE application_id = p_application_id AND status = 'paid';
  IF v_next > 3 THEN
    RAISE EXCEPTION 'all instalments are already paid' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO bootcamp_payments (
    application_id, bootcamp_enrollment_id, student_id, provider, provider_ref,
    plan, instalment, amount_cents, region, status, note, recorded_by
  ) VALUES (
    p_application_id, v_enrolment, v_app.student_id, p_provider, p_provider_ref,
    p_plan, v_next, p_amount_cents, p_region, 'paid', p_note, p_recorded_by
  )
  ON CONFLICT DO NOTHING;

  RETURN v_enrolment;
END;
$fn$;

REVOKE ALL ON FUNCTION s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION s1_bootcamp_enrol(uuid,text,integer,text,text,text,text,text)
  FROM anon, authenticated;

COMMIT;
