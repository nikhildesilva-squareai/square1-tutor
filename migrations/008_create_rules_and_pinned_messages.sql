-- Community Rules (enhanced)
CREATE TABLE IF NOT EXISTS community_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  rule_description TEXT DEFAULT NULL, -- Expanded explanation
  rule_category TEXT DEFAULT 'conduct', -- 'conduct', 'spam', 'respect', 'legal', 'other'
  order_index INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_rule_category CHECK (rule_category IN ('conduct', 'spam', 'respect', 'legal', 'other')),
  CONSTRAINT unique_community_order UNIQUE(community_id, order_index)
);

CREATE INDEX idx_community_rules_community_id ON community_rules(community_id);
CREATE INDEX idx_community_rules_order_index ON community_rules(order_index);

-- Pinned Messages (announcements, important posts)
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  pinned_by_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE SET NULL,
  pin_title TEXT NOT NULL, -- Optional custom title for the pin
  pin_description TEXT DEFAULT NULL, -- Why this message is pinned
  pin_category TEXT DEFAULT 'announcement', -- 'announcement', 'important', 'resource', 'event', 'guide'
  pin_order INT DEFAULT 0, -- Order in pinned list (lower = more important)
  expires_at TIMESTAMPTZ DEFAULT NULL, -- Optional expiry date
  views INT DEFAULT 0, -- Track how many users viewed this pin
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_pin_category CHECK (pin_category IN ('announcement', 'important', 'resource', 'event', 'guide')),
  CONSTRAINT unique_pinned_message UNIQUE(community_id, message_id)
);

CREATE INDEX idx_pinned_messages_community_id ON pinned_messages(community_id);
CREATE INDEX idx_pinned_messages_pin_order ON pinned_messages(pin_order);
CREATE INDEX idx_pinned_messages_pin_category ON pinned_messages(pin_category);
CREATE INDEX idx_pinned_messages_pinned_at ON pinned_messages(pinned_at DESC);
CREATE INDEX idx_pinned_messages_expires_at ON pinned_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Message Topics (organize messages by topic/channel)
CREATE TABLE message_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  topic_description TEXT DEFAULT NULL,
  icon_emoji TEXT DEFAULT '📌',
  color_tag TEXT DEFAULT 'gray', -- 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'
  order_index INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_color_tag CHECK (color_tag IN ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray')),
  CONSTRAINT unique_community_topic UNIQUE(community_id, topic_name)
);

CREATE INDEX idx_message_topics_community_id ON message_topics(community_id);
CREATE INDEX idx_message_topics_order_index ON message_topics(order_index);

-- Message Topic Assignment
CREATE TABLE message_topic_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES message_topics(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_message_topic UNIQUE(message_id, topic_id)
);

CREATE INDEX idx_message_topic_assignments_message_id ON message_topic_assignments(message_id);
CREATE INDEX idx_message_topic_assignments_topic_id ON message_topic_assignments(topic_id);

-- Community Guidelines (rich content for rules explanation)
CREATE TABLE community_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL UNIQUE REFERENCES communities(id) ON DELETE CASCADE,
  header_text TEXT NOT NULL DEFAULT 'Welcome to our community!',
  header_description TEXT DEFAULT NULL,
  footer_text TEXT DEFAULT NULL, -- Links to code of conduct, etc.
  show_rules_on_join BOOLEAN DEFAULT TRUE,
  require_rule_acceptance BOOLEAN DEFAULT FALSE, -- Force users to acknowledge rules
  last_updated_by_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_guidelines_community_id ON community_guidelines(community_id);

-- Pinned Message Views (track which users have seen pinned messages)
CREATE TABLE pinned_message_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pinned_message_id UUID NOT NULL REFERENCES pinned_messages(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_pin_view UNIQUE(pinned_message_id, profile_id)
);

CREATE INDEX idx_pinned_message_views_pinned_message_id ON pinned_message_views(pinned_message_id);
CREATE INDEX idx_pinned_message_views_profile_id ON pinned_message_views(profile_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_community_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_rules_update_trigger
BEFORE UPDATE ON community_rules
FOR EACH ROW
EXECUTE FUNCTION update_community_rules_updated_at();

CREATE OR REPLACE FUNCTION update_pinned_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pinned_messages_update_trigger
BEFORE UPDATE ON pinned_messages
FOR EACH ROW
EXECUTE FUNCTION update_pinned_messages_updated_at();

CREATE OR REPLACE FUNCTION update_message_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_topics_update_trigger
BEFORE UPDATE ON message_topics
FOR EACH ROW
EXECUTE FUNCTION update_message_topics_updated_at();

CREATE OR REPLACE FUNCTION update_community_guidelines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_guidelines_update_trigger
BEFORE UPDATE ON community_guidelines
FOR EACH ROW
EXECUTE FUNCTION update_community_guidelines_updated_at();

-- RLS Policies
ALTER TABLE community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_topic_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_message_views ENABLE ROW LEVEL SECURITY;

-- Public can view active rules
CREATE POLICY "Public view active rules"
  ON community_rules FOR SELECT
  USING (is_active = TRUE);

-- Founders can manage rules
CREATE POLICY "Founders manage rules"
  ON community_rules FOR ALL
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Public can view non-expired pinned messages
CREATE POLICY "Public view pinned messages"
  ON pinned_messages FOR SELECT
  USING (
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Founders can manage pinned messages
CREATE POLICY "Founders manage pinned messages"
  ON pinned_messages FOR ALL
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Public can view topics
CREATE POLICY "Public view message topics"
  ON message_topics FOR SELECT
  USING (is_active = TRUE);

-- Founders can manage topics
CREATE POLICY "Founders manage topics"
  ON message_topics FOR ALL
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Anyone can view topic assignments
CREATE POLICY "Public view topic assignments"
  ON message_topic_assignments FOR SELECT
  USING (true);

-- Public can view guidelines
CREATE POLICY "Public view community guidelines"
  ON community_guidelines FOR SELECT
  USING (true);

-- Founders can update guidelines
CREATE POLICY "Founders update guidelines"
  ON community_guidelines FOR ALL
  USING (
    community_id IN (
      SELECT c.id FROM communities c
      INNER JOIN community_profiles cp ON cp.id = c.creator_id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Users can view and create their own pin views
CREATE POLICY "Users view own pin views"
  ON pinned_message_views FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Service role can track pin views
CREATE POLICY "Service role tracks pin views"
  ON pinned_message_views FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
