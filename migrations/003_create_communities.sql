-- Migration: Create communities and membership tables
-- Description: Schema for student communities, memberships, and invites
-- Created: 2026-07-02

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('project', 'research', 'company', 'opensource', 'cohort')),
  category TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  creator_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT community_name_length CHECK (char_length(name) <= 60),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- Create indexes on communities
CREATE INDEX idx_communities_creator_id ON communities(creator_id);
CREATE INDEX idx_communities_category ON communities(category);
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_template_type ON communities(template_type);

-- Create community_members table (join table)
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_muted BOOLEAN DEFAULT FALSE,

  UNIQUE(community_id, profile_id),
  CONSTRAINT only_one_creator CHECK (role != 'creator' OR id IS NOT NULL)
);

-- Create indexes on community_members
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_profile_id ON community_members(profile_id);
CREATE INDEX idx_community_members_role ON community_members(community_id, role);
CREATE INDEX idx_community_members_joined_at ON community_members(community_id, joined_at DESC);

-- Create community_invites table (track auto-added vs invited members)
CREATE TABLE IF NOT EXISTS community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES community_profiles(id), -- NULL if auto-seeded
  invite_status TEXT DEFAULT 'auto_added' CHECK (invite_status IN ('auto_added', 'pending', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(community_id, profile_id)
);

-- Create indexes on community_invites
CREATE INDEX idx_community_invites_community_id ON community_invites(community_id);
CREATE INDEX idx_community_invites_profile_id ON community_invites(profile_id);
CREATE INDEX idx_community_invites_status ON community_invites(invite_status);

-- Enable RLS on communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view public communities
CREATE POLICY "Public communities are viewable by everyone" ON communities
  FOR SELECT USING (not is_private OR creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = communities.id
    AND cm.profile_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid())
  ));

-- RLS Policy: Only creator can update their community
CREATE POLICY "Only creator can update community" ON communities
  FOR UPDATE USING (creator_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid()))
  WITH CHECK (creator_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

-- RLS Policy: Only creator can delete their community
CREATE POLICY "Only creator can delete community" ON communities
  FOR DELETE USING (creator_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

-- Enable RLS on community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Members can see other members in their communities
CREATE POLICY "Members can view community members" ON community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm2
      WHERE cm2.community_id = community_members.community_id
      AND cm2.profile_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    )
  );

-- RLS Policy: Only creator/moderators can modify memberships
CREATE POLICY "Only moderators can update memberships" ON community_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.profile_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid())
      AND cm.role IN ('creator', 'moderator')
    )
  );

-- Enable RLS on community_invites
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own invites
CREATE POLICY "Users can view their invites" ON community_invites
  FOR SELECT USING (
    profile_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid())
  );

-- Create trigger to update communities.updated_at
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();

-- Create trigger for soft delete protection
CREATE OR REPLACE FUNCTION prevent_deleted_community_modifications()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT deleted_at FROM communities WHERE id = NEW.community_id) IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify members of deleted community';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_members_prevent_deleted_mods
  BEFORE INSERT OR UPDATE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_deleted_community_modifications();
