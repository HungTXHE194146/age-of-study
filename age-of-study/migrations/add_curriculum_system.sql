-- ============================================================================
-- CURRICULUM SYSTEM MIGRATION
-- Migration: add_curriculum_system.sql
-- Purpose: Extend nodes table for curriculum hierarchy, add document chunks,
--          and seed Toán 5 + Tiếng Việt 5 curriculum trees
-- ============================================================================
-- NOTE: This migration runs as a single transaction. Either all changes
-- are applied or none are (atomic operation).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTEND NODES TABLE - Add curriculum metadata columns
-- ============================================================================
-- WHY: Current nodes table is flat (just title + parent_node_id). We need 
-- structured metadata so AI can find "Tuần 28, Bài 17" precisely without 
-- scanning all documents. This lets teachers select exact curriculum positions.

-- node_type: What level in the curriculum hierarchy
-- 'subject' = root (e.g., "Toán 5")
-- 'chapter' = chapter/theme (e.g., "Chương 1: Ôn tập và bổ sung")
-- 'week' = week grouping (used by Tiếng Việt, not Toán)
-- 'lesson' = individual lesson (e.g., "Bài 1: Ôn tập khái niệm phân số")
-- 'content' = content type within lesson (e.g., "Tập đọc", "Chính tả")

-- Backfill existing rows before adding NOT NULL constraint
UPDATE public.nodes SET node_type = 'lesson' WHERE node_type IS NULL;

ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS node_type text 
  DEFAULT 'lesson' NOT NULL
  CHECK (node_type IN ('subject', 'chapter', 'week', 'lesson', 'content'));

-- Add unique constraint for idempotent inserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_subject_title_type_unique 
  ON public.nodes(subject_id, title, node_type) 
  WHERE subject_id IS NOT NULL;

-- week_number: Which week in the curriculum (1-35). NULL for non-week nodes.
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS week_number integer;

-- lesson_number: Which lesson within its parent (1-N). NULL for non-lesson nodes.
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS lesson_number integer;

-- page_start, page_end: Page range in the textbook. Helps AI find exact content.
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS page_start integer;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS page_end integer;

-- content_label: Human-readable label for content type nodes
-- e.g., "Tập đọc", "Chính tả", "Luyện từ và câu", "Tập làm văn"
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS content_label text;

