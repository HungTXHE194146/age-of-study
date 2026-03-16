-- ============================================================================
-- Migration: Cập nhật Check Constraint cho bảng questions
-- Mục đích: Sửa lỗi "violates check constraint check_question_logic" 
-- do các loại câu hỏi mới (word_ordering, matching...) có correct_option_index = null
-- ============================================================================

-- 1. Xóa constraint cũ đang gây lỗi cản trở việc lưu data
ALTER TABLE public.questions 
DROP CONSTRAINT IF EXISTS check_question_logic;

-- 2. Thêm lại constraint mới linh hoạt hơn
-- Giải thích: 
-- - Với các câu 'multiple_choice' và 'true_false', BẮT BUỘC correct_option_index phải >= 0
-- - Với CÁC LOẠI CÂU HỎI KHÁC (essay, word_ordering, matching, fill_in_blanks...), cho phép correct_option_index bị NULL
ALTER TABLE public.questions 
ADD CONSTRAINT check_question_logic 
CHECK (
  (q_type IN ('multiple_choice', 'true_false') AND correct_option_index IS NOT NULL AND correct_option_index >= 0) 
  OR 
  (q_type NOT IN ('multiple_choice', 'true_false'))
);
