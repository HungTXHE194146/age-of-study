-- ============================================================================
-- Migration: Fix C-1 Performance - Efficient Latest Activity & Progress
-- Purpose: Avoid over-fetching by using DISTINCT ON in the database
-- ============================================================================

-- 1. RPC for latest activity logs per student
CREATE OR REPLACE FUNCTION get_latest_activities_by_students(p_student_ids uuid[])
RETURNS TABLE (
  id uuid,
  student_id uuid,
  activity_type text,
  description text,
  xp_earned integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (a.student_id) 
    a.id, a.student_id, a.activity_type, a.description, a.xp_earned, a.created_at
  FROM activity_logs a
  WHERE a.student_id = ANY(p_student_ids)
  ORDER BY a.student_id, a.created_at DESC;
END;
$;

-- 2. RPC for latest node progress per student
CREATE OR REPLACE FUNCTION get_latest_progress_by_students(p_student_ids uuid[])
RETURNS TABLE (
  student_id uuid,
  node_id bigint,
  status text,
  score text,
  last_accessed_at timestamp with time zone,
  completed_at timestamp with time zone,
  node_title text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.student_id)
    p.student_id, p.node_id, p.status, p.score, p.last_accessed_at, p.completed_at, n.title
  FROM student_node_progress p
  JOIN nodes n ON p.node_id = n.id
  WHERE p.student_id = ANY(p_student_ids)
  ORDER BY p.student_id, p.last_accessed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
