-- ============================================================================
-- Migration: Add real activity tracking to profiles
-- Purpose: Track when users are last active for dashboard analytics
-- ============================================================================

-- 1. Add last_active_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;

-- 2. Index for efficient "active in last N hours/days" queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at
ON public.profiles(last_active_at)
WHERE last_active_at IS NOT NULL;

-- 3. Backfill: set last_active_at to updated_at for existing users
-- so they don't all show as "never active"
UPDATE public.profiles
SET last_active_at = COALESCE(updated_at, created_at)
WHERE last_active_at IS NULL;

-- 4. Ensure RLS allows users to update their own last_active_at
-- (Most setups already allow self-update on profiles. This is a safe no-op
-- if the policy already exists, or adds it if missing.)
DO $$
BEGIN
  -- Check if a self-update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;
