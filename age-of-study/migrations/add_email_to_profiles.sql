-- ============================================================================
-- Migration: Add email column to profiles table
-- Purpose: Store email in profiles for easier querying (synced from auth.users)
-- ============================================================================

-- 1. Add email column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- 2. Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON public.profiles(email);

-- 3. Backfill email from auth.users
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
  AND profiles.email IS NULL;

-- 4. Create function to sync email when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email;
  
  RETURN NEW;
END;
$$;

-- 5. Create trigger to sync email on user creation/update
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT ON public.profiles TO anon, authenticated;