-- order_index: Display ordering within parent (replaces position_x/y for tree view)
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON public.nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_nodes_subject_type ON public.nodes(subject_id, node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_week ON public.nodes(subject_id, week_number);

-- ============================================================================
-- 2. DOCUMENT_CHUNKS TABLE - Stores AI-split document segments mapped to nodes
-- ============================================================================
-- WHY: A single PDF textbook contains many lessons. Smart chunking splits the
-- document by curriculum structure so each chunk maps to exactly one node.
-- This gives the AI precise context (only the relevant lesson's content)
-- instead of dumping the entire textbook.

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,        -- FK to documents table (the source file)
  node_id bigint,                   -- FK to nodes (which lesson this chunk belongs to)
  chunk_index integer NOT NULL,     -- Order within the document
  content text NOT NULL,            -- The actual text content of this chunk
  metadata jsonb DEFAULT '{}'::jsonb, -- Extra info: page numbers, headings, etc.
  status text DEFAULT 'pending'     -- pending | confirmed | rejected
    CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT document_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
  CONSTRAINT document_chunks_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_node ON public.document_chunks(node_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_status ON public.document_chunks(status);

-- FTS index for chunk content
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_fts 
  ON public.document_chunks USING gin(to_tsvector('simple', content));

-- RLS policies for document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Admin/Teachers can manage chunks (through document ownership)
CREATE POLICY "Users can view chunks of accessible documents" ON public.document_chunks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d 
      WHERE d.id = document_chunks.document_id
    )
  );

CREATE POLICY "Document owners can insert chunks" ON public.document_chunks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d 
      WHERE d.id = document_chunks.document_id 
      AND d.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can update chunks" ON public.document_chunks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d 
      WHERE d.id = document_chunks.document_id 
      AND d.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can delete chunks" ON public.document_chunks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d 
      WHERE d.id = document_chunks.document_id 
      AND d.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. ADD grade_level TO SUBJECTS TABLE (fix TypeScript type mismatch)
-- ============================================================================
-- WHY: The TypeScript Subject type declares grade_level but the DB doesn't have it.
-- This causes runtime issues when the code expects this field.

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS grade_level text;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add trigger to auto-update subjects.updated_at on UPDATE
CREATE OR REPLACE FUNCTION subjects_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION subjects_set_updated_at();

-- ============================================================================
-- 4. SEED CURRICULUM DATA
-- ============================================================================
-- Note: Uses INSERT ... ON CONFLICT DO NOTHING to be idempotent.
-- Run this AFTER creating subjects if they don't exist yet.

-- 4a. Ensure subjects exist
INSERT INTO public.subjects (code, name, description, grade_level)
VALUES 
  ('TOAN5', 'Toán 5', 'Môn Toán lớp 5 - Chương trình GDPT 2018', '5'),
  ('TV5', 'Tiếng Việt 5', 'Môn Tiếng Việt lớp 5 - Chương trình GDPT 2018', '5')
ON CONFLICT (code) DO UPDATE SET 
  grade_level = EXCLUDED.grade_level,
  description = EXCLUDED.description;

-- ============================================================================
-- 4b. TOÁN 5 CURRICULUM TREE
-- Structure: Subject → Chapter → Lesson
-- Based on SGK Toán 5 (Chương trình GDPT 2018)
-- ============================================================================
-- ⚠️  SELECT TOÀN BỘ BLOCK TỪ "DO $$" BÊN DƯỚI ĐẾN "END $$;" RỒI MỚI RUN!
-- Không thể chạy từng dòng INSERT bên trong riêng lẻ được!
DO $$
DECLARE
  v_toan5_id bigint;
  v_ch1_id bigint;
  v_ch2_id bigint;
  v_ch3_id bigint;
  v_ch4_id bigint;
  v_ch5_id bigint;
BEGIN
  -- Get the subject ID for Toán 5
  SELECT id INTO v_toan5_id FROM public.subjects WHERE code = 'TOAN5';
  
  -- Guard against NULL subject_id
  IF v_toan5_id IS NULL THEN
    RAISE NOTICE 'Toán 5 subject not found, skipping curriculum seed...';
    RETURN;
  END IF;
  
  -- Check if curriculum already seeded (count-based idempotency)
  IF (SELECT COUNT(*) FROM public.nodes WHERE subject_id = v_toan5_id AND node_type = 'chapter') >= 5 THEN
    RAISE NOTICE 'Toán 5 curriculum already seeded (found 5 chapters), skipping...';
    RETURN;
  END IF;

  -- Chapter 1: Ôn tập và bổ sung
  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_toan5_id, 'Chương 1: Ôn tập và bổ sung', 'Ôn tập kiến thức lớp 4 và bổ sung kiến thức mới', 'chapter', 1, NULL)
  RETURNING id INTO v_ch1_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, order_index, parent_node_id, page_start, page_end) VALUES
  (v_toan5_id, 'Bài 1: Ôn tập khái niệm phân số', 'lesson', 1, 1, v_ch1_id, 5, 7)
  ON CONFLICT (subject_id, title, node_type) DO NOTHING;
  (v_toan5_id, 'Bài 2: Ôn tập tính chất cơ bản của phân số', 'lesson', 2, 2, v_ch1_id, 5, 6),
  (v_toan5_id, 'Bài 3: Ôn tập so sánh hai phân số', 'lesson', 3, 3, v_ch1_id, 7, 8),
  (v_toan5_id, 'Bài 4: Phân số thập phân', 'lesson', 4, 4, v_ch1_id, 9, 10),
  (v_toan5_id, 'Bài 5: Ôn tập phép cộng và phép trừ phân số', 'lesson', 5, 5, v_ch1_id, 11, 12),
  (v_toan5_id, 'Bài 6: Ôn tập phép nhân và phép chia phân số', 'lesson', 6, 6, v_ch1_id, 13, 14),
  (v_toan5_id, 'Bài 7: Hỗn số', 'lesson', 7, 7, v_ch1_id, 15, 16),
  (v_toan5_id, 'Bài 8: Ôn tập về giải toán', 'lesson', 8, 8, v_ch1_id, 17, 18);

  -- Chapter 2: Số thập phân - Các phép tính với số thập phân
  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_toan5_id, 'Chương 2: Số thập phân', 'Số thập phân và các phép tính với số thập phân', 'chapter', 2, NULL)
  RETURNING id INTO v_ch2_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, order_index, parent_node_id, page_start, page_end) VALUES
  (v_toan5_id, 'Bài 9: Khái niệm số thập phân', 'lesson', 9, 1, v_ch2_id, 19, 20),
  (v_toan5_id, 'Bài 10: Hàng của số thập phân. Đọc, viết số thập phân', 'lesson', 10, 2, v_ch2_id, 21, 22),
  (v_toan5_id, 'Bài 11: Số thập phân bằng nhau', 'lesson', 11, 3, v_ch2_id, 23, 24),
  (v_toan5_id, 'Bài 12: So sánh số thập phân', 'lesson', 12, 4, v_ch2_id, 25, 26),
  (v_toan5_id, 'Bài 13: Phép cộng số thập phân', 'lesson', 13, 5, v_ch2_id, 27, 28),
  (v_toan5_id, 'Bài 14: Phép trừ số thập phân', 'lesson', 14, 6, v_ch2_id, 29, 30),
  (v_toan5_id, 'Bài 15: Phép nhân số thập phân', 'lesson', 15, 7, v_ch2_id, 31, 32),
  (v_toan5_id, 'Bài 16: Phép chia số thập phân', 'lesson', 16, 8, v_ch2_id, 33, 34),
  (v_toan5_id, 'Bài 17: Giải toán về tỉ số phần trăm', 'lesson', 17, 9, v_ch2_id, 35, 36);

  -- Chapter 3: Hình học
  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_toan5_id, 'Chương 3: Hình học', 'Hình tam giác, hình thang, hình tròn, hình hộp chữ nhật, hình lập phương', 'chapter', 3, NULL)
  RETURNING id INTO v_ch3_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, order_index, parent_node_id, page_start, page_end) VALUES
  (v_toan5_id, 'Bài 18: Hình tam giác', 'lesson', 18, 1, v_ch3_id, 37, 38),
  (v_toan5_id, 'Bài 19: Diện tích hình tam giác', 'lesson', 19, 2, v_ch3_id, 39, 40),
  (v_toan5_id, 'Bài 20: Hình thang', 'lesson', 20, 3, v_ch3_id, 41, 42),
  (v_toan5_id, 'Bài 21: Diện tích hình thang', 'lesson', 21, 4, v_ch3_id, 43, 44),
  (v_toan5_id, 'Bài 22: Hình tròn, đường tròn', 'lesson', 22, 5, v_ch3_id, 45, 46),
  (v_toan5_id, 'Bài 23: Chu vi và diện tích hình tròn', 'lesson', 23, 6, v_ch3_id, 47, 48),
  (v_toan5_id, 'Bài 24: Hình hộp chữ nhật. Hình lập phương', 'lesson', 24, 7, v_ch3_id, 49, 50),
  (v_toan5_id, 'Bài 25: Diện tích xung quanh và diện tích toàn phần hình hộp chữ nhật', 'lesson', 25, 8, v_ch3_id, 51, 52),
  (v_toan5_id, 'Bài 26: Thể tích hình hộp chữ nhật. Thể tích hình lập phương', 'lesson', 26, 9, v_ch3_id, 53, 54);

  -- Chapter 4: Đo lường
  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_toan5_id, 'Chương 4: Đo lường', 'Đo thời gian, vận tốc, quãng đường', 'chapter', 4, NULL)
  RETURNING id INTO v_ch4_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, order_index, parent_node_id, page_start, page_end) VALUES
  (v_toan5_id, 'Bài 27: Bảng đơn vị đo diện tích', 'lesson', 27, 1, v_ch4_id, 55, 56),
  (v_toan5_id, 'Bài 28: Bảng đơn vị đo thể tích', 'lesson', 28, 2, v_ch4_id, 57, 58),
  (v_toan5_id, 'Bài 29: Vận tốc, quãng đường, thời gian', 'lesson', 29, 3, v_ch4_id, 59, 60),
  (v_toan5_id, 'Bài 30: Ôn tập về đo lường', 'lesson', 30, 4, v_ch4_id, 61, 62);

  -- Chapter 5: Ôn tập cuối năm
  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_toan5_id, 'Chương 5: Ôn tập cuối năm', 'Ôn tập tổng hợp kiến thức cả năm', 'chapter', 5, NULL)
  RETURNING id INTO v_ch5_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, order_index, parent_node_id, page_start, page_end) VALUES
  (v_toan5_id, 'Bài 31: Ôn tập tổng hợp (Phần 1)', 'lesson', 31, 1, v_ch5_id, 63, 64),
  (v_toan5_id, 'Bài 32: Ôn tập tổng hợp (Phần 2)', 'lesson', 32, 2, v_ch5_id, 65, 66);

  RAISE NOTICE 'Toán 5 curriculum seeded successfully!';
