-- Migration: Add missing INSERT/DELETE policies on community_members
-- Description: community_members had only SELECT and UPDATE policies, so RLS
--   default-denied every membership write from the user-scoped client: the
--   creator auto-add on community creation failed silently, and join/leave
--   never worked (the table was empty in production). Self-service writes get
--   policies here; privileged writes (creator bootstrap, seeding) move to the
--   service-role client in app code.
--   Policies use the SECURITY DEFINER helpers from migration 015 — do not
--   subquery community_members directly or the 42P17 recursion returns.
-- Created: 2026-07-06

-- Helper: the current user's community profile id.
CREATE OR REPLACE FUNCTION public.current_community_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM community_profiles WHERE user_id = auth.uid();
$$;

-- Helper: is the current user the creator of the given community?
-- (Lets a creator rejoin their own private community; also avoids policies
-- subquerying communities, whose own policy subqueries community_members.)
CREATE OR REPLACE FUNCTION public.is_community_creator(p_community_id UUID)
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
      AND c.deleted_at IS NULL
      AND c.creator_id = public.current_community_profile_id()
  );
$$;

-- Users can add themselves (role 'member' only) to public communities, or to
-- a community they created. Elevated roles and seeding are service-role only.
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
CREATE POLICY "Users can join communities" ON community_members
  FOR INSERT WITH CHECK (
    profile_id = public.current_community_profile_id()
    AND role = 'member'
    AND (
      public.is_public_community(community_id)
      OR public.is_community_creator(community_id)
    )
  );

-- Users can remove their own membership (leave); creators/moderators can
-- remove other members.
DROP POLICY IF EXISTS "Members can leave and moderators can remove members" ON community_members;
CREATE POLICY "Members can leave and moderators can remove members" ON community_members
  FOR DELETE USING (
    profile_id = public.current_community_profile_id()
    OR public.is_community_moderator(community_id)
  );
