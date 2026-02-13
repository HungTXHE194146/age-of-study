-- ============================================================================
-- Migration: Add Tier System & Personal Progress Tracking
-- Purpose: Redesign leaderboard to reduce "winner-takes-all" demotivation
-- ============================================================================

-- 1. Create Tier ENUM
CREATE TYPE tier_level AS ENUM ('bronze', 'silver', 'gold', 'diamond');

-- 2. Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tier tier_level DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS previous_week_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_month_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_tier_update TIMESTAMPTZ DEFAULT NOW();

-- 3. Create index for tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier) WHERE role = 'student';

-- 4. Function to calculate and update tier based on total_xp
CREATE OR REPLACE FUNCTION update_student_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
DECLARE
  new_tier tier_level;
BEGIN
  -- Only process students
  IF NEW.role != 'student' THEN
    RETURN NEW;
  END IF;

  -- Determine tier based on total_xp
  IF NEW.total_xp >= 3000 THEN
    new_tier := 'diamond';
  ELSIF NEW.total_xp >= 1500 THEN
    new_tier := 'gold';
  ELSIF NEW.total_xp >= 500 THEN
    new_tier := 'silver';
  ELSE
    new_tier := 'bronze';
  END IF;
  
  -- Update tier if changed
  IF new_tier != COALESCE(NEW.tier, 'bronze') THEN
    NEW.tier := new_tier;
    NEW.last_tier_update := NOW();
  END IF;
  
  RETURN NEW;
END;
$;

-- 5. Create trigger to auto-update tier on XP change
DROP TRIGGER IF EXISTS trigger_update_tier ON profiles;
CREATE TRIGGER trigger_update_tier
BEFORE UPDATE OF total_xp ON profiles
FOR EACH ROW
WHEN (OLD.total_xp IS DISTINCT FROM NEW.total_xp)
EXECUTE FUNCTION update_student_tier();

-- Also trigger on INSERT if total_xp is set
DROP TRIGGER IF EXISTS trigger_insert_tier ON profiles;
CREATE TRIGGER trigger_insert_tier
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.total_xp > 0)
EXECUTE FUNCTION update_student_tier();

-- 6. Backfill tier for existing students
UPDATE profiles
SET tier = CASE
  WHEN total_xp >= 3000 THEN 'diamond'::tier_level
  WHEN total_xp >= 1500 THEN 'gold'::tier_level
  WHEN total_xp >= 500 THEN 'silver'::tier_level
  ELSE 'bronze'::tier_level
END
WHERE role = 'student';

-- 7. Seed diverse badges (effort-based, not just result-based)
INSERT INTO badges (id, name, description, icon_url, condition_type, condition_value)
VALUES
  -- Existing result-based badges
  ('top_weekly', 'Thần đồng tuần', 'Top 3 bảng xếp hạng tuần', '🏆', 'rank_weekly', 3),
  ('top_monthly', 'Siêu sao tháng', 'Top 3 bảng xếp hạng tháng', '🌟', 'rank_monthly', 3),
  
  -- NEW: Effort-based badges
  ('streak_7', 'Ong chăm chỉ', 'Học liên tục 7 ngày', '🐝', 'streak', 7),
  ('streak_30', 'Chiến binh kiên cường', 'Học liên tục 30 ngày', '💪', 'streak', 30),
  ('persistent', 'Không bao giờ bỏ cuộc', 'Hoàn thành quiz dù sai nhiều lần', '🛡️', 'persistence', 1),
  ('improvement_50', 'Ngôi sao đang lên', 'Cải thiện 50% XP so với tuần trước', '⭐', 'improvement', 50),
  ('first_quiz', 'Bước đầu tiên', 'Hoàn thành quiz đầu tiên', '🎯', 'quiz_count', 1),
  ('quiz_master', 'Bậc thầy giải đố', 'Hoàn thành 100 quiz', '🧙', 'quiz_count', 100),
  
  -- Tier badges
  ('tier_silver', 'Huy hiệu Bạc', 'Đạt tier Bạc', '🥈', 'tier', 2),
  ('tier_gold', 'Huy hiệu Vàng', 'Đạt tier Vàng', '🥇', 'tier', 3),
  ('tier_diamond', 'Huy hiệu Kim cương', 'Đạt tier Kim cương', '💎', 'tier', 4)
ON CONFLICT (id) DO NOTHING;

-- 8. Comment documentation
COMMENT ON COLUMN profiles.tier IS 'Student tier: bronze (0-499), silver (500-1499), gold (1500-2999), diamond (3000+)';
COMMENT ON COLUMN profiles.previous_week_xp IS 'XP at end of last week, for calculating improvement %';
COMMENT ON COLUMN profiles.previous_month_xp IS 'XP at end of last month, for calculating improvement %';
COMMENT ON COLUMN profiles.last_tier_update IS 'Timestamp when tier was last changed';

-- 9. Create scheduled job placeholders (needs to be implemented in application code or cron)
-- TODO: Weekly job to copy weekly_xp -> previous_week_xp then reset weekly_xp
-- TODO: Monthly job to copy monthly_xp -> previous_month_xp then reset monthly_xp

COMMENT ON TYPE tier_level IS 'Student progress tiers to provide achievable goals for all students, not just top 3';
