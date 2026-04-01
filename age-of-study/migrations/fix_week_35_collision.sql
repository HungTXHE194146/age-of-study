-- ============================================================================
-- FIX WEEK 35 VS 27 COLLISION AND UNIQUE CONSTRAINT (Tiếng Việt 5)
-- Purpose: 
-- 1. Update unique index to include week_number (allowing duplicate titles across weeks)
-- 2. Move incorrectly merged Week 35 lessons to their own nodes.
-- ============================================================================

-- STEP 1: Update Unique Index to include week_number
-- This is NECESSARY because many weeks share the same lesson titles (e.g. "Ôn tập")
DROP INDEX IF EXISTS public.idx_nodes_subject_title_type_volume;

-- Recreate index including week_number
-- Note: week_number can be NULL, which is fine as Postgres handles NULLs in unique indexes correctly for our needs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_subject_title_type_vol_week 
  ON public.nodes(subject_id, title, node_type, volume_number, week_number) 
  WHERE subject_id IS NOT NULL;

-- STEP 2: Surgical Fix for Week 35 vs 27
DO $$
DECLARE
    v_tv5_id bigint;
    v_w27_node_id bigint;
    v_w35_node_id bigint;
BEGIN
    SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
    
    IF v_tv5_id IS NULL THEN
        RAISE NOTICE 'TV5 subject not found, skipping...';
        RETURN;
    END IF;

    -- 1. Find the "Bài 1: Ôn tập: Tiết 1 - 2" node that is currently Week 27
    SELECT id INTO v_w27_node_id 
    FROM public.nodes 
    WHERE subject_id = v_tv5_id 
      AND title = 'Bài 1: Ôn tập: Tiết 1 - 2' 
      AND week_number = 27;

    IF v_w27_node_id IS NOT NULL THEN
        -- Check if a Week 35 node already exists
        SELECT id INTO v_w35_node_id 
        FROM public.nodes 
        WHERE subject_id = v_tv5_id 
          AND title = 'Bài 1: Ôn tập: Tiết 1 - 2' 
          AND week_number = 35;

        -- If not, create it (now possible thanks to the updated index)
        IF v_w35_node_id IS NULL THEN
            INSERT INTO public.nodes (subject_id, title, node_type, week_number, volume_number, order_index, description)
            VALUES (v_tv5_id, 'Bài 1: Ôn tập: Tiết 1 - 2', 'lesson', 35, 2, 341, 'Tuần 35 - Ôn tập cuối năm')
            RETURNING id INTO v_w35_node_id;
            
            RAISE NOTICE 'Created new Week 35 node (ID: %)', v_w35_node_id;
        END IF;

        -- Move sections that belong to Week 35
        UPDATE public.lesson_sections
        SET node_id = v_w35_node_id
        WHERE node_id = v_w27_node_id
          AND (
            title ILIKE '%cuối năm%' 
            OR title ILIKE '%Qua Thậm Thình%'
            OR source_url ILIKE '%tuan-35%'
          );
          
        RAISE NOTICE 'Moved Week 35 sections to proper node.';
    END IF;

    -- 2. Fix "Bài 2" as well if it collided
    SELECT id INTO v_w27_node_id 
    FROM public.nodes 
    WHERE subject_id = v_tv5_id 
      AND title ILIKE 'Bài 2: Đánh giá%' 
      AND week_number = 27;

    IF v_w27_node_id IS NOT NULL THEN
        SELECT id INTO v_w35_node_id 
        FROM public.nodes 
        WHERE subject_id = v_tv5_id 
          AND title ILIKE 'Bài 2: Đánh giá%' 
          AND week_number = 35;

        IF v_w35_node_id IS NULL THEN
            INSERT INTO public.nodes (subject_id, title, node_type, week_number, volume_number, order_index, description)
            VALUES (v_tv5_id, 'Bài 2: Đánh giá cuối năm học', 'lesson', 35, 2, 342, 'Tuần 35 - Đánh giá cuối năm')
            RETURNING id INTO v_w35_node_id;
        END IF;

        UPDATE public.lesson_sections
        SET node_id = v_w35_node_id
        WHERE node_id = v_w27_node_id
          AND (
            title ILIKE '%cuối năm%' 
            OR source_url ILIKE '%tuan-35%'
          );
    END IF;

END $$;
