-- ============================================================================
-- AUTO BADGE AWARD SYSTEM
-- Migration: add_badge_auto_award.sql
-- Purpose: Function to check and auto-award badges when conditions are met
-- ============================================================================

-- Drop existing function if exists (needed when changing return type)
DROP FUNCTION IF EXISTS public.check_and_award_badges(uuid);

-- Function to check and award badges for a user
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS TABLE(
  result_badge_id text,
  result_badge_name text,
  result_newly_awarded boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge RECORD;
  v_user_profile RECORD;
  v_condition_met boolean;
  v_current_value integer;
  v_already_earned boolean;
BEGIN
  -- Get user profile with stats
  SELECT 
    current_streak,
    total_xp,
    weekly_xp,
    monthly_xp,
    tier
  INTO v_user_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Loop through all badges
  FOR v_badge IN 
    SELECT * FROM public.badges
    ORDER BY condition_value ASC
  LOOP
    -- Check if user already has this badge
    SELECT EXISTS(
      SELECT 1 FROM public.user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) INTO v_already_earned;

    -- Skip if already earned
    IF v_already_earned THEN
      CONTINUE;
    END IF;

    -- Check if condition is met
    v_condition_met := false;
    v_current_value := 0;

    CASE v_badge.condition_type
      WHEN 'streak' THEN
        v_current_value := v_user_profile.current_streak;
        v_condition_met := v_current_value >= v_badge.condition_value;

      WHEN 'quiz_count' THEN
        -- Count completed quizzes
        SELECT COUNT(*)::integer INTO v_current_value
        FROM public.test_submissions
        WHERE student_id = p_user_id AND status = 'completed';
        v_condition_met := v_current_value >= v_badge.condition_value;

      WHEN 'tier' THEN
        -- Check if user reached tier
        v_condition_met := CASE v_badge.condition_value
          WHEN 1 THEN v_user_profile.tier IN ('bronze', 'silver', 'gold', 'diamond')
          WHEN 2 THEN v_user_profile.tier IN ('silver', 'gold', 'diamond')
          WHEN 3 THEN v_user_profile.tier IN ('gold', 'diamond')
          WHEN 4 THEN v_user_profile.tier = 'diamond'
          ELSE false
        END;

      WHEN 'top_weekly' THEN
        -- Check if in top 3 weekly
        WITH weekly_rank AS (
          SELECT user_id, RANK() OVER (ORDER BY weekly_xp DESC) as rank
          FROM public.profiles
          WHERE role = 'student'
        )
        SELECT rank <= 3 INTO v_condition_met
        FROM weekly_rank
        WHERE user_id = p_user_id;

      WHEN 'top_monthly' THEN
        -- Check if in top 3 monthly
        WITH monthly_rank AS (
          SELECT user_id, RANK() OVER (ORDER BY monthly_xp DESC) as rank
          FROM public.profiles
          WHERE role = 'student'
        )
        SELECT rank <= 3 INTO v_condition_met
        FROM monthly_rank
        WHERE user_id = p_user_id;

      ELSE
        -- Unknown condition type, skip
        CONTINUE;
    END CASE;

    -- Award badge if condition met
    IF v_condition_met THEN
      INSERT INTO public.user_badges (user_id, badge_id, earned_at)
      VALUES (p_user_id, v_badge.id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING;

      -- Return this badge as newly awarded
      RETURN QUERY SELECT v_badge.id::text, v_badge.name::text, true::boolean;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO authenticated;

-- Comments
COMMENT ON FUNCTION public.check_and_award_badges IS 'Checks user stats and automatically awards badges when conditions are met';

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Call after student completes a quiz:
--   SELECT * FROM check_and_award_badges('user-uuid-here');
--
-- Returns list of newly awarded badges (if any)
-- ============================================================================