END $$;

-- ============================================================================
-- 4c. TIẾNG VIỆT 5 - Chủ điểm 1: Tổ quốc (Tuần 1-3)
-- ============================================================================
-- ⚠️  SELECT TOÀN BỘ BLOCK TỪ "DO $$" BÊN DƯỚI ĐẾN "END $$;" RỒI MỚI RUN!
-- Không thể chạy từng dòng INSERT bên trong riêng lẻ được!
DO $$
DECLARE
  v_tv5_id bigint;
  v_theme_id bigint;
  v_week_id bigint;
BEGIN
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
    -- Guard against NULL subject_id
  IF v_tv5_id IS NULL THEN
    RAISE NOTICE 'Tiếng Việt 5 subject not found, skipping chủ điểm 1 seed...';
    RETURN;
  END IF;
    IF EXISTS (SELECT 1 FROM public.nodes WHERE subject_id = v_tv5_id AND title = 'Chủ điểm 1: Tổ quốc') THEN
    RAISE NOTICE 'Chủ điểm 1 đã tồn tại, bỏ qua...';
    RETURN;
  END IF;

  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Chủ điểm 1: Tổ quốc', 'Chủ đề về Tổ quốc Việt Nam', 'chapter', 1, NULL)
  RETURNING id INTO v_theme_id;

  -- Tuần 1
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 1', 'week', 1, 1, v_theme_id) RETURNING id INTO v_week_id;
  
  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id, page_start, page_end) VALUES
  (v_tv5_id, 'Thư gửi các học sinh', 'content', 1, 'Tập đọc', 1, v_week_id, 3, 5),
  (v_tv5_id, 'Từ đồng nghĩa', 'content', 1, 'Luyện từ và câu', 2, v_week_id, 6, 7),
  (v_tv5_id, 'Cấu tạo bài văn tả cảnh', 'content', 1, 'Tập làm văn', 3, v_week_id, 8, 9),
  (v_tv5_id, 'Quang cảnh làng mạc ngày mùa', 'content', 2, 'Tập đọc', 4, v_week_id, 10, 11),
  (v_tv5_id, 'Luyện tập về từ đồng nghĩa', 'content', 2, 'Luyện từ và câu', 5, v_week_id, 12, 13),
  (v_tv5_id, 'Luyện tập tả cảnh', 'content', 2, 'Tập làm văn', 6, v_week_id, 14, 15);

  -- Tuần 2
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 2', 'week', 2, 2, v_theme_id) RETURNING id INTO v_week_id;
  
  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id, page_start, page_end) VALUES
  (v_tv5_id, 'Nghìn năm văn hiến', 'content', 3, 'Tập đọc', 1, v_week_id, 16, 17),
  (v_tv5_id, 'Mở rộng vốn từ: Tổ quốc', 'content', 3, 'Luyện từ và câu', 2, v_week_id, 18, 19),
  (v_tv5_id, 'Luyện tập tả cảnh (tiếp)', 'content', 3, 'Tập làm văn', 3, v_week_id, 20, 21),
  (v_tv5_id, 'Sắc màu em yêu', 'content', 4, 'Tập đọc', 4, v_week_id, 22, 23),
  (v_tv5_id, 'Luyện tập về từ đồng nghĩa (tiếp)', 'content', 4, 'Luyện từ và câu', 5, v_week_id, 24, 25),
  (v_tv5_id, 'Luyện tập tả cảnh (hoàn chỉnh)', 'content', 4, 'Tập làm văn', 6, v_week_id, 26, 27);

  -- Tuần 3
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 3', 'week', 3, 3, v_theme_id) RETURNING id INTO v_week_id;
  
  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id, page_start, page_end) VALUES
  (v_tv5_id, 'Lòng dân', 'content', 5, 'Tập đọc', 1, v_week_id, 28, 30),
  (v_tv5_id, 'Từ trái nghĩa', 'content', 5, 'Luyện từ và câu', 2, v_week_id, 31, 32),
  (v_tv5_id, 'Luyện tập tả cảnh (sông nước)', 'content', 5, 'Tập làm văn', 3, v_week_id, 33, 34),
  (v_tv5_id, 'Lòng dân (tiếp)', 'content', 6, 'Tập đọc', 4, v_week_id, 35, 36),
  (v_tv5_id, 'Luyện tập về từ trái nghĩa', 'content', 6, 'Luyện từ và câu', 5, v_week_id, 37, 38),
  (v_tv5_id, 'Tả cảnh sông nước', 'content', 6, 'Tập làm văn', 6, v_week_id, 39, 40);

  RAISE NOTICE 'Chủ điểm 1: Tổ quốc - seeded!';
