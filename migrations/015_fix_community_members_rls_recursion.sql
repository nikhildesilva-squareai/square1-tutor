-- Migration: Fix infinite recursion (42P17) in community_members RLS policies
-- Description: The SELECT and UPDATE policies on community_members queried
--   community_members inside their own USING clauses, so any read of the table
--   (including the community_members(count) embed used by GET /api/communities)
--   failed with "infinite recursion detected in policy for relation community_members".
--   Standard fix: move the membership lookup into SECURITY DEFINER helper functions,
--   which bypass RLS and therefore cannot re-trigger the policy.
-- Created: 2026-07-06

-- Helper: is the current user a member of the given community?
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members cm
    JOIN community_profiles cp ON cp.id = cm.profile_id
    WHERE cm.community_id = p_community_id
      AND cp.user_id = auth.uid()
  );
$$;

-- Helper: is the current user a creator/moderator of the given community?
CREATE OR REPLACE FUNCTION public.is_community_moderator(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members cm
    JOIN community_profiles cp ON cp.id = cm.profile_id
    WHERE cm.community_id = p_community_id
      AND cp.user_id = auth.uid()
      AND cm.role IN ('creator', 'moderator')
  );
$$;

-- Helper: is the given community public (and not soft-deleted)?
-- SECURITY DEFINER so policies on community_members can check the parent
-- community without re-entering the communities RLS policy (which itself
-- queries community_members — cross-table recursion).
CREATE OR REPLACE FUNCTION public.is_public_community(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM communities c
    WHERE c.id = p_community_id
      AND c.is_private = FALSE
      AND c.deleted_at IS NULL
  );
$$;

-- Replace the recursive SELECT policy.
-- Membership of public communities is visible to everyone (discovery shows
-- member counts); private communities only to their members.
DROP POLICY IF EXISTS "Members can view community members" ON community_members;
CREATE POLICY "Members can view community members" ON community_members
  FOR SELECT USING (
    public.is_public_community(community_id)
    OR public.is_community_member(community_id)
  );

-- Replace the recursive UPDATE policy.
DROP POLICY IF EXISTS "Only moderators can update memberships" ON community_members;
CREATE POLICY "Only moderators can update memberships" ON community_members
  FOR UPDATE USING (public.is_community_moderator(community_id))
  WITH CHECK (public.is_community_moderator(community_id));

-- De-recurse the communities SELECT policy as well: it queried
-- community_members directly, which now works but is cleaner (and safe from
-- future cross-recursion) through the helper.
DROP POLICY IF EXISTS "Public communities are viewable by everyone" ON communities;
CREATE POLICY "Public communities are viewable by everyone" ON communities
  FOR SELECT USING (
    NOT is_private
    OR creator_id = (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    OR public.is_community_member(id)
  );
