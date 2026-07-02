-- Community Monetization Schema (Phase 2 - Issue #18)
-- Handles pricing, subscriptions, payments, and payouts

-- Community monetization settings (creator controls)
CREATE TABLE IF NOT EXISTS community_monetization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL UNIQUE REFERENCES communities(id) ON DELETE CASCADE,
  is_monetized BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT TRUE, -- Can be free OR paid
  monthly_price DECIMAL(10, 2) DEFAULT NULL, -- $1-$999, NULL if free
  annual_price DECIMAL(10, 2) DEFAULT NULL, -- Annual pricing
  currency VARCHAR(3) DEFAULT 'USD',
  allow_free_tier BOOLEAN DEFAULT TRUE, -- Free + Paid tier option
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_pricing CHECK (monthly_price IS NULL OR monthly_price >= 1.00),
  CONSTRAINT valid_annual_pricing CHECK (annual_price IS NULL OR annual_price >= 12.00)
);

CREATE INDEX idx_community_monetization_settings_community_id ON community_monetization_settings(community_id);

-- User subscriptions to communities
CREATE TABLE IF NOT EXISTS community_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('free', 'monthly', 'annual')),
  monthly_price DECIMAL(10, 2), -- Snapshot of price at purchase
  annual_price DECIMAL(10, 2), -- Snapshot of price at purchase
  stripe_subscription_id TEXT, -- Stripe subscription ID for recurring
  stripe_customer_id TEXT, -- Stripe customer ID
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_subscription UNIQUE(community_id, user_id),
  CONSTRAINT stripe_required_for_paid CHECK (
    subscription_type = 'free' OR stripe_subscription_id IS NOT NULL
  )
);

CREATE INDEX idx_community_subscriptions_community_id ON community_subscriptions(community_id);
CREATE INDEX idx_community_subscriptions_user_id ON community_subscriptions(user_id);
CREATE INDEX idx_community_subscriptions_status ON community_subscriptions(status);
CREATE INDEX idx_community_subscriptions_stripe_id ON community_subscriptions(stripe_subscription_id);

-- Transaction records (payments)
CREATE TABLE IF NOT EXISTS community_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL, -- Gross amount (100%)
  platform_fee DECIMAL(10, 2) NOT NULL, -- 10%
  creator_earnings DECIMAL(10, 2) NOT NULL, -- 90%
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'annual')),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_split CHECK (platform_fee + creator_earnings = amount),
  CONSTRAINT valid_creator_split CHECK (creator_earnings = amount * 0.90),
  CONSTRAINT valid_platform_split CHECK (platform_fee = amount * 0.10)
);

CREATE INDEX idx_community_transactions_community_id ON community_transactions(community_id);
CREATE INDEX idx_community_transactions_user_id ON community_transactions(user_id);
CREATE INDEX idx_community_transactions_creator_id ON community_transactions(creator_id);
CREATE INDEX idx_community_transactions_status ON community_transactions(status);
CREATE INDEX idx_community_transactions_created_at ON community_transactions(created_at DESC);

-- Creator payouts (monthly)
CREATE TABLE IF NOT EXISTS community_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  transaction_count INT DEFAULT 0,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_earnings CHECK (total_earnings >= 0),
  CONSTRAINT unique_payout_period UNIQUE(community_id, creator_id, period_start),
  CONSTRAINT minimum_payout CHECK (status = 'pending' OR total_earnings >= 500.00)
);

CREATE INDEX idx_community_payouts_community_id ON community_payouts(community_id);
CREATE INDEX idx_community_payouts_creator_id ON community_payouts(creator_id);
CREATE INDEX idx_community_payouts_status ON community_payouts(status);
CREATE INDEX idx_community_payouts_payout_date ON community_payouts(payout_date DESC);

-- Aggregated earnings view (for dashboards)
CREATE TABLE IF NOT EXISTS community_earnings_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First day of month
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  total_members INT DEFAULT 0,
  paid_members INT DEFAULT 0,
  free_members INT DEFAULT 0,
  new_members INT DEFAULT 0,
  churned_members INT DEFAULT 0,
  mrr DECIMAL(10, 2) DEFAULT 0, -- Monthly Recurring Revenue
  churn_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_month_year UNIQUE(community_id, month_year),
  CONSTRAINT valid_churn CHECK (churn_rate >= 0 AND churn_rate <= 100)
);

CREATE INDEX idx_community_earnings_summary_community_id ON community_earnings_summary(community_id);
CREATE INDEX idx_community_earnings_summary_month_year ON community_earnings_summary(month_year DESC);

-- Update triggers
CREATE OR REPLACE FUNCTION update_community_monetization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_monetization_settings_update_trigger
BEFORE UPDATE ON community_monetization_settings
FOR EACH ROW
EXECUTE FUNCTION update_community_monetization_settings_updated_at();

CREATE TRIGGER community_subscriptions_update_trigger
BEFORE UPDATE ON community_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_community_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_community_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_transactions_update_trigger
BEFORE UPDATE ON community_transactions
FOR EACH ROW
EXECUTE FUNCTION update_community_transactions_updated_at();

CREATE OR REPLACE FUNCTION update_community_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_payouts_update_trigger
BEFORE UPDATE ON community_payouts
FOR EACH ROW
EXECUTE FUNCTION update_community_payouts_updated_at();

CREATE OR REPLACE FUNCTION update_community_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_earnings_summary_update_trigger
BEFORE UPDATE ON community_earnings_summary
FOR EACH ROW
EXECUTE FUNCTION update_community_earnings_summary_updated_at();

CREATE OR REPLACE FUNCTION update_community_earnings_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE community_monetization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_earnings_summary ENABLE ROW LEVEL SECURITY;

-- Creators can view their monetization settings
CREATE POLICY "Creators view monetization settings"
  ON community_monetization_settings FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Creators can update their monetization settings
CREATE POLICY "Creators update monetization settings"
  ON community_monetization_settings FOR UPDATE
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Users can view their own subscriptions
CREATE POLICY "Users view own subscriptions"
  ON community_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Creators can view subscriptions to their communities
CREATE POLICY "Creators view community subscriptions"
  ON community_subscriptions FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Users can update their own subscriptions (cancel, etc)
CREATE POLICY "Users update own subscriptions"
  ON community_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- Service role can manage transactions
CREATE POLICY "Service role manages transactions"
  ON community_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Creators can view transactions for their communities
CREATE POLICY "Creators view community transactions"
  ON community_transactions FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Creators can view their payouts
CREATE POLICY "Creators view payouts"
  ON community_payouts FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Service role can manage payouts
CREATE POLICY "Service role manages payouts"
  ON community_payouts FOR ALL
  USING (auth.role() = 'service_role');

-- Creators can view earnings summary for their communities
CREATE POLICY "Creators view earnings summary"
  ON community_earnings_summary FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Service role can manage earnings summary
CREATE POLICY "Service role manages earnings summary"
  ON community_earnings_summary FOR ALL
  USING (auth.role() = 'service_role');