END $$;

-- ============================================================================
-- 4d. TIẾNG VIỆT 5 - Chủ điểm 2: Cánh chim hòa bình (Tuần 4-5)
-- ============================================================================
-- ⚠️  SELECT TOÀN BỘ BLOCK TỪ "DO $$" BÊN DƯỚI ĐẾN "END $$;" RỒI MỚI RUN!
-- Không thể chạy từng dòng INSERT bên trong riêng lẻ được!
DO $$
DECLARE
  v_tv5_id bigint;
  v_theme_id bigint;
  v_week_id bigint;
BEGIN
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
    -- Guard against NULL subject_id
  IF v_tv5_id IS NULL THEN
    RAISE NOTICE 'Tiếng Việt 5 subject not found, skipping chủ điềm 2 seed...';
    RETURN;
  END IF;
    IF EXISTS (SELECT 1 FROM public.nodes WHERE subject_id = v_tv5_id AND title = 'Chủ điểm 2: Cánh chim hòa bình') THEN
    RAISE NOTICE 'Chủ điểm 2 đã tồn tại, bỏ qua...';
    RETURN;
  END IF;

  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Chủ điểm 2: Cánh chim hòa bình', 'Chủ đề về hòa bình và hữu nghị', 'chapter', 2, NULL)
  RETURNING id INTO v_theme_id;

  -- Tuần 4
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 4', 'week', 4, 1, v_theme_id) RETURNING id INTO v_week_id;
  
  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id, page_start, page_end) VALUES
  (v_tv5_id, 'Những con sếu bằng giấy', 'content', 7, 'Tập đọc', 1, v_week_id, 41, 43),
  (v_tv5_id, 'Từ đồng âm', 'content', 7, 'Luyện từ và câu', 2, v_week_id, 44, 45),
  (v_tv5_id, 'Tả cảnh (kiểm tra viết)', 'content', 7, 'Tập làm văn', 3, v_week_id, 46, 46),
  (v_tv5_id, 'Bài ca về trái đất', 'content', 8, 'Tập đọc', 4, v_week_id, 47, 48),
  (v_tv5_id, 'Mở rộng vốn từ: Hòa bình', 'content', 8, 'Luyện từ và câu', 5, v_week_id, 49, 50),
  (v_tv5_id, 'Trả bài văn tả cảnh', 'content', 8, 'Tập làm văn', 6, v_week_id, 51, 51);

  -- Tuần 5
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 5', 'week', 5, 2, v_theme_id) RETURNING id INTO v_week_id;
  
  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id, page_start, page_end) VALUES
  (v_tv5_id, 'Một chuyên gia máy xúc', 'content', 9, 'Tập đọc', 1, v_week_id, 52, 54),
  (v_tv5_id, 'Nhiều nghĩa của từ', 'content', 9, 'Luyện từ và câu', 2, v_week_id, 55, 56),
  (v_tv5_id, 'Luyện tập tả cảnh (trường học)', 'content', 9, 'Tập làm văn', 3, v_week_id, 57, 58),
  (v_tv5_id, 'Ê-mi-li, con...', 'content', 10, 'Tập đọc', 4, v_week_id, 59, 60),
  (v_tv5_id, 'Luyện tập về nhiều nghĩa của từ', 'content', 10, 'Luyện từ và câu', 5, v_week_id, 61, 62),
  (v_tv5_id, 'Tả cảnh trường học', 'content', 10, 'Tập làm văn', 6, v_week_id, 63, 64);

  RAISE NOTICE 'Chủ điểm 2: Cánh chim hòa bình - seeded!';
