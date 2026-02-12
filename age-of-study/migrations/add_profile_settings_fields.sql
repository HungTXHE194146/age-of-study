-- Add missing fields to profiles table for student settings
-- Run this migration if these columns don't exist yet

-- Add age column (6-12 for primary school students)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add grade column (1-5 for primary school)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS grade INTEGER;

-- Add favorite_subject column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS favorite_subject TEXT;

-- Add profile completion reward tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_completed_reward_claimed BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN profiles.age IS 'Student age (6-12 for primary school)';
COMMENT ON COLUMN profiles.grade IS 'Student grade level (1-5 for primary school)';
COMMENT ON COLUMN profiles.favorite_subject IS 'Student favorite subject (math, english, vietnamese, etc.)';
COMMENT ON COLUMN profiles.profile_completed_reward_claimed IS 'Tracks if student has received 100 XP reward for completing profile';
