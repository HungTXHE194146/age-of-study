-- SQL commands to run in Supabase SQL Editor

-- 1. Add is_blocked column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- 2. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON public.profiles(is_blocked);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.profiles.is_blocked IS 'Indicates if the user account is blocked by admin';

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_blocked';
