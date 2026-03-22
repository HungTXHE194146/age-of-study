-- Migration: Thêm tính năng Gợi ý (Hint) cho Câu hỏi và Test

-- 1. Thêm cột hint vào bảng questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS hint TEXT;

-- 2. Cập nhật các bài test hiện có để có show_hints = false trong settings (nếu cần)
-- Vì settings là jsonb, chúng ta có thể dùng jsonb_set để thêm trường mới nếu chưa có
UPDATE public.tests
SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb), 
    '{show_hints}', 
    'false'::jsonb, 
    true -- create if missing
)
WHERE settings->>'show_hints' IS NULL;
