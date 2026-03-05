-- ============================================================================
-- Migration: Weekly & Monthly XP Reset via pg_cron
--
-- Prerequisites: pg_cron extension enabled in Supabase (pg_catalog schema is correct).
-- Run ONCE in the Supabase SQL Editor.
-- ============================================================================

-- Weekly reset: every Monday at 00:05 ICT = Sunday 17:05 UTC
SELECT cron.schedule(
  'reset-weekly-xp',
  '5 17 * * 0',
  $$
    UPDATE profiles
    SET
      previous_week_xp = COALESCE(weekly_xp, 0),
      weekly_xp        = 0
    WHERE role = 'student';
  $$
);

-- Monthly reset: 1st of each month at 00:00 UTC
-- (pg_cron does not support L notation; 00:00 UTC is acceptable for a monthly boundary)
SELECT cron.schedule(
  'reset-monthly-xp',
  '0 0 1 * *',
  $$
    UPDATE profiles
    SET
      previous_month_xp = COALESCE(monthly_xp, 0),
      monthly_xp        = 0
    WHERE role = 'student';
  $$
);

-- Verify: SELECT jobname, schedule, command FROM cron.job;
