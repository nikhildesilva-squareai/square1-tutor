-- Migration: Tuition is a single payment
-- Description: The three-part plan is removed. Created: 2026-08-21.
--
-- WHY THE DATABASE AND NOT ONLY THE CODE
--
-- The product now takes one payment and nothing after it. Leaving 'three_part'
-- legal in the schema would leave a shape the application can no longer produce
-- but the database would still accept — and the next person reading these tables
-- would reasonably conclude instalments exist. A constraint that permits states
-- the product cannot reach is a lie told to whoever comes next.
--
-- Safe to tighten: both tables are empty. If instalments ever return, this is one
-- ALTER in each direction, and migration 027's partial unique index over PAID
-- rows already carries the "one paid row per instalment" guarantee they need.
--
-- WHAT THIS DELETES ALONG WITH THE PLAN
--
-- Instalment scheduling, reminder mail, dunning, and suspension-for-non-payment.
-- Not "handled" — gone. A single charge cannot be missed later, so there is no
-- later to miss. The remaining reason an enrolled student can carry a balance is
-- the settlement region check in the Stripe webhook, which makes any non-zero
-- balance a signal worth a human looking at rather than routine bookkeeping.
--
-- The cost, stated plainly: $441 up front can be a month's salary for exactly the
-- career-switcher the regional rate exists for. The regional price is the answer
-- to that, and it is now the only answer we offer.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

BEGIN;

ALTER TABLE bootcamp_enrollments
  DROP CONSTRAINT IF EXISTS bootcamp_enrollments_plan_valid;
ALTER TABLE bootcamp_enrollments
  ADD CONSTRAINT bootcamp_enrollments_plan_valid
  CHECK (payment_plan = 'full');

ALTER TABLE bootcamp_payments
  DROP CONSTRAINT IF EXISTS bootcamp_payments_plan_valid;
ALTER TABLE bootcamp_payments
  ADD CONSTRAINT bootcamp_payments_plan_valid
  CHECK (plan = 'full');

-- One charge means instalment is always 1. The 1..3 range would otherwise stay
-- as the last trace of a plan nobody can buy.
ALTER TABLE bootcamp_payments
  DROP CONSTRAINT IF EXISTS bootcamp_payments_instalment_range;
ALTER TABLE bootcamp_payments
  ADD CONSTRAINT bootcamp_payments_instalment_range
  CHECK (instalment = 1);

COMMENT ON COLUMN bootcamp_enrollments.payment_plan IS
  'Always ''full''. Tuition is a single payment; the three-part plan was removed 2026-08-21.';

COMMIT;