END $$;

-- ============================================================================
-- 4e. TIẾNG VIỆT 5 - Chủ điểm 3: Con người với thiên nhiên (Tuần 7)
-- ============================================================================
-- ⚠️  SELECT TOÀN BỘ BLOCK TỪ "DO $$" BÊN DƯỚI ĐẾN "END $$;" RỒI MỚI RUN!
-- Không thể chạy từng dòng INSERT bên trong riêng lẻ được!
DO $$
DECLARE
  v_tv5_id bigint;
  v_theme_id bigint;
  v_week_id bigint;
BEGIN
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
    -- Guard against NULL subject_id
  IF v_tv5_id IS NULL THEN
    RAISE NOTICE 'Tiếng Việt 5 subject not found, skipping chủ điềm 3 seed...';
    RETURN;
  END IF;
    IF EXISTS (SELECT 1 FROM public.nodes WHERE subject_id = v_tv5_id AND title = 'Chủ điểm 3: Con người với thiên nhiên') THEN
    RAISE NOTICE 'Chủ điểm 3 đã tồn tại, bỏ qua...';
    RETURN;
  END IF;

  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Chủ điểm 3: Con người với thiên nhiên', 'Chủ đề về mối quan hệ con người và thiên nhiên', 'chapter', 3, NULL)
  RETURNING id INTO v_theme_id;

  -- Tuần 7
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 7', 'week', 7, 1, v_theme_id) RETURNING id INTO v_week_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id, page_start, page_end) VALUES
  (v_tv5_id, 'Kì diệu rừng xanh', 'content', 13, 'Tập đọc', 1, v_week_id, 54, 56),
  (v_tv5_id, 'Đại từ', 'content', 13, 'Luyện từ và câu', 2, v_week_id, 57, 58),
  (v_tv5_id, 'Luyện tập tả cảnh (buổi sáng)', 'content', 13, 'Tập làm văn', 3, v_week_id, 59, 60),
  (v_tv5_id, 'Trước cổng trời', 'content', 14, 'Tập đọc', 4, v_week_id, 61, 63),
  (v_tv5_id, 'Quan hệ từ', 'content', 14, 'Luyện từ và câu', 5, v_week_id, 64, 65),
  (v_tv5_id, 'Luyện tập tả cảnh (buổi chiều)', 'content', 14, 'Tập làm văn', 6, v_week_id, 66, 67);

  RAISE NOTICE 'Chủ điểm 3: Con người với thiên nhiên - seeded!';
