-- =============================================================================
-- SUPABASE RLS POLICIES FOR ADMIN DASHBOARD
-- Run this in Supabase SQL Editor to fix edit/block functionality
-- =============================================================================

-- First, ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- =============================================================================
-- SELECT POLICIES (Read Access)
-- =============================================================================

-- Policy 1: Allow all authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- =============================================================================
-- INSERT POLICIES (Create Access)
-- =============================================================================

-- Policy 2: Allow system admins to create new users
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'system_admin'
  )
);

-- Policy 3: Allow users to be created (for signup)
CREATE POLICY "Users can insert own profile"  
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =============================================================================
-- UPDATE POLICIES (Edit Access)
-- =============================================================================

-- Policy 4: System admins can update ANY profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'system_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles  
    WHERE id = auth.uid()
    AND role = 'system_admin'
  )
);

-- Policy 5: Users can update their own profile (except role and is_blocked)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Prevent users from changing their own role or block status
  AND (
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    AND (COALESCE(is_blocked, false) = COALESCE((SELECT is_blocked FROM public.profiles WHERE id = auth.uid()), false))
  )
);

-- =============================================================================
-- DELETE POLICIES (Delete Access) 
-- =============================================================================

-- Policy 6: Only system admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'system_admin'
  )
);

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these to verify policies are created correctly
-- =============================================================================

-- List all policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check current user's role
SELECT id, role, full_name 
FROM public.profiles 
WHERE id = auth.uid();
