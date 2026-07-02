-- Add member management fields to community_members
ALTER TABLE community_members
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE,
ADD COLUMN muted_reason TEXT DEFAULT NULL,
ADD COLUMN muted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN muted_by_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL,
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN banned_reason TEXT DEFAULT NULL,
ADD COLUMN banned_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN banned_by_id UUID REFERENCES community_profiles(id) ON DELETE SET NULL,
ADD COLUMN removed_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for efficient queries
CREATE INDEX idx_community_members_is_muted ON community_members(is_muted) WHERE is_muted = TRUE;
CREATE INDEX idx_community_members_is_banned ON community_members(is_banned) WHERE is_banned = TRUE;
CREATE INDEX idx_community_members_role ON community_members(role);

-- Member moderation activity log
CREATE TABLE member_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES community_members(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'role_assigned', 'muted', 'unmuted', 'removed', 'banned', 'unbanned'
  action_details JSONB DEFAULT NULL, -- e.g., {previous_role: 'member', new_role: 'moderator'}
  reason TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_moderation_log_community_id ON member_moderation_log(community_id);
CREATE INDEX idx_member_moderation_log_member_id ON member_moderation_log(member_id);
CREATE INDEX idx_member_moderation_log_created_at ON member_moderation_log(created_at DESC);

-- Add constraints
ALTER TABLE community_members
ADD CONSTRAINT no_message_if_muted CHECK (
  is_muted = FALSE OR removed_at IS NULL
),
ADD CONSTRAINT no_message_if_banned CHECK (
  is_banned = FALSE OR removed_at IS NULL
);

-- Update RLS for community_members to respect muted status
DROP POLICY IF EXISTS "Authors can view their own messages" ON community_messages;

CREATE POLICY "Members can view messages from non-muted authors"
  ON community_messages FOR SELECT
  USING (
    community_id IN (
      SELECT cm.community_id FROM community_members cm
      INNER JOIN community_profiles cp ON cm.profile_id = cp.id
      INNER JOIN auth.users u ON cp.user_id = u.id
      WHERE u.id = auth.uid()
    )
    AND deleted_at IS NULL
    AND author_id NOT IN (
      SELECT profile_id FROM community_members
      WHERE is_muted = TRUE AND is_banned = FALSE
    )
  );

-- Authors can view their own messages (even if muted)
CREATE POLICY "Authors can view their own messages"
  ON community_messages FOR SELECT
  USING (
    author_id IN (
      SELECT id FROM community_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Muted users cannot create messages
DROP POLICY IF EXISTS "Community members can create messages" ON community_messages;

CREATE POLICY "Non-muted members can create messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    author_id IN (
      SELECT cm.profile_id FROM community_members cm
      INNER JOIN community_profiles cp ON cm.profile_id = cp.id
      WHERE cp.user_id = auth.uid() AND cm.is_muted = FALSE AND cm.is_banned = FALSE
    )
  );
