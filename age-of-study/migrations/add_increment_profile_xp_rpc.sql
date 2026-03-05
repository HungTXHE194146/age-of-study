-- Migration: add_increment_profile_xp_rpc
-- Adds an atomic function that increments a student's XP columns and
-- adjusts current_streak / freeze_count in a single UPDATE statement,
-- eliminating the read-then-update race condition in syncTestProgressAction.

CREATE OR REPLACE FUNCTION increment_profile_xp(
  p_student_id     UUID,
  p_xp_delta       INTEGER,  -- XP to add (always positive)
  p_streak_delta   INTEGER,  -- signed change to current_streak (can be negative for reset)
  p_freeze_delta   INTEGER,  -- signed change to freeze_count (usually negative = consumed)
  p_last_study_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    total_xp        = total_xp   + p_xp_delta,
    weekly_xp       = weekly_xp  + p_xp_delta,
    monthly_xp      = monthly_xp + p_xp_delta,
    -- When resetting streak (delta is negative enough), ensure we floor at 1
    current_streak  = GREATEST(1, current_streak + p_streak_delta),
    -- Consume freezes but never drop below 0
    freeze_count    = GREATEST(0, COALESCE(freeze_count, 0) + p_freeze_delta),
    last_study_date = p_last_study_date,
    updated_at      = now()
  WHERE id = p_student_id;
END;
$$;

-- Allow the service_role (server action) to call this function
REVOKE ALL ON FUNCTION increment_profile_xp FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_profile_xp TO service_role;
