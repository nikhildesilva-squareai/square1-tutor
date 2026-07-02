-- Moderation Flags
CREATE TABLE moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  flagged_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if AI flagged
  flag_reason TEXT NOT NULL, -- 'spam', 'harassment', 'misinformation', 'offtopic', 'other'
  ai_confidence FLOAT DEFAULT NULL, -- 0-1 confidence from Claude
  ai_explanation TEXT DEFAULT NULL, -- Why Claude flagged it
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'actioned'
  reviewer_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL, -- Community founder/mod who reviewed
  reviewer_action TEXT DEFAULT NULL, -- 'approved', 'deleted', 'warned_author', 'dismissed'
  reviewer_notes TEXT DEFAULT NULL,
  escalated_to_square1 BOOLEAN DEFAULT FALSE,
  square1_reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  square1_action TEXT DEFAULT NULL, -- 'approved', 'deleted', 'banned_user', 'banned_community'
  square1_notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  escalated_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_flag_reason CHECK (flag_reason IN ('spam', 'harassment', 'misinformation', 'offtopic', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  CONSTRAINT valid_reviewer_action CHECK (reviewer_action IS NULL OR reviewer_action IN ('approved', 'deleted', 'warned_author', 'dismissed')),
  CONSTRAINT valid_square1_action CHECK (square1_action IS NULL OR square1_action IN ('approved', 'deleted', 'banned_user', 'banned_community')),
  CONSTRAINT confidence_range CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1))
);

CREATE INDEX idx_moderation_flags_community_id ON moderation_flags(community_id);
CREATE INDEX idx_moderation_flags_message_id ON moderation_flags(message_id);
CREATE INDEX idx_moderation_flags_author_id ON moderation_flags(author_id);
CREATE INDEX idx_moderation_flags_status ON moderation_flags(status);
CREATE INDEX idx_moderation_flags_created_at ON moderation_flags(created_at DESC);
CREATE INDEX idx_moderation_flags_pending ON moderation_flags(status, community_id) WHERE status = 'pending';

-- Community Moderation Settings
CREATE TABLE community_moderation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL UNIQUE REFERENCES communities(id) ON DELETE CASCADE,
  auto_flag_enabled BOOLEAN DEFAULT TRUE,
  auto_delete_on_confidence FLOAT DEFAULT 0.95, -- Auto-delete if confidence > 95%
  require_founder_review BOOLEAN DEFAULT TRUE, -- Founder must review before action
  notify_author_on_flag BOOLEAN DEFAULT TRUE,
  banned_user_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Users banned from community
  banned_keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords that auto-flag
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_moderation_settings_community_id ON community_moderation_settings(community_id);

-- Moderation Activity Log
CREATE TABLE moderation_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES moderation_flags(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL, -- Founder or Square 1 admin
  action TEXT NOT NULL, -- 'flag_created', 'reviewed', 'escalated', 'actioned'
  details JSONB DEFAULT NULL, -- Arbitrary action details
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_activity_log_community_id ON moderation_activity_log(community_id);
CREATE INDEX idx_moderation_activity_log_created_at ON moderation_activity_log(created_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_moderation_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moderation_flags_update_trigger
BEFORE UPDATE ON moderation_flags
FOR EACH ROW
EXECUTE FUNCTION update_moderation_flags_updated_at();

CREATE TRIGGER community_moderation_settings_update_trigger
BEFORE UPDATE ON community_moderation_settings
FOR EACH ROW
EXECUTE FUNCTION update_community_moderation_settings_updated_at();

CREATE OR REPLACE FUNCTION update_community_moderation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_activity_log ENABLE ROW LEVEL SECURITY;

-- Community founders can view and review flags in their community
CREATE POLICY "Founders can view and review flags"
  ON moderation_flags FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Founders can update flag status and reviewer actions
CREATE POLICY "Founders can review flags in their community"
  ON moderation_flags FOR UPDATE
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Service role can insert flags (for AI moderation)
CREATE POLICY "Service role creates flags"
  ON moderation_flags FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Moderation settings visible to community founders
CREATE POLICY "Founders can view moderation settings"
  ON community_moderation_settings FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Founders can update their moderation settings
CREATE POLICY "Founders can update moderation settings"
  ON community_moderation_settings FOR UPDATE
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Activity log visible to founders
CREATE POLICY "Founders can view moderation activity"
  ON moderation_activity_log FOR SELECT
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );
