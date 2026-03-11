-- ============================================================================
-- Migration: Add volume_number support + Update get_skill_tree RPC
--            + Cleanup broken TV5 data
-- 
-- Date: 2026-03-08
-- Purpose: Support linked-list skill tree with volume (Tập 1/Tập 2) split
-- ============================================================================

-- ============================================================================
-- 1. Add volume_number column to nodes table
-- ============================================================================

ALTER TABLE public.nodes 
  ADD COLUMN IF NOT EXISTS volume_number smallint;

-- CHECK constraint: only 1 or 2 (or NULL for subjects without volumes like Toán)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nodes_volume_number_check'
  ) THEN
    ALTER TABLE public.nodes 
      ADD CONSTRAINT nodes_volume_number_check 
      CHECK (volume_number IS NULL OR volume_number IN (1, 2));
  END IF;
END $$;

-- Index for filtering by subject + volume
CREATE INDEX IF NOT EXISTS idx_nodes_volume 
  ON public.nodes(subject_id, volume_number);

-- ============================================================================
-- 2. Update unique constraint to include volume_number
-- ============================================================================

DROP INDEX IF EXISTS idx_nodes_subject_title_type_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_subject_title_type_volume 
  ON public.nodes(subject_id, title, node_type, volume_number) 
  WHERE subject_id IS NOT NULL;

-- ============================================================================
-- 3. Update get_skill_tree RPC function
--    - Add p_volume_number parameter (optional, default NULL)
--    - Add volume_number and week_number to return columns
--    - Filter lesson-only nodes when volume is specified
-- ============================================================================

CREATE OR REPLACE FUNCTION get_skill_tree(
  p_subject_id bigint,
  p_volume_number smallint DEFAULT NULL
)
RETURNS TABLE(
    id bigint,
    title text,
    description text,
    parent_node_id bigint,
    node_type text,
    required_xp integer,
    position_x integer,
    position_y integer,
    order_index integer,
    volume_number smallint,
    week_number integer,
    source_position text,
    target_position text
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        n.id,
        n.title,
        n.description,
        n.parent_node_id,
        n.node_type,
        n.required_xp,
        n.position_x,
        n.position_y,
        n.order_index,
        n.volume_number,
        n.week_number,
        n.source_position,
        n.target_position
    FROM nodes n
    WHERE n.subject_id = p_subject_id
      -- When volume is specified, only return lesson nodes for that volume
      AND (
        p_volume_number IS NULL 
        OR (n.node_type = 'lesson' AND n.volume_number = p_volume_number)
      )
    ORDER BY 
        n.week_number ASC NULLS LAST,
        n.order_index ASC,
        CASE WHEN n.parent_node_id IS NULL THEN 0 ELSE 1 END;
$$;

-- ============================================================================
-- 4. Cleanup ALL broken TV5 nodes 
--    (both old-curriculum seeds AND broken KNTT import)
-- ============================================================================

DO $$
DECLARE
  v_tv5_id bigint;
  v_deleted_sections int;
  v_deleted_progress int;
  v_deleted_nodes int;
BEGIN
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
  
  IF v_tv5_id IS NULL THEN
    RAISE NOTICE 'TV5 subject not found, skipping cleanup...';
    RETURN;
  END IF;

  -- 4a. Delete lesson_sections that reference TV5 nodes
  DELETE FROM public.lesson_sections
  WHERE node_id IN (SELECT id FROM public.nodes WHERE subject_id = v_tv5_id);
  GET DIAGNOSTICS v_deleted_sections = ROW_COUNT;
  RAISE NOTICE 'Deleted % lesson_sections for TV5', v_deleted_sections;

  -- 4b. Delete student_node_progress for TV5 nodes
  DELETE FROM public.student_node_progress
  WHERE node_id IN (SELECT id FROM public.nodes WHERE subject_id = v_tv5_id);
  GET DIAGNOSTICS v_deleted_progress = ROW_COUNT;
  RAISE NOTICE 'Deleted % student_node_progress for TV5', v_deleted_progress;

  -- 4c. Set node_id = NULL on questions for TV5 nodes (don't delete questions)
  UPDATE public.questions
  SET node_id = NULL
  WHERE node_id IN (SELECT id FROM public.nodes WHERE subject_id = v_tv5_id);

  -- 4d. Set node_id = NULL on tests for TV5 nodes (don't delete tests)
  UPDATE public.tests
  SET node_id = NULL
  WHERE node_id IN (SELECT id FROM public.nodes WHERE subject_id = v_tv5_id);

  -- 4e. Delete document_chunks referencing TV5 nodes
  UPDATE public.document_chunks
  SET node_id = NULL
  WHERE node_id IN (SELECT id FROM public.nodes WHERE subject_id = v_tv5_id);

  -- 4f. Delete TV5 nodes (children first due to FK, then parents)
  -- Delete nodes with parents first (leaf nodes)
  DELETE FROM public.nodes 
  WHERE subject_id = v_tv5_id 
    AND parent_node_id IS NOT NULL
    AND parent_node_id NOT IN (
      SELECT id FROM public.nodes WHERE subject_id != v_tv5_id
    );
  
  -- Delete remaining TV5 nodes (root nodes)
  DELETE FROM public.nodes WHERE subject_id = v_tv5_id;
  GET DIAGNOSTICS v_deleted_nodes = ROW_COUNT;
  RAISE NOTICE 'Deleted % nodes for TV5', v_deleted_nodes;
  
  RAISE NOTICE 'TV5 cleanup complete!';
END $$;