END $$;

-- ============================================================================
-- 4f. TIẾNG VIỆT 5 - Chủ điểm 4: Giữ lấy màu xanh (Tuần 13)
-- ============================================================================
-- ⚠️  SELECT TOÀN BỘ BLOCK TỪ "DO $$" BÊN DƯỚI ĐẾN "END $$;" RỒI MỚI RUN!
-- Không thể chạy từng dòng INSERT bên trong riêng lẻ được!
DO $$
DECLARE
  v_tv5_id bigint;
  v_theme_id bigint;
  v_week_id bigint;
BEGIN
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
    -- Guard against NULL subject_id
  IF v_tv5_id IS NULL THEN
    RAISE NOTICE 'Tiếng Việt 5 subject not found, skipping chủ điềm 4 seed...';
    RETURN;
  END IF;
    IF EXISTS (SELECT 1 FROM public.nodes WHERE subject_id = v_tv5_id AND title = 'Chủ điểm 4: Giữ lấy màu xanh') THEN
    RAISE NOTICE 'Chủ điểm 4 đã tồn tại, bỏ qua...';
    RETURN;
  END IF;

  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Chủ điểm 4: Giữ lấy màu xanh', 'Chủ đề về bảo vệ môi trường', 'chapter', 4, NULL)
  RETURNING id INTO v_theme_id;

  -- Tuần 13
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 13', 'week', 13, 1, v_theme_id) RETURNING id INTO v_week_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id) VALUES
  (v_tv5_id, 'Người gác rừng tí hon', 'content', 25, 'Tập đọc', 1, v_week_id),
  (v_tv5_id, 'Mở rộng vốn từ: Bảo vệ môi trường', 'content', 25, 'Luyện từ và câu', 2, v_week_id),
  (v_tv5_id, 'Luyện tập tả người', 'content', 25, 'Tập làm văn', 3, v_week_id),
  (v_tv5_id, 'Trồng rừng ngập mặn', 'content', 26, 'Tập đọc', 4, v_week_id),
  (v_tv5_id, 'Ôn tập về từ loại', 'content', 26, 'Luyện từ và câu', 5, v_week_id),
  (v_tv5_id, 'Tả người (kiểm tra viết)', 'content', 26, 'Tập làm văn', 6, v_week_id);

  RAISE NOTICE 'Chủ điểm 4: Giữ lấy màu xanh - seeded!';
END $$;

-- ============================================================================
-- 4g. TIẾNG VIỆT 5 - Chủ điểm 5: Vì hạnh phúc con người (Tuần 19)
-- ============================================================================
-- ⚠️  SELECT TOÀN BỘ BLOCK TỪ "DO $$" BÊN DƯỚI ĐẾN "END $$;" RỒI MỚI RUN!
-- Không thể chạy từng dòng INSERT bên trong riêng lẻ được!
DO $$
DECLARE
  v_tv5_id bigint;
  v_theme_id bigint;
  v_week_id bigint;
BEGIN
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
  
  IF EXISTS (SELECT 1 FROM public.nodes WHERE subject_id = v_tv5_id AND title = 'Chủ điểm 5: Vì hạnh phúc con người') THEN
    RAISE NOTICE 'Chủ điểm 5 đã tồn tại, bỏ qua...';
    RETURN;
  END IF;

  INSERT INTO public.nodes (subject_id, title, description, node_type, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Chủ điểm 5: Vì hạnh phúc con người', 'Chủ đề về lao động và sáng tạo vì hạnh phúc', 'chapter', 5, NULL)
  RETURNING id INTO v_theme_id;

  -- Tuần 19
  INSERT INTO public.nodes (subject_id, title, node_type, week_number, order_index, parent_node_id)
  VALUES (v_tv5_id, 'Tuần 19', 'week', 19, 1, v_theme_id) RETURNING id INTO v_week_id;

  INSERT INTO public.nodes (subject_id, title, node_type, lesson_number, content_label, order_index, parent_node_id) VALUES
  (v_tv5_id, 'Người công dân số Một', 'content', 37, 'Tập đọc', 1, v_week_id),
  (v_tv5_id, 'Câu ghép', 'content', 37, 'Luyện từ và câu', 2, v_week_id),
  (v_tv5_id, 'Luyện tập tả người (ngoại hình)', 'content', 37, 'Tập làm văn', 3, v_week_id),
  (v_tv5_id, 'Người công dân số Một (tiếp)', 'content', 38, 'Tập đọc', 4, v_week_id),
  (v_tv5_id, 'Nối câu ghép bằng quan hệ từ', 'content', 38, 'Luyện từ và câu', 5, v_week_id),
  (v_tv5_id, 'Luyện tập tả người (hoạt động)', 'content', 38, 'Tập làm văn', 6, v_week_id);

  RAISE NOTICE 'Chủ điểm 5: Vì hạnh phúc con người - seeded!';
END $$;

-- ============================================================================
-- 5. HELPER FUNCTION: Get curriculum tree for a subject
-- ============================================================================
CREATE OR REPLACE FUNCTION get_curriculum_tree(p_subject_id bigint)
RETURNS TABLE (
  id bigint,
  title text,
  node_type text,
  parent_node_id bigint,
  week_number integer,
  lesson_number integer,
  content_label text,
  order_index integer,
  depth integer
) AS $$
WITH RECURSIVE tree AS (
  -- Base case: root nodes (no parent)
  SELECT 
    n.id, n.title, n.node_type, n.parent_node_id,
    n.week_number, n.lesson_number, n.content_label, n.order_index,
    0 AS depth
  FROM public.nodes n
  WHERE n.subject_id = p_subject_id AND n.parent_node_id IS NULL
  
  UNION ALL
  
  -- Recursive case: children
  SELECT 
    n.id, n.title, n.node_type, n.parent_node_id,
    n.week_number, n.lesson_number, n.content_label, n.order_index,
    t.depth + 1
  FROM public.nodes n
  INNER JOIN tree t ON n.parent_node_id = t.id
)
SELECT * FROM tree
ORDER BY depth, order_index;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 6. HELPER FUNCTION: Get all descendant node IDs for a given node
-- ============================================================================
-- WHY: When a teacher selects a chapter, we need to find all lessons under it
-- to retrieve relevant documents/questions for AI context.
CREATE OR REPLACE FUNCTION get_descendant_node_ids(p_node_id bigint)
RETURNS TABLE (node_id bigint) AS $$
WITH RECURSIVE descendants AS (
  SELECT id FROM public.nodes WHERE id = p_node_id
  UNION ALL
  SELECT n.id FROM public.nodes n
  INNER JOIN descendants d ON n.parent_node_id = d.id
)
SELECT id AS node_id FROM descendants;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN public.nodes.node_type IS 'Hierarchy level: subject, chapter, week, lesson, content';
COMMENT ON COLUMN public.nodes.week_number IS 'Curriculum week number (1-35), used by Tiếng Việt structure';
COMMENT ON COLUMN public.nodes.lesson_number IS 'Lesson number within parent chapter';
COMMENT ON COLUMN public.nodes.content_label IS 'Content type label: Tập đọc, Chính tả, Luyện từ và câu, etc.';
COMMENT ON COLUMN public.nodes.order_index IS 'Display ordering within parent node';
COMMENT ON TABLE public.document_chunks IS 'AI-split document segments mapped to curriculum nodes';
COMMENT ON FUNCTION get_curriculum_tree IS 'Returns the full curriculum tree for a subject as a flat list with depth';
COMMENT ON FUNCTION get_descendant_node_ids IS 'Returns all descendant node IDs for a given parent node';

COMMIT;
