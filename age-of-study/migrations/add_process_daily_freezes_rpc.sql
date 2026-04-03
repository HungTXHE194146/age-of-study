-- Migration: add_process_daily_freezes_rpc
-- Called by the Vercel Cron Job at 00:00 VN time (17:00 UTC) every day.
--
-- For students whose last_study_date = yesterday:
--   • freeze_count > 0  → consume 1 freeze, preserve streak
--   • freeze_count = 0  → reset current_streak to 0
--
-- Students who studied today are skipped (streak safe).
-- Students with last_study_date older than yesterday already have a broken
-- streak; the per-submit logic in testActions handles multi-day catch-up.

CREATE OR REPLACE FUNCTION process_daily_freezes(
  p_yesterday DATE,   -- VN yesterday, e.g. '2026-04-02'
  p_today     DATE    -- VN today,     e.g. '2026-04-03'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_frozen_count  INTEGER := 0;
  v_reset_count   INTEGER := 0;
BEGIN
  -- ── 1. Students who missed yesterday: have a freeze ────────────────────────
  -- Consume exactly 1 freeze and keep their streak unchanged.
  UPDATE profiles
  SET
    freeze_count = freeze_count - 1,
    updated_at   = now()
  WHERE
    last_study_date = p_yesterday   -- missed today; last active was yesterday
    AND freeze_count > 0;

  GET DIAGNOSTICS v_frozen_count = ROW_COUNT;

  -- ── 2. Students who missed yesterday: NO freeze left ──────────────────────
  -- Reset their streak to 0.
  UPDATE profiles
  SET
    current_streak = 0,
    updated_at     = now()
  WHERE
    last_study_date = p_yesterday
    AND (freeze_count IS NULL OR freeze_count = 0)
    AND current_streak > 0;

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'streaks_frozen', v_frozen_count,
    'streaks_reset',  v_reset_count
  );
END;
$$;

-- Only the service_role (Vercel backend) may call this function.
REVOKE ALL ON FUNCTION process_daily_freezes(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_daily_freezes(DATE, DATE) TO service_role;
