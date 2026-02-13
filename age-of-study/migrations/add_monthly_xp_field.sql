-- Add monthly_xp field to profiles table
-- This field will track XP earned in the current month

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monthly_xp INTEGER NOT NULL DEFAULT 0;

-- Add comment
COMMENT ON COLUMN profiles.monthly_xp IS 'XP earned in the current month, reset monthly';

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_monthly_xp ON profiles(monthly_xp DESC) WHERE role = 'student';

-- Note: You'll need to create a cron job or scheduled function to reset monthly_xp to 0 at the start of each month
