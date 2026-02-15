-- ============================================================================
-- Migration: Test System Improvements
-- Purpose: Add subject_id to questions, essay type handling, auto max_xp calculation
-- Author: Teammate + integrated into migrations
-- ============================================================================

-- ============================================================================
-- PART 1: Add subject_id to questions table
-- ============================================================================

-- 1. Thêm cột subject_id
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS subject_id BIGINT REFERENCES public.subjects(id) ON DELETE SET NULL;

-- 2. (Quan trọng) Tự động điền subject_id cho các câu hỏi cũ dựa trên node_id
UPDATE public.questions q
SET subject_id = n.subject_id
FROM public.nodes n
WHERE q.node_id = n.id
  AND q.subject_id IS NULL; -- Chỉ cập nhật những dòng chưa có

-- 3. Tạo Trigger tự động (Optional nhưng khuyến nghị):
-- Khi insert câu hỏi có node_id, tự động điền subject_id để không bao giờ bị sai lệch
CREATE OR REPLACE FUNCTION public.auto_fill_question_subject()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu có node_id mà thiếu subject_id, tự động lấy từ bảng nodes
  IF NEW.node_id IS NOT NULL AND NEW.subject_id IS NULL THEN
    SELECT subject_id INTO NEW.subject_id FROM public.nodes WHERE id = NEW.node_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fill_subject ON public.questions;
CREATE TRIGGER trigger_fill_subject
BEFORE INSERT OR UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.auto_fill_question_subject();

-- Index để query câu hỏi theo môn học nhanh
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);

COMMENT ON COLUMN public.questions.subject_id IS 'Môn học - tự động sync từ node_id hoặc manual set';

-- ============================================================================
-- PART 2: Handle essay question type (correct_option_index = NULL for essays)
-- ============================================================================

-- 1. Tạo hàm dọn dẹp dữ liệu trước khi Insert/Update
CREATE OR REPLACE FUNCTION public.normalize_question_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu là bài tự luận, BẮT BUỘC set index thành NULL (dù frontend có gửi -1 hay 0)
  IF NEW.q_type = 'essay' THEN
    NEW.correct_option_index := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Gắn hàm này vào bảng questions (Chạy trước khi check constraint)
DROP TRIGGER IF EXISTS trigger_normalize_question ON public.questions;

CREATE TRIGGER trigger_normalize_question
BEFORE INSERT OR UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.normalize_question_data();

COMMENT ON FUNCTION public.normalize_question_data() IS 'Auto-normalize essay questions: set correct_option_index to NULL';

-- ============================================================================
-- PART 3: Auto-calculate test max_xp from test_questions
-- ============================================================================

-- 1. Thêm cột max_xp vào bảng tests (mặc định là 0)
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS max_xp INTEGER DEFAULT 0;

-- 2. Cập nhật dữ liệu cũ (Tính tổng điểm cho các bài test đã tồn tại trước đó)
UPDATE public.tests t
SET max_xp = COALESCE((
  SELECT SUM(points) 
  FROM public.test_questions tq 
  WHERE tq.test_id = t.id
), 0);

