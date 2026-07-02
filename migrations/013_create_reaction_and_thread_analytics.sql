-- Reaction Analytics (Issue #16)

-- Aggregate reaction statistics per message
CREATE TABLE reaction_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  total_count INT DEFAULT 0,
  unique_reactors INT DEFAULT 0, -- How many different users reacted
  popular_rank INT, -- Ranking of this emoji for this message
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_message_emoji UNIQUE(message_id, emoji)
);

CREATE INDEX idx_reaction_analytics_message_id ON reaction_analytics(message_id);
CREATE INDEX idx_reaction_analytics_emoji ON reaction_analytics(emoji);
CREATE INDEX idx_reaction_analytics_popular_rank ON reaction_analytics(popular_rank) WHERE popular_rank IS NOT NULL;

-- Member reaction preferences (what emojis each member uses)
CREATE TABLE member_reaction_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  usage_count INT DEFAULT 0, -- Total times this member used this emoji
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_member_emoji UNIQUE(community_id, member_id, emoji)
);

CREATE INDEX idx_member_reaction_prefs_community_id ON member_reaction_preferences(community_id);
CREATE INDEX idx_member_reaction_prefs_member_id ON member_reaction_preferences(member_id);
CREATE INDEX idx_member_reaction_prefs_emoji ON member_reaction_preferences(emoji);
CREATE INDEX idx_member_reaction_prefs_usage_count ON member_reaction_preferences(usage_count DESC);

-- Global emoji statistics per community
CREATE TABLE community_emoji_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  total_usage INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_community_emoji UNIQUE(community_id, emoji)
);

CREATE INDEX idx_community_emoji_stats_community_id ON community_emoji_statistics(community_id);
CREATE INDEX idx_community_emoji_stats_total_usage ON community_emoji_statistics(total_usage DESC);
CREATE INDEX idx_community_emoji_stats_last_used ON community_emoji_statistics(last_used_at DESC);

-- Thread Analytics (Issue #17)

-- Message thread metrics
CREATE TABLE thread_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  total_replies INT DEFAULT 0,
  unique_responders INT DEFAULT 0, -- How many different users replied
  thread_depth INT DEFAULT 0, -- Longest chain of consecutive replies
  max_reply_depth INT DEFAULT 0, -- Deepest nested reply
  total_reactions INT DEFAULT 0,
  total_views INT DEFAULT 0, -- Views to thread (if tracking)
  first_reply_at TIMESTAMPTZ, -- When first reply was posted
  last_reply_at TIMESTAMPTZ,
  avg_response_time_minutes INT, -- Average minutes between consecutive replies
  median_response_time_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_message_thread_analytics UNIQUE(message_id)
);

CREATE INDEX idx_thread_analytics_message_id ON thread_analytics(message_id);
CREATE INDEX idx_thread_analytics_community_id ON thread_analytics(community_id);
CREATE INDEX idx_thread_analytics_total_replies ON thread_analytics(total_replies DESC);
CREATE INDEX idx_thread_analytics_unique_responders ON thread_analytics(unique_responders DESC);
CREATE INDEX idx_thread_analytics_thread_depth ON thread_analytics(thread_depth DESC);
CREATE INDEX idx_thread_analytics_updated_at ON thread_analytics(updated_at DESC);

-- Member engagement in threads
CREATE TABLE member_thread_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  reply_count INT DEFAULT 0, -- How many replies this member made
  reaction_count INT DEFAULT 0,
  first_reply_at TIMESTAMPTZ,
  last_engagement_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_member_thread_engagement UNIQUE(message_id, member_id)
);

CREATE INDEX idx_member_thread_engagement_message_id ON member_thread_engagement(message_id);
CREATE INDEX idx_member_thread_engagement_member_id ON member_thread_engagement(member_id);
CREATE INDEX idx_member_thread_engagement_reply_count ON member_thread_engagement(reply_count DESC);

-- Thread response time tracking
CREATE TABLE thread_response_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  reply_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  response_time_minutes INT NOT NULL, -- Minutes between parent and this reply
  responder_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_reply_response_time UNIQUE(message_id, reply_id)
);

CREATE INDEX idx_thread_response_times_message_id ON thread_response_times(message_id);
CREATE INDEX idx_thread_response_times_response_time ON thread_response_times(response_time_minutes);
CREATE INDEX idx_thread_response_times_responder_id ON thread_response_times(responder_id);

-- Update triggers for analytics tables
CREATE OR REPLACE FUNCTION update_reaction_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reaction_analytics_update_trigger
BEFORE UPDATE ON reaction_analytics
FOR EACH ROW
EXECUTE FUNCTION update_reaction_analytics_updated_at();

CREATE OR REPLACE FUNCTION update_member_reaction_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER member_reaction_prefs_update_trigger
BEFORE UPDATE ON member_reaction_preferences
FOR EACH ROW
EXECUTE FUNCTION update_member_reaction_prefs_updated_at();

CREATE OR REPLACE FUNCTION update_thread_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_analytics_update_trigger
BEFORE UPDATE ON thread_analytics
FOR EACH ROW
EXECUTE FUNCTION update_thread_analytics_updated_at();

-- Auto-update reaction analytics when reactions change
CREATE OR REPLACE FUNCTION update_reaction_analytics()
RETURNS TRIGGER AS $$
DECLARE
  message_rec RECORD;
