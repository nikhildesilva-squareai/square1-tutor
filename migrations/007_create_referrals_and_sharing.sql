-- Community Referrals & Sharing Tracking
CREATE TABLE community_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_profile_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL, -- Unique code for tracking
  share_channel TEXT NOT NULL, -- 'whatsapp', 'linkedin', 'facebook', 'twitter', 'email', 'direct_link'
  share_message TEXT DEFAULT NULL, -- Custom message shared
  clicked_at TIMESTAMPTZ DEFAULT NULL,
  joined_at TIMESTAMPTZ DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'clicked', 'joined'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_share_channel CHECK (share_channel IN ('whatsapp', 'linkedin', 'facebook', 'twitter', 'email', 'direct_link')),
  CONSTRAINT valid_referral_status CHECK (status IN ('pending', 'clicked', 'joined')),
  CONSTRAINT unique_referral_code UNIQUE(referral_code)
);

CREATE INDEX idx_community_referrals_community_id ON community_referrals(community_id);
CREATE INDEX idx_community_referrals_referrer_id ON community_referrals(referrer_id);
CREATE INDEX idx_community_referrals_status ON community_referrals(status);
CREATE INDEX idx_community_referrals_share_channel ON community_referrals(share_channel);
CREATE INDEX idx_community_referrals_created_at ON community_referrals(created_at DESC);

-- Social Share Analytics
CREATE TABLE community_share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  share_channel TEXT NOT NULL,
  total_shares INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,
  last_shared_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_channel CHECK (share_channel IN ('whatsapp', 'linkedin', 'facebook', 'twitter', 'email', 'direct_link')),
  CONSTRAINT unique_community_channel UNIQUE(community_id, share_channel)
);

CREATE INDEX idx_community_share_analytics_community_id ON community_share_analytics(community_id);

-- Community Recommendations (based on user interests, enrollments, skills)
CREATE TABLE community_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'enrollment_match', 'skill_match', 'peer_connection', 'trending'
  relevance_score FLOAT NOT NULL, -- 0-1 score
  dismissed_at TIMESTAMPTZ DEFAULT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NULL,
  joined_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_reason CHECK (reason IN ('enrollment_match', 'skill_match', 'peer_connection', 'trending')),
  CONSTRAINT score_range CHECK (relevance_score >= 0 AND relevance_score <= 1),
  CONSTRAINT unique_recommendation UNIQUE(user_id, community_id)
);

CREATE INDEX idx_community_recommendations_user_id ON community_recommendations(user_id);
CREATE INDEX idx_community_recommendations_community_id ON community_recommendations(community_id);
CREATE INDEX idx_community_recommendations_dismissed_at ON community_recommendations(dismissed_at) WHERE dismissed_at IS NULL;
CREATE INDEX idx_community_recommendations_relevance ON community_recommendations(relevance_score DESC);

-- Referral Program Settings
CREATE TABLE referral_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL UNIQUE REFERENCES communities(id) ON DELETE CASCADE,
  referral_enabled BOOLEAN DEFAULT TRUE,
  max_referrals INT DEFAULT NULL, -- NULL = unlimited
  reward_for_referrer TEXT DEFAULT NULL, -- 'badge', 'special_role', 'featured', 'none'
  reward_for_referee TEXT DEFAULT NULL, -- 'welcome_message', 'featured', 'none'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_program_settings_community_id ON referral_program_settings(community_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_community_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_referrals_update_trigger
BEFORE UPDATE ON community_referrals
FOR EACH ROW
EXECUTE FUNCTION update_community_referrals_updated_at();

CREATE TRIGGER community_share_analytics_update_trigger
BEFORE UPDATE ON community_share_analytics
FOR EACH ROW
EXECUTE FUNCTION update_community_share_analytics_updated_at();

CREATE OR REPLACE FUNCTION update_community_share_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER referral_program_settings_update_trigger
BEFORE UPDATE ON referral_program_settings
FOR EACH ROW
EXECUTE FUNCTION update_referral_program_settings_updated_at();

CREATE OR REPLACE FUNCTION update_referral_program_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE community_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_share_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_program_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals
CREATE POLICY "Users can view their referrals"
  ON community_referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Service role can insert referrals
CREATE POLICY "Service role can create referrals"
  ON community_referrals FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Anyone can view share analytics for public data
CREATE POLICY "Public share analytics visible"
  ON community_share_analytics FOR SELECT
  USING (true);

-- Founders can update analytics
CREATE POLICY "Founders can update analytics"
  ON community_share_analytics FOR UPDATE
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Users can view recommendations for themselves
CREATE POLICY "Users view own recommendations"
  ON community_recommendations FOR SELECT
  USING (user_id = auth.uid());

-- Service role can create recommendations
CREATE POLICY "Service role creates recommendations"
  ON community_recommendations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users can update their own recommendations (dismiss/view)
CREATE POLICY "Users can update own recommendations"
  ON community_recommendations FOR UPDATE
  USING (user_id = auth.uid());

-- Founders can view referral settings
CREATE POLICY "Founders view referral settings"
  ON referral_program_settings FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Founders update referral settings
CREATE POLICY "Founders update referral settings"
  ON referral_program_settings FOR UPDATE
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );
