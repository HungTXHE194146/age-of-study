-- ============================================================================
-- Migration: Badge XP Reward + Claim Tracking
-- Run once in Supabase SQL Editor.
-- ============================================================================

-- 1. Add xp_reward column to badges
ALTER TABLE public.badges
ADD COLUMN IF NOT EXISTS xp_reward INTEGER NOT NULL DEFAULT 50;

-- 2. Add xp_claimed_at to user_badges (null = unclaimed)
ALTER TABLE public.user_badges
ADD COLUMN IF NOT EXISTS xp_claimed_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Seed XP rewards per badge
UPDATE public.badges SET xp_reward = CASE id
  WHEN 'first_quiz'       THEN 50
  WHEN 'streak_7'         THEN 100
  WHEN 'streak_30'        THEN 300
  WHEN 'persistent'       THEN 75
  WHEN 'improvement_50'   THEN 150
  WHEN 'quiz_master'      THEN 500
  WHEN 'top_weekly'       THEN 200
  WHEN 'top_monthly'      THEN 400
  WHEN 'tier_silver'      THEN 100
  WHEN 'tier_gold'        THEN 250
  WHEN 'tier_diamond'     THEN 500
  ELSE 50
END;