BEGIN
  -- Get message info
  SELECT id, community_id INTO message_rec FROM community_messages WHERE id = NEW.message_id;

  -- Update or insert reaction analytics
  INSERT INTO reaction_analytics (message_id, emoji, total_count, unique_reactors)
  SELECT
    NEW.message_id,
    NEW.emoji,
    COUNT(*),
    COUNT(DISTINCT user_id)
  FROM message_reactions
  WHERE message_id = NEW.message_id AND emoji = NEW.emoji
  ON CONFLICT (message_id, emoji) DO UPDATE
  SET
    total_count = (SELECT COUNT(*) FROM message_reactions WHERE message_id = NEW.message_id AND emoji = NEW.emoji),
    unique_reactors = (SELECT COUNT(DISTINCT user_id) FROM message_reactions WHERE message_id = NEW.message_id AND emoji = NEW.emoji);

  -- Update member reaction preferences
  INSERT INTO member_reaction_preferences (community_id, member_id, emoji, usage_count)
  VALUES (message_rec.community_id, NEW.user_id, NEW.emoji, 1)
  ON CONFLICT (community_id, member_id, emoji) DO UPDATE
  SET usage_count = usage_count + 1;

  -- Update community emoji statistics
  INSERT INTO community_emoji_statistics (community_id, emoji, total_usage, unique_users, last_used_at)
  SELECT
    message_rec.community_id,
    NEW.emoji,
    COUNT(*),
    COUNT(DISTINCT user_id),
    NOW()
  FROM message_reactions
  WHERE community_id = message_rec.community_id AND emoji = NEW.emoji
  ON CONFLICT (community_id, emoji) DO UPDATE
  SET
    total_usage = (SELECT COUNT(*) FROM message_reactions WHERE community_id = message_rec.community_id AND emoji = NEW.emoji),
    unique_users = (SELECT COUNT(DISTINCT user_id) FROM message_reactions WHERE community_id = message_rec.community_id AND emoji = NEW.emoji),
    last_used_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reaction_analytics_trigger
AFTER INSERT ON message_reactions
FOR EACH ROW
EXECUTE FUNCTION update_reaction_analytics();

-- Auto-update thread analytics when replies are added
CREATE OR REPLACE FUNCTION update_thread_analytics_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_msg RECORD;
  thread_info RECORD;
BEGIN
  -- Get parent message from message_threads
  SELECT parent_message_id INTO parent_msg FROM message_threads WHERE reply_message_id = NEW.id;

  IF parent_msg.parent_message_id IS NOT NULL THEN
    -- Get message community
    SELECT community_id INTO thread_info FROM community_messages WHERE id = parent_msg.parent_message_id;

    -- Insert or update thread analytics
    INSERT INTO thread_analytics (
      message_id, community_id, total_replies, unique_responders,
      first_reply_at, last_reply_at
    )
    SELECT
      parent_msg.parent_message_id,
      thread_info.community_id,
      COUNT(*),
      COUNT(DISTINCT m.posted_by_id),
      MIN(m.created_at),
      MAX(m.created_at)
    FROM message_threads mt
    JOIN community_messages m ON m.id = mt.reply_message_id
    WHERE mt.parent_message_id = parent_msg.parent_message_id
    ON CONFLICT (message_id) DO UPDATE
    SET
      total_replies = (SELECT COUNT(*) FROM message_threads WHERE parent_message_id = parent_msg.parent_message_id),
      unique_responders = (SELECT COUNT(DISTINCT m.posted_by_id) FROM message_threads mt JOIN community_messages m ON m.id = mt.reply_message_id WHERE mt.parent_message_id = parent_msg.parent_message_id),
      last_reply_at = NOW(),
      updated_at = NOW();

    -- Update member engagement
    INSERT INTO member_thread_engagement (message_id, member_id, reply_count, first_reply_at, last_engagement_at)
    VALUES (parent_msg.parent_message_id, NEW.posted_by_id, 1, NEW.created_at, NEW.created_at)
    ON CONFLICT (message_id, member_id) DO UPDATE
    SET
      reply_count = reply_count + 1,
      last_engagement_at = NOW();

    -- Record response time
    INSERT INTO thread_response_times (message_id, reply_id, response_time_minutes, responder_id)
    VALUES (
      parent_msg.parent_message_id,
      NEW.id,
      EXTRACT(EPOCH FROM (NEW.created_at - (SELECT created_at FROM community_messages WHERE id = parent_msg.parent_message_id))) / 60,
      NEW.posted_by_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_analytics_on_reply_trigger
AFTER INSERT ON community_messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_analytics_on_reply();

-- RLS Policies
ALTER TABLE reaction_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_reaction_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_emoji_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_thread_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_response_times ENABLE ROW LEVEL SECURITY;

-- Public can view analytics for public communities
CREATE POLICY "Public view reaction analytics"
  ON reaction_analytics FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM community_messages cm
      JOIN communities c ON c.id = cm.community_id
      WHERE c.visibility = 'public'
    )
  );

CREATE POLICY "Members view reaction analytics"
  ON reaction_analytics FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM community_messages cm
      JOIN community_members cmem ON cmem.community_id = cm.community_id
      WHERE cmem.user_id = auth.uid()
    )
  );

-- Similar policies for other analytics tables
CREATE POLICY "Public view community emoji statistics"
  ON community_emoji_statistics FOR SELECT
  USING (
    community_id IN (
      SELECT id FROM communities WHERE visibility = 'public'
    )
  );

CREATE POLICY "Members view community emoji statistics"
  ON community_emoji_statistics FOR SELECT
  USING (
    community_id IN (
      SELECT cm.community_id FROM community_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Public view thread analytics"
  ON thread_analytics FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM community_messages cm
      JOIN communities c ON c.id = cm.community_id
      WHERE c.visibility = 'public'
    )
  );

CREATE POLICY "Members view thread analytics"
  ON thread_analytics FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM community_messages cm
      JOIN community_members cmem ON cmem.community_id = cm.community_id
      WHERE cmem.user_id = auth.uid()
    )
  );
