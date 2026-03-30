-- ============================================================================
-- Migration: Add RPC for atomic avatar purchase
-- Purpose: 1. Ensure atomicity (XP deduction + Unlock + Activity Log)
--          2. Solve SC-4 performance/reliability issue
-- ============================================================================

CREATE OR REPLACE FUNCTION purchase_avatar(
  p_user_id uuid,
  p_avatar_code text,
  p_cost integer,
  p_source text,
  p_avatar_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_xp integer;
  v_already_owned boolean;
BEGIN
  -- 1. Check current XP
  SELECT total_xp INTO v_current_xp FROM public.profiles WHERE id = p_user_id;
  IF v_current_xp < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không đủ XP để mở khóa avatar này!');
  END IF;

  -- 2. Check ownership
  SELECT EXISTS(
    SELECT 1 FROM public.user_avatars 
    WHERE user_id = p_user_id AND avatar_code = p_avatar_code AND is_unlocked = true
  ) INTO v_already_owned;
  
  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn đã có avatar này rồi!');
  END IF;

  -- 3. Deduct XP
  UPDATE public.profiles 
  SET total_xp = total_xp - p_cost, 
      updated_at = now()
  WHERE id = p_user_id;

  -- 4. Unlock avatar
  INSERT INTO public.user_avatars (user_id, avatar_code, avatar_type, is_unlocked, unlocked_at, xp_cost, source)
  VALUES (p_user_id, p_avatar_code, p_avatar_type, true, now(), p_cost, p_source)
  ON CONFLICT (user_id, avatar_code) DO UPDATE 
  SET is_unlocked = true, unlocked_at = now(), xp_cost = p_cost, source = p_source;

  -- 5. Log activity
  INSERT INTO public.activity_logs (student_id, activity_type, description, xp_earned, metadata)
  VALUES (
    p_user_id, 
    'avatar_purchased', 
    'Đã mua avatar: ' || p_avatar_code, 
    -p_cost, 
    jsonb_build_object('avatar_code', p_avatar_code, 'cost', p_cost)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION purchase_avatar(uuid, text, integer, text, text) IS 'Handles atomic avatar purchase: checks XP, checks ownership, deducts XP, unlocks avatar, and logs activity.';
