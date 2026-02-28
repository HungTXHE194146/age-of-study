-- ============================================================================
-- STUDENT PROGRESS & ACTIVITY LOG SYSTEM
-- Migration: add_student_node_progress.sql
-- Purpose: Track node completion and general student activities
-- ============================================================================

BEGIN;

-- 1. Student Node Progress Table
-- Tracks if a student has completed a specific node in the skill tree
CREATE TABLE IF NOT EXISTS public.student_node_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  node_id bigint NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  best_score integer DEFAULT 0,
  attempts_count integer DEFAULT 0,
  last_activity_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_student_node UNIQUE (student_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_student_node_progress_student ON public.student_node_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_node_progress_node ON public.student_node_progress(node_id);

-- 2. Activity Logs Table
-- Generic log for all student actions (XP gain, test completion, etc.)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'test_completed', 'node_unlocked', 'avatar_purchased', etc.
  description text,
  xp_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Safely add xp_earned if someone created the table without it earlier
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS xp_earned integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_activity_logs_student ON public.activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 3. Function to update student progress on test submission
-- This function will be called via RPC or trigger (manual RPC for now for control)
CREATE OR REPLACE FUNCTION public.handle_test_completion_progress(
  p_student_id uuid,
  p_test_id uuid,
  p_score integer,
  p_xp_earned integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_node_id bigint;
BEGIN
  -- 1. Get the node_id for this test
  SELECT node_id INTO v_node_id FROM public.tests WHERE id = p_test_id;

  -- 2. Update or insert node progress ONLY if it belongs to a node
  IF v_node_id IS NOT NULL THEN
    INSERT INTO public.student_node_progress (student_id, node_id, is_completed, completed_at, best_score, attempts_count)
    VALUES (p_student_id, v_node_id, (p_score >= 50), CASE WHEN p_score >= 50 THEN now() ELSE NULL END, p_score, 1)
    ON CONFLICT (student_id, node_id) DO UPDATE
    SET 
      is_completed = CASE WHEN p_score >= 50 THEN true ELSE student_node_progress.is_completed END,
      completed_at = CASE WHEN p_score >= 50 AND student_node_progress.completed_at IS NULL THEN now() ELSE student_node_progress.completed_at END,
      best_score = GREATEST(student_node_progress.best_score, p_score),
      attempts_count = student_node_progress.attempts_count + 1,
      last_activity_at = now();
  END IF;

  -- 3. Update student total XP in profiles
  UPDATE public.profiles
  SET total_xp = COALESCE(total_xp, 0) + p_xp_earned
  WHERE id = p_student_id;

  -- 4. Log the activity
  INSERT INTO public.activity_logs (student_id, activity_type, description, xp_earned, metadata)
  VALUES (
    p_student_id, 
    'test_completed', 
    'Hoàn thành bài tập với điểm số ' || p_score || '%', 
    p_xp_earned, 
    jsonb_build_object('test_id', p_test_id, 'node_id', v_node_id, 'score', p_score)
  );
END;
$$;

-- Grant permissions
ALTER TABLE public.student_node_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress" ON public.student_node_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can view own logs" ON public.activity_logs FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student progress" ON public.student_node_progress FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'system_admin')));
CREATE POLICY "Teachers can view student logs" ON public.activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'system_admin')));

GRANT EXECUTE ON FUNCTION public.handle_test_completion_progress(uuid, uuid, integer, integer) TO authenticated;

COMMIT;
