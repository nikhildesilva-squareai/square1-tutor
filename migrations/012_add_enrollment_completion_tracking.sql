-- Migration: Add enrollment completion tracking
-- Description: Add completed_at timestamp to track when enrollments are marked complete
-- Created: 2026-07-02

-- Add completed_at column to student_enrollments table
ALTER TABLE student_enrollments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on completed_at for efficient dashboard queries
CREATE INDEX IF NOT EXISTS idx_student_enrollments_completed_at
ON student_enrollments(completed_at)
WHERE completed_at IS NOT NULL;

-- Create composite index for common dashboard queries (org_id + completed_at)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_org_completion
ON student_enrollments(org_id, completed_at DESC)
WHERE completed_at IS NOT NULL;

-- Create index for finding incomplete enrollments (for cron job)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_incomplete
ON student_enrollments(status, completed_at)
WHERE status = 'active' AND completed_at IS NULL;
