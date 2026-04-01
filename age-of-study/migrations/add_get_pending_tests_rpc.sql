-- ============================================================================
-- Migration: Add RPC to get pending tests for a student in a class
-- Purpose: Optimize SC-1 performance issue in student dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_tests_by_class(p_class_id bigint, p_student_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    class_id bigint,
    node_id bigint,
    type text,
    settings jsonb,
    is_published boolean,
    created_by uuid,
    created_at timestamptz,
    updated_at timestamptz
) 
CREATE OR REPLACE FUNCTION get_pending_tests_by_class(p_class_id bigint, p_student_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    class_id bigint,
    node_id bigint,
    type text,
    settings jsonb,
    is_published boolean,
    created_by uuid,
    created_at timestamptz,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    -- Verify the caller is authorized to view this data
    -- Option 1: Check if caller is the student
    IF auth.uid() != p_student_id THEN
        -- Option 2: Check if caller is enrolled in the class or is an instructor
        IF NOT EXISTS (
            SELECT 1 FROM class_members 
            WHERE class_id = p_class_id 
            AND user_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Unauthorized access to class data';
        END IF;
    END IF;

    RETURN QUERY
    SELECT t.id, t.title, t.class_id, t.node_id, t.type, t.settings, t.is_published, t.created_by, t.created_at, t.updated_at
    FROM tests t
    LEFT JOIN test_submissions ts ON t.id = ts.test_id AND ts.student_id = p_student_id
    WHERE t.class_id = p_class_id 
      AND t.is_published = true
      AND ts.id IS NULL;
END;
$;
      AND t.is_published = true
      AND ts.id IS NULL;
END;
$$;

COMMENT ON FUNCTION get_pending_tests_by_class(bigint, uuid) IS 'Returns tests in a class that a student has not yet submitted.';
