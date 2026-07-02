-- Message Threads (replies to specific messages)
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  reply_message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  reply_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_thread CHECK (parent_message_id != reply_message_id),
  CONSTRAINT unique_thread UNIQUE(parent_message_id, reply_message_id)
);

CREATE INDEX idx_message_threads_parent_message_id ON message_threads(parent_message_id);
CREATE INDEX idx_message_threads_reply_message_id ON message_threads(reply_message_id);
CREATE INDEX idx_message_threads_created_at ON message_threads(created_at);

-- Message Reactions (emoji reactions)
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  reactor_profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- Single emoji or emoji code (e.g., '👍', ':+1:', '❤️')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_reaction UNIQUE(message_id, reactor_profile_id, emoji)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_reactor_profile_id ON message_reactions(reactor_profile_id);
CREATE INDEX idx_message_reactions_emoji ON message_reactions(emoji);
CREATE INDEX idx_message_reactions_created_at ON message_reactions(created_at DESC);

-- Reaction Aggregates (for faster querying)
CREATE TABLE message_reaction_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL UNIQUE REFERENCES community_messages(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  reactor_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Store up to first 10 reactors
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT count_positive CHECK (count >= 0)
);

CREATE INDEX idx_message_reaction_counts_message_id ON message_reaction_counts(message_id);
CREATE INDEX idx_message_reaction_counts_emoji ON message_reaction_counts(emoji);

-- Thread Reply Count Cache
CREATE TABLE message_thread_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id UUID NOT NULL UNIQUE REFERENCES community_messages(id) ON DELETE CASCADE,
  reply_count INT NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT NULL,
  last_replier_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reply_count_positive CHECK (reply_count >= 0)
);

CREATE INDEX idx_message_thread_counts_parent_message_id ON message_thread_counts(parent_message_id);
CREATE INDEX idx_message_thread_counts_last_reply_at ON message_thread_counts(last_reply_at DESC);

-- Thread Subscription (user watching a thread for notifications)
CREATE TABLE thread_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  subscriber_profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_subscription UNIQUE(parent_message_id, subscriber_profile_id)
);

CREATE INDEX idx_thread_subscriptions_parent_message_id ON thread_subscriptions(parent_message_id);
CREATE INDEX idx_thread_subscriptions_subscriber_profile_id ON thread_subscriptions(subscriber_profile_id);

-- Update triggers for reaction counts
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
DECLARE
  emoji_text TEXT;
  reaction_count INT;
  reactor_ids_array UUID[];
BEGIN
  emoji_text := NEW.emoji;

  -- Count reactions for this emoji
  SELECT COUNT(*), ARRAY_AGG(reactor_profile_id ORDER BY created_at DESC LIMIT 10)
  INTO reaction_count, reactor_ids_array
  FROM message_reactions
  WHERE message_id = NEW.message_id AND emoji = emoji_text;

  -- Update or insert count
  INSERT INTO message_reaction_counts (message_id, emoji, count, reactor_ids)
  VALUES (NEW.message_id, emoji_text, reaction_count, reactor_ids_array)
  ON CONFLICT (message_id, emoji) DO UPDATE SET
    count = reaction_count,
    reactor_ids = reactor_ids_array,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reaction_count_on_insert
AFTER INSERT ON message_reactions
FOR EACH ROW
EXECUTE FUNCTION update_reaction_count();

CREATE TRIGGER update_reaction_count_on_delete
AFTER DELETE ON message_reactions
FOR EACH ROW
WHEN (OLD.message_id IS NOT NULL)
EXECUTE FUNCTION update_reaction_count();

-- Update triggers for thread counts
CREATE OR REPLACE FUNCTION update_thread_count()
RETURNS TRIGGER AS $$
DECLARE
  reply_cnt INT;
  last_reply_ts TIMESTAMPTZ;
  last_replier UUID;
BEGIN
  -- Count replies to this thread
  SELECT COUNT(*), MAX(cm.created_at), cm.author_id
  INTO reply_cnt, last_reply_ts, last_replier
  FROM message_threads mt
  JOIN community_messages cm ON cm.id = mt.reply_message_id
  WHERE mt.parent_message_id = NEW.parent_message_id
  GROUP BY cm.author_id
  ORDER BY MAX(cm.created_at) DESC
  LIMIT 1;

  -- Update or insert count
  INSERT INTO message_thread_counts (parent_message_id, reply_count, last_reply_at, last_replier_id)
  VALUES (NEW.parent_message_id, COALESCE(reply_cnt, 0), last_reply_ts, last_replier)
  ON CONFLICT (parent_message_id) DO UPDATE SET
    reply_count = COALESCE(reply_cnt, 0),
    last_reply_at = last_reply_ts,
    last_replier_id = last_replier,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_count_on_insert
AFTER INSERT ON message_threads
FOR EACH ROW
EXECUTE FUNCTION update_thread_count();

CREATE TRIGGER update_thread_count_on_delete
AFTER DELETE ON message_threads
FOR EACH ROW
WHEN (OLD.parent_message_id IS NOT NULL)
EXECUTE FUNCTION update_thread_count();

CREATE OR REPLACE FUNCTION update_message_thread_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_thread_counts_update_trigger
BEFORE UPDATE ON message_thread_counts
FOR EACH ROW
EXECUTE FUNCTION update_message_thread_counts_updated_at();

CREATE OR REPLACE FUNCTION update_message_reaction_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_reaction_counts_update_trigger
BEFORE UPDATE ON message_reaction_counts
FOR EACH ROW
EXECUTE FUNCTION update_message_reaction_counts_updated_at();

-- RLS Policies
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reaction_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_thread_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can view threads
CREATE POLICY "Public view message threads"
  ON message_threads FOR SELECT
  USING (true);

-- Community members can create threads (replies)
CREATE POLICY "Members create threads"
  ON message_threads FOR INSERT
  WITH CHECK (
    reply_message_id IN (
      SELECT cm.id FROM community_messages cm
      INNER JOIN community_members cmem ON cmem.community_id = cm.community_id
      INNER JOIN community_profiles cp ON cp.id = cmem.profile_id
      WHERE cp.user_id = auth.uid() AND cmem.is_muted = FALSE
    )
  );

-- Public can view reactions
CREATE POLICY "Public view message reactions"
  ON message_reactions FOR SELECT
  USING (true);

-- Users can add reactions
CREATE POLICY "Users add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (
    reactor_profile_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Users can remove own reactions
CREATE POLICY "Users remove own reactions"
  ON message_reactions FOR DELETE
  USING (
    reactor_profile_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Public can view reaction counts
CREATE POLICY "Public view reaction counts"
  ON message_reaction_counts FOR SELECT
  USING (true);

-- Public can view thread counts
CREATE POLICY "Public view thread counts"
  ON message_thread_counts FOR SELECT
  USING (true);

-- Users can manage thread subscriptions
CREATE POLICY "Users manage subscriptions"
  ON thread_subscriptions FOR ALL
  USING (
    subscriber_profile_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );
