-- ============================================================================
-- Migration Patch: Fix RLS Policy for Student Join Class
-- Purpose: Allow students to INSERT into class_students when joining class
-- Date: 2026-02-14
-- ============================================================================

-- This migration adds a missing RLS policy that allows students to join classes
-- via the join code. Without this, students get 406 error when trying to join.

-- Drop existing policy if it exists (to make migration idempotent)
DROP POLICY IF EXISTS "Students can join classes" ON class_students;

-- Create new policy allowing students to INSERT their own memberships
CREATE POLICY "Students can join classes"
  ON class_students FOR INSERT
  WITH CHECK (
    -- Student can only add themselves
    student_id = auth.uid() AND
    -- Must be a student role
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'student') AND
    -- Verify class exists and is active (joinable)
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND status = 'active'
    )
  );

-- Verify policies
DO $$
BEGIN
  RAISE NOTICE 'RLS Policy "Students can join classes" created successfully';
END $$;
