-- ============================================================================
-- Migration: Update Question Types Enum
-- Purpose: Add new question types introduced for interactive learning
-- ============================================================================

-- Thêm các giá trị mới vào enum question_type
-- Lưu ý: Lần lượt chạy từng lệnh nếu công cụ quản lý DB không hỗ trợ chạy gộp ALTER TYPE
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'word_ordering';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'matching';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'fill_in_blanks';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'categorization';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'find_error';

-- Comment để ghi chú
COMMENT ON TYPE public.question_type IS 'Các loại câu hỏi: trắc nghiệm, đúng sai, tự luận, sắp xếp, nối cặp, điền trống, phân loại, tìm lỗi sai';
