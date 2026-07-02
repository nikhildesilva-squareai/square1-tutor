-- Community Messages
CREATE TABLE community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  formatted_content JSONB DEFAULT NULL, -- Stores rich formatting: {blocks: [{type: 'paragraph|code|heading', content: '...', format: {bold: [], italic: [], code: []}}]}
  edited_at TIMESTAMPTZ DEFAULT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT message_content_not_empty CHECK (TRIM(content) != ''),
  CONSTRAINT no_future_created_at CHECK (created_at <= NOW()),
  CONSTRAINT edited_after_created CHECK (edited_at IS NULL OR edited_at >= created_at)
);

CREATE INDEX idx_community_messages_community_id ON community_messages(community_id);
CREATE INDEX idx_community_messages_author_id ON community_messages(author_id);
CREATE INDEX idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX idx_community_messages_not_deleted ON community_messages(deleted_at) WHERE deleted_at IS NULL;

-- Message Attachments (images, files)
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- Supabase storage URL
  file_type TEXT NOT NULL, -- 'image', 'file'
  file_name TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'file'))
);

CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- Message Mentions (@user references)
CREATE TABLE message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  mentioned_profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_duplicate_mentions UNIQUE(message_id, mentioned_profile_id)
);

CREATE INDEX idx_message_mentions_message_id ON message_mentions(message_id);
CREATE INDEX idx_message_mentions_mentioned_profile_id ON message_mentions(mentioned_profile_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_community_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_messages_update_trigger
BEFORE UPDATE ON community_messages
FOR EACH ROW
EXECUTE FUNCTION update_community_messages_updated_at();

-- RLS Policies
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- Community members can view non-deleted messages in their communities
CREATE POLICY "Members can view messages in their community"
  ON community_messages FOR SELECT
  USING (
    community_id IN (
      SELECT cm.community_id FROM community_members cm
      INNER JOIN community_profiles cp ON cm.profile_id = cp.id
      INNER JOIN auth.users u ON cp.user_id = u.id
      WHERE u.id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Authors can view their own messages (even if deleted)
CREATE POLICY "Authors can view their own messages"
  ON community_messages FOR SELECT
  USING (
    author_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Community members can create messages
CREATE POLICY "Members can create messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    author_id IN (
      SELECT cm.profile_id FROM community_members cm
      INNER JOIN community_profiles cp ON cm.profile_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Authors can update their own messages
CREATE POLICY "Authors can edit their own messages"
  ON community_messages FOR UPDATE
  USING (
    author_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Authors can delete their own messages
CREATE POLICY "Authors can delete their own messages"
  ON community_messages FOR DELETE
  USING (
    author_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Attachments RLS
CREATE POLICY "View attachments with message access"
  ON message_attachments FOR SELECT
  USING (
    message_id IN (SELECT id FROM community_messages)
  );

CREATE POLICY "Create attachments for own messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM community_messages
      WHERE author_id IN (
        SELECT id FROM community_profiles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Mentions RLS
CREATE POLICY "View mentions with message access"
  ON message_mentions FOR SELECT
  USING (
    message_id IN (SELECT id FROM community_messages)
  );

CREATE POLICY "Create mentions for own messages"
  ON message_mentions FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM community_messages
      WHERE author_id IN (
        SELECT id FROM community_profiles
        WHERE user_id = auth.uid()
      )
    )
  );
