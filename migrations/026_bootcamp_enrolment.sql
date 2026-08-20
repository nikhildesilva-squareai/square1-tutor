-- Migration: Enrolment — offers that expire, and a payment ledger
-- Description: S3. Payment happens ON ACCEPTANCE (single payment or the first of
--              three), not as a deposit. Decided 2026-08-21.
-- Created: 2026-08-21
--
-- WHY OFFERS MUST EXPIRE
--
-- Dropping the deposit means acceptance itself is what holds a seat. Without an
-- expiry, an accepted applicant who never pays holds one of fifty seats forever,
-- and the cap quietly fills with people who are not coming. The seat cap is the
-- product — one instructor per fifty students — so it has to be defended from
-- indifference as well as from over-acceptance.
--
-- Seven days, never past the application close date, never past the cohort start.
-- Expiry is a STATUS, not a deletion: the row stays so the desk can see what
-- happened and offer the seat to the next person with a reason.
--
-- WHY A PAYMENT LEDGER AND NOT A COLUMN
--
-- bootcamp_enrollments already carries amount_paid_cents, which is fine as a
-- running total. It cannot answer "which charge, when, under what reference, and
-- did it later reverse" — and that is exactly what a chargeback, a refund or a
-- failed second instalment asks. One row per charge, provider-agnostic, so the
-- Stripe integration arriving next week is a new `provider` value and a webhook
-- rather than a schema change.
--
-- `provider = 'manual'` is deliberate and permanent, not scaffolding. Cohort 1
-- runs concierge (PRD S10); a bank transfer marked paid by hand must be as real
-- as a card charge, and must leave the same audit trail.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

-- ─────────────────────────────────────────────────────────────────────────────
-- Offers
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bootcamp_applications
  ADD COLUMN IF NOT EXISTS offer_expires_at timestamptz;

-- 'expired' joins the status vocabulary. Rebuilt rather than added to, because a
-- CHECK constraint cannot be extended in place.
ALTER TABLE bootcamp_applications
  DROP CONSTRAINT IF EXISTS bootcamp_applications_status_valid;
ALTER TABLE bootcamp_applications
  ADD CONSTRAINT bootcamp_applications_status_valid
  CHECK (status IN ('submitted', 'assessed', 'accepted', 'waitlisted',
                    'rejected', 'withdrawn', 'deferred', 'expired'));

-- An accepted application must always carry a deadline. Anything else is a seat
-- held open by nobody's decision.
ALTER TABLE bootcamp_applications
  DROP CONSTRAINT IF EXISTS bootcamp_applications_offer_has_deadline;
ALTER TABLE bootcamp_applications
  ADD CONSTRAINT bootcamp_applications_offer_has_deadline
  CHECK (status <> 'accepted' OR offer_expires_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_bootcamp_applications_expiring
  ON bootcamp_applications(offer_expires_at)
  WHERE status = 'accepted';

COMMENT ON COLUMN bootcamp_applications.offer_expires_at IS
  'When an acceptance stops holding a seat. Required for status=accepted: with no deposit, acceptance IS the hold, so an offer with no deadline blocks a seat forever.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Payment ledger
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bootcamp_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES bootcamp_applications(id) ON DELETE RESTRICT,
  bootcamp_enrollment_id uuid REFERENCES bootcamp_enrollments(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,

  provider text NOT NULL DEFAULT 'manual',
  -- Stripe's payment_intent id, a bank reference, whatever identifies the money.
  provider_ref text,

  plan text NOT NULL,
  -- 1 for pay-in-full; 1..3 for the three-part plan.
  instalment int NOT NULL DEFAULT 1,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  region text NOT NULL,

  status text NOT NULL DEFAULT 'paid',
  paid_at timestamptz NOT NULL DEFAULT NOW(),
  refunded_at timestamptz,
  note text,
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bootcamp_payments_plan_valid   CHECK (plan IN ('full', 'three_part')),
  CONSTRAINT bootcamp_payments_status_valid CHECK (status IN ('paid', 'refunded', 'failed')),
  CONSTRAINT bootcamp_payments_region_valid CHECK (region IN ('global', 'south_asia')),
  CONSTRAINT bootcamp_payments_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT bootcamp_payments_instalment_range CHECK (instalment BETWEEN 1 AND 3),
  -- The same charge must not land twice. Stripe retries webhooks; so do humans
  -- with a "mark paid" button and a slow connection.
  CONSTRAINT bootcamp_payments_no_duplicate_instalment
    UNIQUE (application_id, instalment)
);

CREATE INDEX IF NOT EXISTS idx_bootcamp_payments_application ON bootcamp_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_payments_enrollment  ON bootcamp_payments(bootcamp_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_payments_provider_ref ON bootcamp_payments(provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

ALTER TABLE bootcamp_payments ENABLE ROW LEVEL SECURITY;

-- Students may READ their own payments — "what have I actually paid" is a fair
-- question and the answer is theirs. Nobody may write: money is recorded by the
-- server from a provider webhook or a desk action, never by the payer.
DROP POLICY IF EXISTS bootcamp_payments_select_own ON bootcamp_payments;
CREATE POLICY bootcamp_payments_select_own ON bootcamp_payments
  FOR SELECT TO authenticated
  USING (student_id = public.s1_student_id());

REVOKE ALL ON bootcamp_payments FROM anon, authenticated;
GRANT SELECT ON bootcamp_payments TO authenticated;

COMMENT ON TABLE bootcamp_payments IS
  'One row per charge. amount_paid_cents on bootcamp_enrollments is a running total; this answers which charge, when, under what reference, and whether it reversed — the questions a chargeback or a failed instalment actually asks. provider=manual is permanent, not scaffolding: Cohort 1 runs concierge and a bank transfer must be as real as a card charge.';
COMMENT ON COLUMN bootcamp_payments.instalment IS
  '1 for pay-in-full; 1..3 for the three-part plan. UNIQUE with application_id so a retried webhook or a double-clicked desk button cannot double-charge the ledger.';