-- 3. Tạo hàm Trigger để tự động tính lại điểm
CREATE OR REPLACE FUNCTION public.auto_update_test_max_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu là hành động Thêm (INSERT) hoặc Sửa (UPDATE) câu hỏi
  IF TG_OP = 'INSERT' THEN
    -- Insert: acquire row lock then update
    PERFORM id FROM public.tests WHERE id = NEW.test_id FOR UPDATE;
    
    UPDATE public.tests
    SET max_xp = COALESCE((SELECT SUM(points) FROM public.test_questions WHERE test_id = NEW.test_id), 0)
    WHERE id = NEW.test_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if test_id changed
    IF NEW.test_id IS DISTINCT FROM OLD.test_id THEN
      -- Update both old and new tests with locks
      PERFORM id FROM public.tests WHERE id IN (OLD.test_id, NEW.test_id) FOR UPDATE;
      
      UPDATE public.tests
      SET max_xp = COALESCE((SELECT SUM(points) FROM public.test_questions WHERE test_id = OLD.test_id), 0)
      WHERE id = OLD.test_id;
      
      UPDATE public.tests
      SET max_xp = COALESCE((SELECT SUM(points) FROM public.test_questions WHERE test_id = NEW.test_id), 0)
      WHERE id = NEW.test_id;
    ELSE
      -- test_id unchanged, only update current test with lock
      PERFORM id FROM public.tests WHERE id = NEW.test_id FOR UPDATE;
      
      UPDATE public.tests
      SET max_xp = COALESCE((SELECT SUM(points) FROM public.test_questions WHERE test_id = NEW.test_id), 0)
      WHERE id = NEW.test_id;
    END IF;
    
  -- Nếu là hành động Xóa (DELETE) câu hỏi
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM id FROM public.tests WHERE id = OLD.test_id FOR UPDATE;
    
    UPDATE public.tests
    SET max_xp = COALESCE((SELECT SUM(points) FROM public.test_questions WHERE test_id = OLD.test_id), 0)
    WHERE id = OLD.test_id;
  END IF;
  
  RETURN NULL; -- Trigger AFTER không cần trả về dữ liệu
END;
$$ LANGUAGE plpgsql;

-- 4. Gắn Trigger vào bảng test_questions
DROP TRIGGER IF EXISTS trigger_sync_test_max_xp ON public.test_questions;

CREATE TRIGGER trigger_sync_test_max_xp
AFTER INSERT OR UPDATE OR DELETE ON public.test_questions
FOR EACH ROW EXECUTE FUNCTION public.auto_update_test_max_xp();

-- Index để query test theo max_xp
CREATE INDEX IF NOT EXISTS idx_tests_max_xp ON public.tests(max_xp);

COMMENT ON COLUMN public.tests.max_xp IS 'Tổng điểm tối đa của test - tự động tính từ SUM(test_questions.points)';
COMMENT ON FUNCTION public.auto_update_test_max_xp() IS 'Auto-sync test.max_xp when test_questions change';

-- ============================================================================
-- PART 4: Connect tests to classes (for teacher dashboard)
-- ============================================================================

-- 1. Add class_id to tests (optional - tests can be assigned to specific classes)
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tests.class_id IS 'Lớp được giao bài (NULL = chưa assign, hoặc dùng cho tất cả lớp)';

-- Index để query tests theo lớp
CREATE INDEX IF NOT EXISTS idx_tests_class ON public.tests(class_id) WHERE class_id IS NOT NULL;

-- 2. Test assignments (many-to-many: 1 test có thể giao cho nhiều lớp)
CREATE TABLE IF NOT EXISTS test_assignments (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ, -- Hạn nộp bài (optional)
  
  UNIQUE(test_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_test_assignments_test ON test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_class ON test_assignments(class_id);

COMMENT ON TABLE test_assignments IS 'Giao bài kiểm tra cho lớp (many-to-many: 1 test → nhiều lớp)';
COMMENT ON COLUMN test_assignments.due_date IS 'Hạn nộp bài (NULL = không giới hạn)';

-- RLS for test_assignments
ALTER TABLE test_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view test assignments"
  ON test_assignments FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'system_admin')) OR
    auth.uid() IN (SELECT student_id FROM class_students WHERE class_id = test_assignments.class_id AND status = 'active')
  );

CREATE POLICY "Teachers can manage test assignments"
  ON test_assignments FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'system_admin'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'system_admin'))
  );

-- ============================================================================
-- VERIFICATION QUERIES (For testing after migration)
-- ============================================================================

-- Check if subject_id is populated
-- SELECT COUNT(*) as total, COUNT(subject_id) as with_subject FROM questions;

-- Check max_xp calculation
-- SELECT id, title, max_xp, (SELECT SUM(points) FROM test_questions WHERE test_id = tests.id) as calculated FROM tests LIMIT 5;

-- Check essay questions have NULL correct_option_index
-- SELECT COUNT(*) FROM questions WHERE q_type = 'essay' AND correct_option_index IS NOT NULL;
