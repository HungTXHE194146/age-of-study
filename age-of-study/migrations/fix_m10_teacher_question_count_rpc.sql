-- M-10: Optimize teacher question count with a single RPC call
-- This replaces 2 sequential queries in testService.ts

CREATE OR REPLACE FUNCTION get_teacher_question_count(teacher_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(tq.id)
    FROM test_questions tq
    JOIN tests t ON tq.test_id = t.id
    WHERE t.created_by = teacher_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
