-- Migration: Create community_profiles table
-- Description: Auto-created profiles for students participating in communities
-- Created: 2026-07-02

-- Create community_profiles table
CREATE TABLE IF NOT EXISTS community_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  avatar_url TEXT,
  bio TEXT,
  pronouns TEXT,
  location TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_community_profiles_user_id ON community_profiles(user_id);
CREATE INDEX idx_community_profiles_student_id ON community_profiles(student_id);

-- Enable RLS (Row-Level Security)
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view all profiles (public)
CREATE POLICY "Profiles are viewable by everyone" ON community_profiles
  FOR SELECT USING (true);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON community_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Profiles created via service role only (no direct user inserts)
CREATE POLICY "Profiles can only be inserted by service role" ON community_profiles
  FOR INSERT WITH CHECK (false);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_profiles_updated_at
  BEFORE UPDATE ON community_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_community_profiles_updated_at();

-- Migrate existing students (create profiles for all)
INSERT INTO community_profiles (user_id, student_id, created_at)
SELECT s.user_id, s.id, s.created_at
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM community_profiles cp WHERE cp.student_id = s.id
)
ON CONFLICT DO NOTHING;
