-- Migration: Community "Post" feed (platform-wide student feed)
-- Description: LinkedIn-style feed where members share text + attachments
--              (project / repo / notes / image / video / document), like posts,
--              request to collaborate on repo posts, and follow each other.
-- Created: 2026-07-08
--
-- Mirrors the conventions in 004_create_community_messages.sql:
--   UUID PKs, FKs -> community_profiles(id) ON DELETE CASCADE, soft delete via
--   deleted_at, partial index on the hot path, per-table updated_at trigger,
--   RLS resolving auth.uid() -> community_profiles. Author key is
--   community_profiles.id (NOT auth.users.id).
--
-- Unlike community_messages, posts are NOT scoped to one community — this is a
-- global feed visible to every authenticated member. RLS therefore gates reads
-- on "is authenticated" rather than community membership, which also avoids the
-- community_members RLS recursion fixed in 015/016.
--
-- Apply manually via the Supabase SQL editor (this repo has no migration runner).

-- ─── Posts ────────────────────────────────────────────────────────────────────
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  text TEXT DEFAULT NULL,               -- may be empty when the post is attachment-only
  edited_at TIMESTAMPTZ DEFAULT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT post_text_len CHECK (text IS NULL OR char_length(text) <= 5000),
  CONSTRAINT post_no_future_created_at CHECK (created_at <= NOW()),
  CONSTRAINT post_edited_after_created CHECK (edited_at IS NULL OR edited_at >= created_at)
);

CREATE INDEX idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_not_deleted ON community_posts(deleted_at) WHERE deleted_at IS NULL;

-- ─── Attachments (one flexible table for every attachment kind) ───────────────
-- payload JSONB by kind:
--   repo     -> { owner, name, url, description, language, languageColor, stars, forks }
--   notes    -> { topic, course, preview }
--   image    -> { url, name, size }
--   video    -> { url, name, size, length }
--   document -> { url, name, size, mimeType }
--   project  -> { submissionId, title, description, techStack[], score, maxScore, githubUrl, liveUrl }
CREATE TABLE post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_attachment_kind CHECK (kind IN ('project', 'repo', 'notes', 'image', 'video', 'document'))
);

CREATE INDEX idx_post_attachments_post_id ON post_attachments(post_id);

-- ─── Likes ────────────────────────────────────────────────────────────────────
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_duplicate_likes UNIQUE(post_id, profile_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_profile_id ON post_likes(profile_id);

-- ─── Collaboration requests (the repo "Collaborate → Requested" action) ───────
CREATE TABLE post_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_duplicate_collaborations UNIQUE(post_id, profile_id)
);

CREATE INDEX idx_post_collaborations_post_id ON post_collaborations(post_id);

-- ─── Follows (member → member) ────────────────────────────────────────────────
CREATE TABLE community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  following_profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_duplicate_follow UNIQUE(follower_profile_id, following_profile_id),
  CONSTRAINT no_self_follow CHECK (follower_profile_id <> following_profile_id)
);

CREATE INDEX idx_community_follows_follower ON community_follows(follower_profile_id);
CREATE INDEX idx_community_follows_following ON community_follows(following_profile_id);

-- ─── updated_at trigger for posts ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_posts_update_trigger
BEFORE UPDATE ON community_posts
FOR EACH ROW
EXECUTE FUNCTION update_community_posts_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;

-- Helper predicate used throughout: the caller's own community_profiles ids.
--   ( X IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) )

-- Posts: any authenticated member can read non-deleted posts; authors see own.
CREATE POLICY "Authenticated members can view posts"
  ON community_posts FOR SELECT
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authors can view their own posts"
  ON community_posts FOR SELECT
  USING (author_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Members can create their own posts"
  ON community_posts FOR INSERT
  WITH CHECK (author_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authors can update their own posts"
  ON community_posts FOR UPDATE
  USING (author_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authors can delete their own posts"
  ON community_posts FOR DELETE
  USING (author_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

-- Attachments: readable with the post; writable only for the author's own posts.
CREATE POLICY "View attachments with post access"
  ON post_attachments FOR SELECT
  USING (post_id IN (SELECT id FROM community_posts));

CREATE POLICY "Create attachments for own posts"
  ON post_attachments FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT id FROM community_posts
      WHERE author_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    )
  );

-- Likes: any authenticated member can read; a user manages only their own likes.
CREATE POLICY "Authenticated members can view likes"
  ON post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can like as themselves"
  ON post_likes FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Members can remove their own likes"
  ON post_likes FOR DELETE
  USING (profile_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

-- Collaborations: same shape as likes.
CREATE POLICY "Authenticated members can view collaborations"
  ON post_collaborations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can request collaboration as themselves"
  ON post_collaborations FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Members can withdraw their own collaboration"
  ON post_collaborations FOR DELETE
  USING (profile_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

-- Follows: any authenticated member can read (for counts); a user manages only
-- follows where they are the follower.
CREATE POLICY "Authenticated members can view follows"
  ON community_follows FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can follow as themselves"
  ON community_follows FOR INSERT
  WITH CHECK (follower_profile_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Members can unfollow as themselves"
  ON community_follows FOR DELETE
  USING (follower_profile_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()));

-- ─── Realtime (optional, off by default) ──────────────────────────────────────
-- To make the feed update live, add the table to the realtime publication:
--   ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
-- The v1 UI does not depend on this — it refetches after mutations.
